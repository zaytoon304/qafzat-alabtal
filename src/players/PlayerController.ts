import { eventBus, GameEvents } from "../core/EventBus";
import { GameConfig } from "../core/Config";
import type { CharacterId, MotionType } from "../core/Types";
import { scoreManager } from "../scoring/ScoreManager";
import { comboManager } from "../scoring/ComboManager";

export const JUMP_DURATION_MS = 550;
export const DUCK_DURATION_MS = 500;
export const TURN_DURATION_MS = 500;
export const RAISE_HAND_DURATION_MS = 500;
export const LANE_COUNT = 3; // يسار / وسط / يمين

// الحالة الحية للاعب أثناء الجولة (منفصلة عن ملفه الشخصي المحفوظ) — بند 4
export class PlayerController {
  readonly id: number;
  character: CharacterId;
  lane = 1; // 0=يسار, 1=وسط, 2=يمين
  lives = GameConfig.player.startingLives;
  score = 0;

  private jumpingUntil = 0;
  private duckingUntil = 0;
  private turningUntil = 0;
  private handRaisedUntil = 0;
  private invincibleUntil = 0;
  private alive = true;
  private speedMultiplier = 1;
  private speedBoostUntil = 0;
  private shieldActive = false;
  private magnetUntil = 0;
  private lastActionAt = 0;

  constructor(id: number, character: CharacterId) {
    this.id = id;
    this.character = character;
    scoreManager.reset(id);
  }

  handleMotion(motion: MotionType, now: number): void {
    if (!this.alive) return;
    this.lastActionAt = now;
    switch (motion) {
      case "JUMP":
        this.jumpingUntil = now + JUMP_DURATION_MS;
        break;
      case "DUCK":
        this.duckingUntil = now + DUCK_DURATION_MS;
        break;
      case "MOVE_LEFT":
        this.lane = Math.max(0, this.lane - 1);
        break;
      case "MOVE_RIGHT":
        this.lane = Math.min(LANE_COUNT - 1, this.lane + 1);
        break;
      case "TURN":
        this.turningUntil = now + TURN_DURATION_MS;
        break;
      case "RAISE_HAND":
        this.handRaisedUntil = now + RAISE_HAND_DURATION_MS;
        break;
    }
  }

  get isJumping(): boolean {
    return performance.now() < this.jumpingUntil;
  }
  get isDucking(): boolean {
    return performance.now() < this.duckingUntil;
  }
  get isTurning(): boolean {
    return performance.now() < this.turningUntil;
  }
  get isHandRaised(): boolean {
    return performance.now() < this.handRaisedUntil;
  }

  // نسبة 0..1 من مدة الحركة (تُستخدم بالرسم لعمل قوس قفزة/دوران ناعم بدل حالة ثابتة)
  get jumpProgress(): number {
    return this.progressOf(this.jumpingUntil, JUMP_DURATION_MS);
  }
  get turnProgress(): number {
    return this.progressOf(this.turningUntil, TURN_DURATION_MS);
  }

  private progressOf(until: number, duration: number): number {
    const remaining = until - performance.now();
    if (remaining <= 0) return 1;
    const ratio = Math.min(1, Math.max(0, remaining / duration));
    return 1 - ratio;
  }
  get isInvincible(): boolean {
    return performance.now() < this.invincibleUntil || this.shieldActive;
  }
  get isMagnetActive(): boolean {
    return performance.now() < this.magnetUntil;
  }
  get isAlive(): boolean {
    return this.alive;
  }
  get currentSpeedMultiplier(): number {
    return performance.now() < this.speedBoostUntil ? this.speedMultiplier : 1;
  }

  applySpeedBoost(multiplier: number, durationMs: number): void {
    this.speedMultiplier = multiplier;
    this.speedBoostUntil = performance.now() + durationMs;
  }

  applyShield(durationMs: number): void {
    this.shieldActive = true;
    window.setTimeout(() => (this.shieldActive = false), durationMs);
  }

  applyMagnet(durationMs: number): void {
    this.magnetUntil = performance.now() + durationMs;
  }

  addExtraLife(): void {
    this.lives += 1;
  }

  // يرجع true لو كان اللاعب محمياً (Shield) وامتُصت الضربة بدون خسارة روح
  takeHit(): boolean {
    if (!this.alive) return false;
    if (this.isInvincible) {
      if (this.shieldActive) this.shieldActive = false; // الدرع يمتص ضربة واحدة
      return true;
    }
    this.lives -= 1;
    this.invincibleUntil = performance.now() + GameConfig.player.invincibilityAfterHitMs;
    scoreManager.onHit(this.id);
    eventBus.emit(GameEvents.PLAYER_LIFE_LOST, { playerIndex: this.id, livesRemaining: this.lives });
    if (this.lives <= 0) {
      this.alive = false;
      eventBus.emit(GameEvents.PLAYER_DIED, { playerIndex: this.id });
    }
    return false;
  }

  reset(): void {
    this.lives = GameConfig.player.startingLives;
    this.alive = true;
    this.lane = 1;
    this.jumpingUntil = 0;
    this.duckingUntil = 0;
    this.turningUntil = 0;
    this.handRaisedUntil = 0;
    this.invincibleUntil = 0;
    this.shieldActive = false;
    this.speedBoostUntil = 0;
    this.magnetUntil = 0;
    scoreManager.reset(this.id);
    comboManager.resetPlayer(this.id);
  }
}
