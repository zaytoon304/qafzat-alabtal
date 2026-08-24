import { eventBus, GameEvents } from "../core/EventBus";
import type { MotionType, ObstacleType } from "../core/Types";
import { OBSTACLE_DEFS, type ObstacleDef, type ObstacleLane } from "./ObstacleTypes";
import { difficultyManager } from "../game/DifficultyManager";
import { scoreManager } from "../scoring/ScoreManager";
import type { PlayerController } from "../players/PlayerController";
import { TRACK_SPAWN_X, TRACK_HIT_LINE_X, TRACK_CLEANUP_X } from "../game/TrackGeometry";

let nextId = 1;

export interface ObstacleInstance {
  id: number;
  def: ObstacleDef;
  x: number;
  lane: ObstacleLane;
  spawnedAt: number;
  resolved: boolean;
  reactionTimeMs: Map<number, number>; // playerIndex -> زمن الاستجابة إن أمكن قياسه
  movingPhaseStart: number;
}

const SPAWN_X = TRACK_SPAWN_X;
const HIT_LINE_X = TRACK_HIT_LINE_X;
const CLEANUP_X = TRACK_CLEANUP_X;

// أنواع تتطلب حركة فورية واحدة قابلة لقياس زمن الاستجابة بدقة (بند 30)
const SINGLE_MOTION_TYPES: ObstacleType[] = ["LOW_OBSTACLE", "PIT", "OVERHEAD_OBSTACLE"];

// ينشئ ويحرّك ويحلّل تصادم كل العوائق الستة — منطق مستقل عن الرسم (Phaser يقرأ فقط)
export class ObstacleManager {
  private obstacles: ObstacleInstance[] = [];
  private spawnAccumulatorMs = 0;
  private running = false;
  private allowedTypes: ObstacleType[] = Object.keys(OBSTACLE_DEFS) as ObstacleType[];

  constructor() {
    eventBus.on(GameEvents.VISION_JUMP, (p: { playerIndex: number }) => this.recordReaction(p.playerIndex, "JUMP"));
    eventBus.on(GameEvents.VISION_DUCK, (p: { playerIndex: number }) => this.recordReaction(p.playerIndex, "DUCK"));
  }

  start(allowedTypes?: ObstacleType[]): void {
    this.running = true;
    this.obstacles = [];
    this.spawnAccumulatorMs = 0;
    if (allowedTypes) this.allowedTypes = allowedTypes;
  }

  stop(): void {
    this.running = false;
    this.obstacles = [];
  }

  getActive(): ObstacleInstance[] {
    return this.obstacles;
  }

  private recordReaction(playerIndex: number, motion: MotionType): void {
    for (const obs of this.obstacles) {
      if (obs.resolved) continue;
      if (!SINGLE_MOTION_TYPES.includes(obs.def.type)) continue;
      if (!obs.def.requiredMotions.includes(motion)) continue;
      if (obs.reactionTimeMs.has(playerIndex)) continue;
      obs.reactionTimeMs.set(playerIndex, performance.now() - obs.spawnedAt);
    }
  }

  update(deltaMs: number, players: PlayerController[]): void {
    if (!this.running) return;

    this.spawnAccumulatorMs += deltaMs;
    const interval = difficultyManager.getSpawnIntervalMs();
    if (this.spawnAccumulatorMs >= interval) {
      this.spawnAccumulatorMs = 0;
      this.spawnOne();
    }

    const speed = difficultyManager.getObstacleSpeed();
    const now = performance.now();

    for (const obs of this.obstacles) {
      obs.x -= speed * (deltaMs / 1000);

      if (obs.def.laneMode === "MOVING") {
        const t = (now - obs.movingPhaseStart) / 1500;
        const lane = Math.round(1 + Math.sin(t) * 1); // يتأرجح بين المسارات 0..2
        obs.lane = Math.max(0, Math.min(2, lane)) as ObstacleLane;
      }

      if (!obs.resolved && obs.x <= HIT_LINE_X) {
        obs.resolved = true;
        this.resolve(obs, players);
      }
    }

    this.obstacles = this.obstacles.filter((o) => o.x > CLEANUP_X);
  }

  private spawnOne(): void {
    const type = this.allowedTypes[Math.floor(Math.random() * this.allowedTypes.length)];
    const def = OBSTACLE_DEFS[type];
    const lane: ObstacleLane =
      def.laneMode === "ALL" ? "ALL" : (Math.floor(Math.random() * 3) as ObstacleLane);

    const instance: ObstacleInstance = {
      id: nextId++,
      def,
      x: SPAWN_X,
      lane,
      spawnedAt: performance.now(),
      resolved: false,
      reactionTimeMs: new Map(),
      movingPhaseStart: performance.now(),
    };
    this.obstacles.push(instance);
    eventBus.emit(GameEvents.OBSTACLE_SPAWN, { id: instance.id, type, lane });
  }

  private resolve(obs: ObstacleInstance, players: PlayerController[]): void {
    for (const player of players) {
      if (!player.isAlive) continue;
      const passed = this.checkPass(obs, player);
      if (passed) {
        scoreManager.addObstaclePassed(player.id);
        difficultyManager.onObstaclePassed();
        eventBus.emit(GameEvents.OBSTACLE_PASSED, {
          id: obs.id,
          playerIndex: player.id,
          reactionTimeMs: obs.reactionTimeMs.get(player.id) ?? null,
        });
      } else {
        const absorbed = player.takeHit();
        difficultyManager.onObstacleHit();
        eventBus.emit(GameEvents.OBSTACLE_HIT, { id: obs.id, playerIndex: player.id, absorbedByShield: absorbed });
        eventBus.emit(GameEvents.PLAYER_COLLISION, { id: obs.id, playerIndex: player.id });
      }
    }
  }

  private checkPass(obs: ObstacleInstance, player: PlayerController): boolean {
    const def = obs.def;

    if (def.laneMode === "SINGLE" || def.laneMode === "MOVING") {
      // النجاة تكون بالابتعاد عن مسار العائق (استخدام MOVE_LEFT/MOVE_RIGHT)
      return player.lane !== obs.lane;
    }

    // ALL: يلزم تنفيذ كل الحركات المطلوبة بنفس اللحظة تقريباً (JUMP و/أو RAISE_HAND و/أو DUCK)
    return def.requiredMotions.every((motion) => {
      switch (motion) {
        case "JUMP":
          return player.isJumping;
        case "DUCK":
          return player.isDucking;
        case "RAISE_HAND":
          return player.isHandRaised;
        case "TURN":
          return player.isTurning;
        default:
          return false;
      }
    });
  }
}

export const obstacleManager = new ObstacleManager();
