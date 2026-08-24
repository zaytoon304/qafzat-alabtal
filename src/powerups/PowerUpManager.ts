import { eventBus, GameEvents } from "../core/EventBus";
import { difficultyManager } from "../game/DifficultyManager";
import { scoreManager } from "../scoring/ScoreManager";
import type { PlayerController } from "../players/PlayerController";
import { TRACK_SPAWN_X, TRACK_HIT_LINE_X, TRACK_CLEANUP_X } from "../game/TrackGeometry";

export type PowerUpKind = "SPEED_BOOST" | "SHIELD" | "EXTRA_LIFE" | "DOUBLE_SCORE" | "MAGNET";

export interface PowerUpDef {
  kind: PowerUpKind;
  icon: string;
  name: string;
  durationMs: number;
}

// بند 13: 5 أنواع Power-Up
export const POWERUP_DEFS: Record<PowerUpKind, PowerUpDef> = {
  SPEED_BOOST: { kind: "SPEED_BOOST", icon: "⚡", name: "اندفاع سريع", durationMs: 5000 },
  SHIELD: { kind: "SHIELD", icon: "🛡", name: "درع واقي", durationMs: 6000 },
  EXTRA_LIFE: { kind: "EXTRA_LIFE", icon: "❤️", name: "حياة إضافية", durationMs: 0 },
  DOUBLE_SCORE: { kind: "DOUBLE_SCORE", icon: "⭐", name: "نقاط مضاعفة", durationMs: 6000 },
  MAGNET: { kind: "MAGNET", icon: "🧲", name: "مغناطيس", durationMs: 6000 },
};

let nextId = 1;

export interface PowerUpInstance {
  id: number;
  def: PowerUpDef;
  lane: 0 | 1 | 2;
  x: number;
  collected: boolean;
}

const SPAWN_X = TRACK_SPAWN_X;
const COLLECT_LINE_X = TRACK_HIT_LINE_X;
const CLEANUP_X = TRACK_CLEANUP_X;

export class PowerUpManager {
  private items: PowerUpInstance[] = [];
  private spawnAccumulatorMs = 0;
  private running = false;
  private readonly spawnIntervalMs = 9000; // أندر من العملات

  start(): void {
    this.running = true;
    this.items = [];
    this.spawnAccumulatorMs = 0;
  }

  stop(): void {
    this.running = false;
    this.items = [];
  }

  getActive(): PowerUpInstance[] {
    return this.items;
  }

  update(deltaMs: number, players: PlayerController[]): void {
    if (!this.running) return;

    this.spawnAccumulatorMs += deltaMs;
    if (this.spawnAccumulatorMs >= this.spawnIntervalMs) {
      this.spawnAccumulatorMs = 0;
      this.spawnOne();
    }

    const speed = difficultyManager.getObstacleSpeed() * 0.95;
    for (const item of this.items) {
      item.x -= speed * (deltaMs / 1000);
      if (!item.collected && item.x <= COLLECT_LINE_X) {
        for (const player of players) {
          if (!player.isAlive || item.collected) continue;
          if (player.lane === item.lane) {
            item.collected = true;
            this.applyEffect(player, item.def);
            eventBus.emit(GameEvents.POWERUP_COLLECTED, { playerIndex: player.id, kind: item.def.kind, id: item.id });
          }
        }
      }
    }

    this.items = this.items.filter((i) => i.x > CLEANUP_X);
  }

  private applyEffect(player: PlayerController, def: PowerUpDef): void {
    switch (def.kind) {
      case "SPEED_BOOST":
        player.applySpeedBoost(1.4, def.durationMs);
        break;
      case "SHIELD":
        player.applyShield(def.durationMs);
        break;
      case "EXTRA_LIFE":
        player.addExtraLife();
        break;
      case "DOUBLE_SCORE":
        scoreManager.activateDoubleScore(player.id, def.durationMs);
        break;
      case "MAGNET":
        player.applyMagnet(def.durationMs);
        break;
    }
  }

  private spawnOne(): void {
    const kinds = Object.keys(POWERUP_DEFS) as PowerUpKind[];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
    const instance: PowerUpInstance = { id: nextId++, def: POWERUP_DEFS[kind], lane, x: SPAWN_X, collected: false };
    this.items.push(instance);
    eventBus.emit(GameEvents.POWERUP_SPAWN, { id: instance.id, kind });
  }
}

export const powerUpManager = new PowerUpManager();
