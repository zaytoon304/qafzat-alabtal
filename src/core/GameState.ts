import { eventBus, GameEvents } from "./EventBus";
import type { GameStateName } from "./Types";

// آلة حالات مركزية بدل متغيرات Boolean متفرقة (isPlaying, isPaused...)
const VALID_TRANSITIONS: Record<GameStateName, GameStateName[]> = {
  BOOT: ["MENU"],
  MENU: ["PROFILE", "CHARACTER_SELECT", "WORLD_SELECT", "TRAINING", "CALIBRATION", "LEADERBOARD"],
  PROFILE: ["MENU"],
  CHARACTER_SELECT: ["WORLD_SELECT", "MENU"],
  WORLD_SELECT: ["CALIBRATION", "MENU"],
  TRAINING: ["MENU", "CALIBRATION"],
  CALIBRATION: ["READY", "MENU"],
  READY: ["PLAYING", "MENU"],
  PLAYING: ["PAUSED", "BOSS", "LEVEL_COMPLETE", "GAME_OVER"],
  PAUSED: ["PLAYING", "MENU"],
  BOSS: ["LEVEL_COMPLETE", "GAME_OVER", "PLAYING"],
  RESULTS: ["MENU", "LEADERBOARD"],
  GAME_OVER: ["RESULTS", "MENU"],
  LEVEL_COMPLETE: ["RESULTS", "PLAYING", "MENU"],
  LEADERBOARD: ["MENU"],
};

export class GameStateMachine {
  private current: GameStateName = "BOOT";
  private previous: GameStateName | null = null;

  get state(): GameStateName {
    return this.current;
  }

  get previousState(): GameStateName | null {
    return this.previous;
  }

  canTransitionTo(next: GameStateName): boolean {
    return VALID_TRANSITIONS[this.current]?.includes(next) ?? false;
  }

  transitionTo(next: GameStateName, force = false): boolean {
    if (!force && !this.canTransitionTo(next)) {
      console.warn(`[GameState] انتقال غير مسموح: ${this.current} → ${next}`);
      return false;
    }
    this.previous = this.current;
    this.current = next;
    eventBus.emit(GameEvents.STATE_CHANGED, { from: this.previous, to: this.current });
    return true;
  }

  is(state: GameStateName): boolean {
    return this.current === state;
  }
}

export const gameState = new GameStateMachine();
