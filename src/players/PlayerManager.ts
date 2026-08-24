import { eventBus, GameEvents } from "../core/EventBus";
import type { CharacterId, MotionType } from "../core/Types";
import { PlayerController } from "./PlayerController";
import { achievementManager } from "../scoring/AchievementManager";

const MOTION_EVENTS: Record<string, MotionType> = {
  [GameEvents.VISION_JUMP]: "JUMP",
  [GameEvents.VISION_DUCK]: "DUCK",
  [GameEvents.VISION_LEFT]: "MOVE_LEFT",
  [GameEvents.VISION_RIGHT]: "MOVE_RIGHT",
  [GameEvents.VISION_TURN]: "TURN",
  [GameEvents.VISION_RAISE_HAND]: "RAISE_HAND",
};

// يدير كل اللاعبين النشطين (لاعب واحد أو مجموعة) — بند 4/5
// لا يوجد "لاعب واحد" مكتوب بالكود بشكل ثابت؛ العدد قابل للتوسع بالكامل
export class PlayerManager {
  private players: Map<number, PlayerController> = new Map();
  private unsubscribers: Array<() => void> = [];

  constructor() {
    for (const [eventName, motion] of Object.entries(MOTION_EVENTS)) {
      const off = eventBus.on(eventName, (payload: { playerIndex: number; confidence: number }) => {
        const player = this.players.get(payload.playerIndex);
        player?.handleMotion(motion, performance.now());
      });
      this.unsubscribers.push(off);
    }
  }

  spawn(playerIndex: number, character: CharacterId): PlayerController {
    const p = new PlayerController(playerIndex, character);
    this.players.set(playerIndex, p);
    achievementManager.resetSession(playerIndex);
    return p;
  }

  get(playerIndex: number): PlayerController | undefined {
    return this.players.get(playerIndex);
  }

  all(): PlayerController[] {
    return Array.from(this.players.values());
  }

  aliveCount(): number {
    return this.all().filter((p) => p.isAlive).length;
  }

  isEveryoneOut(): boolean {
    return this.players.size > 0 && this.aliveCount() === 0;
  }

  clear(): void {
    this.players.clear();
  }

  dispose(): void {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
  }
}
