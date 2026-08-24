import { eventBus, GameEvents } from "../core/EventBus";
import { GameConfig } from "../core/Config";
import type { BodyLandmark, MotionType, PlayerBaseline } from "../core/Types";
import { EdgeTrigger } from "./EdgeTrigger";
import { duckSignal, jumpSignal, lateralSignal, raiseHandSignal, turnSignal } from "./MotionSignals";

interface PlayerTriggers {
  jump: EdgeTrigger;
  duck: EdgeTrigger;
  right: EdgeTrigger;
  left: EdgeTrigger;
  turn: EdgeTrigger;
  raiseHand: EdgeTrigger;
}

const V = GameConfig.vision;

function makeTriggers(): PlayerTriggers {
  return {
    jump: new EdgeTrigger(V.jumpThresholdRatio, V.jumpThresholdRatio * 0.4, V.motionCooldownMs),
    duck: new EdgeTrigger(V.duckThresholdRatio, V.duckThresholdRatio * 0.4, V.motionCooldownMs),
    right: new EdgeTrigger(V.lateralThresholdRatio, V.lateralThresholdRatio * 0.4, V.motionCooldownMs),
    left: new EdgeTrigger(V.lateralThresholdRatio, V.lateralThresholdRatio * 0.4, V.motionCooldownMs),
    turn: new EdgeTrigger(V.turnShoulderRatioThreshold, V.turnShoulderRatioThreshold * 0.5, V.motionCooldownMs),
    raiseHand: new EdgeTrigger(V.raiseHandThresholdRatio, V.raiseHandThresholdRatio * 0.4, V.motionCooldownMs),
  };
}

// أحدث القيم المحسوبة لكل لاعب — يستخدمها Debug Mode فقط لعرضها (بند 34)
export interface MotionDebugSnapshot {
  jump: number;
  duck: number;
  lateral: number;
  turn: number;
  raiseHand: number;
}

const eventByMotion: Record<MotionType, string> = {
  JUMP: GameEvents.VISION_JUMP,
  DUCK: GameEvents.VISION_DUCK,
  MOVE_LEFT: GameEvents.VISION_LEFT,
  MOVE_RIGHT: GameEvents.VISION_RIGHT,
  TURN: GameEvents.VISION_TURN,
  RAISE_HAND: GameEvents.VISION_RAISE_HAND,
};

// يحوّل نقاط الجسم الخام + خط الأساس إلى أحداث حركة حقيقية على EventBus
// قابل لإضافة حركة سابعة مستقبلاً بدون تعديل أي نظام آخر: فقط أضف Signal + Trigger + Event هنا
export class MotionRecognition {
  private triggersByPlayer: Map<number, PlayerTriggers> = new Map();
  private lastSnapshot: Map<number, MotionDebugSnapshot> = new Map();

  private getTriggers(playerIndex: number): PlayerTriggers {
    let t = this.triggersByPlayer.get(playerIndex);
    if (!t) {
      t = makeTriggers();
      this.triggersByPlayer.set(playerIndex, t);
    }
    return t;
  }

  resetPlayer(playerIndex: number): void {
    this.triggersByPlayer.delete(playerIndex);
  }

  process(playerIndex: number, landmarks: BodyLandmark[], baseline: PlayerBaseline, now: number): void {
    const t = this.getTriggers(playerIndex);

    const jump = jumpSignal(landmarks, baseline);
    const duck = duckSignal(landmarks, baseline);
    const lateral = lateralSignal(landmarks, baseline);
    const turn = turnSignal(landmarks, baseline);
    const raiseHand = raiseHandSignal(landmarks, baseline);

    this.lastSnapshot.set(playerIndex, { jump, duck, lateral, turn, raiseHand });

    // القفز والانحناء متنافيان بنفس اللحظة — لا داعي لمنع تعارض لأن الإشارتين متعاكستان بالمعنى
    if (t.jump.update(jump, now)) this.fire("JUMP", playerIndex, jump);
    if (t.duck.update(duck, now)) this.fire("DUCK", playerIndex, duck);
    if (t.right.update(lateral, now)) this.fire("MOVE_RIGHT", playerIndex, lateral);
    if (t.left.update(-lateral, now)) this.fire("MOVE_LEFT", playerIndex, -lateral);
    if (t.turn.update(turn, now)) this.fire("TURN", playerIndex, turn);
    if (t.raiseHand.update(raiseHand, now)) this.fire("RAISE_HAND", playerIndex, raiseHand);
  }

  private fire(motion: MotionType, playerIndex: number, confidence: number): void {
    eventBus.emit(eventByMotion[motion], { playerIndex, motion, confidence, timestamp: performance.now() });
  }

  getSnapshot(playerIndex: number): MotionDebugSnapshot | null {
    return this.lastSnapshot.get(playerIndex) ?? null;
  }
}

export const motionRecognition = new MotionRecognition();
