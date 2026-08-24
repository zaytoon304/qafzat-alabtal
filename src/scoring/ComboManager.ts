import { eventBus, GameEvents } from "../core/EventBus";
import { GameConfig } from "../core/Config";

interface ComboState {
  count: number;
  lastActionAt: number;
  timeoutHandle: number;
}

// يتتبع سلاسل النجاح المتتالية (Combo) لكل لاعب — بند 16
export class ComboManager {
  private combos: Map<number, ComboState> = new Map();

  private getState(playerIndex: number): ComboState {
    let s = this.combos.get(playerIndex);
    if (!s) {
      s = { count: 0, lastActionAt: 0, timeoutHandle: 0 };
      this.combos.set(playerIndex, s);
    }
    return s;
  }

  registerSuccess(playerIndex: number): number {
    const s = this.getState(playerIndex);
    s.count += 1;
    s.lastActionAt = performance.now();
    window.clearTimeout(s.timeoutHandle);
    s.timeoutHandle = window.setTimeout(() => this.breakCombo(playerIndex), GameConfig.scoring.comboTimeoutMs);
    eventBus.emit(GameEvents.COMBO_CHANGED, { playerIndex, combo: s.count });
    return s.count;
  }

  breakCombo(playerIndex: number): void {
    const s = this.getState(playerIndex);
    if (s.count === 0) return;
    window.clearTimeout(s.timeoutHandle);
    s.count = 0;
    eventBus.emit(GameEvents.COMBO_BROKEN, { playerIndex });
    eventBus.emit(GameEvents.COMBO_CHANGED, { playerIndex, combo: 0 });
  }

  getMultiplier(playerIndex: number): number {
    const s = this.getState(playerIndex);
    return 1 + s.count * GameConfig.scoring.comboMultiplierStep;
  }

  getCombo(playerIndex: number): number {
    return this.getState(playerIndex).count;
  }

  resetPlayer(playerIndex: number): void {
    const s = this.getState(playerIndex);
    window.clearTimeout(s.timeoutHandle);
    this.combos.delete(playerIndex);
  }
}

export const comboManager = new ComboManager();
