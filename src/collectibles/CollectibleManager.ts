import { eventBus, GameEvents } from "../core/EventBus";
import { difficultyManager } from "../game/DifficultyManager";
import { scoreManager } from "../scoring/ScoreManager";
import type { PlayerController } from "../players/PlayerController";
import { TRACK_SPAWN_X, TRACK_HIT_LINE_X, TRACK_CLEANUP_X } from "../game/TrackGeometry";

export type CollectibleKind = "STAR" | "COIN";

let nextId = 1;

export interface CollectibleInstance {
  id: number;
  kind: CollectibleKind;
  lane: 0 | 1 | 2;
  x: number;
  collectedBy: Set<number>;
}

const SPAWN_X = TRACK_SPAWN_X;
const COLLECT_LINE_X = TRACK_HIT_LINE_X;
const CLEANUP_X = TRACK_CLEANUP_X;

// النجوم والعملات — بند 12: تُجمع بمطابقة المسار، والمغناطيس (Power-Up) يجمعها من أي مسار
export class CollectibleManager {
  private items: CollectibleInstance[] = [];
  private spawnAccumulatorMs = 0;
  private running = false;
  private readonly spawnIntervalMs = 900;

  start(): void {
    this.running = true;
    this.items = [];
    this.spawnAccumulatorMs = 0;
  }

  stop(): void {
    this.running = false;
    this.items = [];
  }

  getActive(): CollectibleInstance[] {
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

      if (item.x <= COLLECT_LINE_X) {
        for (const player of players) {
          if (!player.isAlive || item.collectedBy.has(player.id)) continue;
          const inRange = player.lane === item.lane || player.isMagnetActive;
          if (inRange) {
            item.collectedBy.add(player.id);
            if (item.kind === "STAR") {
              scoreManager.addStar(player.id);
              eventBus.emit(GameEvents.COLLECT_STAR, { playerIndex: player.id, id: item.id });
            } else {
              scoreManager.addCoin(player.id);
              eventBus.emit(GameEvents.COLLECT_COIN, { playerIndex: player.id, id: item.id });
            }
          }
        }
      }
    }

    this.items = this.items.filter((i) => i.x > CLEANUP_X);
  }

  private spawnOne(): void {
    const kind: CollectibleKind = Math.random() < 0.7 ? "COIN" : "STAR";
    const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
    this.items.push({ id: nextId++, kind, lane, x: SPAWN_X, collectedBy: new Set() });
  }
}

export const collectibleManager = new CollectibleManager();
