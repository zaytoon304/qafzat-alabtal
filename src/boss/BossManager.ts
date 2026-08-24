import { eventBus, GameEvents } from "../core/EventBus";
import type { MotionType } from "../core/Types";
import type { PlayerController } from "../players/PlayerController";

const ALL_MOTIONS: MotionType[] = ["JUMP", "DUCK", "MOVE_LEFT", "MOVE_RIGHT", "TURN", "RAISE_HAND"];
const TELEGRAPH_MS = 900; // وقت تحذير قبل الهجوم (يعطي الطفل فرصة يستعد)
const WINDOW_MS = 1600; // وقت الاستجابة المسموح
const DAMAGE_PER_HIT = 20;

type BossPhase = "IDLE" | "TELEGRAPH" | "WINDOW" | "COOLDOWN" | "FINISHED";

// نظام الزعيم — بند 18: سلسلة حركات حقيقية يجب على الطفل تنفيذها، وليس مجرد شخصية متحركة
export class BossManager {
  health = 100;
  maxHealth = 100;
  phase: BossPhase = "IDLE";
  requiredMotion: MotionType | null = null;
  private phaseTimer = 0;
  private motionSatisfiedBy: Set<number> = new Set();
  private active = false;

  constructor() {
    for (const motion of ALL_MOTIONS) {
      const eventName = {
        JUMP: GameEvents.VISION_JUMP,
        DUCK: GameEvents.VISION_DUCK,
        MOVE_LEFT: GameEvents.VISION_LEFT,
        MOVE_RIGHT: GameEvents.VISION_RIGHT,
        TURN: GameEvents.VISION_TURN,
        RAISE_HAND: GameEvents.VISION_RAISE_HAND,
      }[motion];
      eventBus.on(eventName, (p: { playerIndex: number }) => this.onMotion(motion, p.playerIndex));
    }
  }

  start(): void {
    this.active = true;
    this.health = this.maxHealth;
    this.phase = "IDLE";
    this.phaseTimer = 400;
    eventBus.emit(GameEvents.BOSS_SPAWN, { health: this.health });
  }

  stop(): void {
    this.active = false;
    this.phase = "IDLE";
  }

  private onMotion(motion: MotionType, playerIndex: number): void {
    if (!this.active || this.phase !== "WINDOW" || motion !== this.requiredMotion) return;
    this.motionSatisfiedBy.add(playerIndex);
  }

  update(deltaMs: number, players: PlayerController[]): void {
    if (!this.active) return;
    this.phaseTimer -= deltaMs;
    if (this.phaseTimer > 0) return;

    switch (this.phase) {
      case "IDLE":
        this.beginTelegraph();
        break;
      case "TELEGRAPH":
        this.phase = "WINDOW";
        this.phaseTimer = WINDOW_MS;
        this.motionSatisfiedBy.clear();
        break;
      case "WINDOW":
        this.resolveWindow(players);
        break;
      case "COOLDOWN":
        this.beginTelegraph();
        break;
    }
  }

  private beginTelegraph(): void {
    this.requiredMotion = ALL_MOTIONS[Math.floor(Math.random() * ALL_MOTIONS.length)];
    this.phase = "TELEGRAPH";
    this.phaseTimer = TELEGRAPH_MS;
    eventBus.emit(GameEvents.BOSS_ATTACK, { motion: this.requiredMotion });
  }

  private resolveWindow(players: PlayerController[]): void {
    const alivePlayers = players.filter((p) => p.isAlive);
    for (const player of alivePlayers) {
      if (this.motionSatisfiedBy.has(player.id)) {
        this.health = Math.max(0, this.health - DAMAGE_PER_HIT);
        eventBus.emit(GameEvents.BOSS_HIT, { playerIndex: player.id, bossHealth: this.health });
      } else {
        player.takeHit();
        eventBus.emit(GameEvents.BOSS_PLAYER_HIT, { playerIndex: player.id });
      }
    }

    if (this.health <= 0) {
      this.phase = "FINISHED";
      this.active = false;
      eventBus.emit(GameEvents.BOSS_DEFEATED, {});
      return;
    }

    this.phase = "COOLDOWN";
    this.phaseTimer = 700;
  }
}

export const bossManager = new BossManager();
