import { eventBus, GameEvents } from "../core/EventBus";
import { GameConfig } from "../core/Config";
import { comboManager } from "./ComboManager";

// نقاط كل لاعب أثناء الجولة الحالية (بند 15) — يُصفَّر بداية كل جولة جديدة
export class ScoreManager {
  private scores: Map<number, number> = new Map();
  private stars: Map<number, number> = new Map();
  private coins: Map<number, number> = new Map();
  private doubleScoreUntil: Map<number, number> = new Map();

  activateDoubleScore(playerIndex: number, durationMs: number): void {
    this.doubleScoreUntil.set(playerIndex, performance.now() + durationMs);
  }

  reset(playerIndex: number): void {
    this.scores.set(playerIndex, 0);
    this.stars.set(playerIndex, 0);
    this.coins.set(playerIndex, 0);
  }

  private add(playerIndex: number, basePoints: number, useCombo: boolean): number {
    const comboMultiplier = useCombo ? comboManager.getMultiplier(playerIndex) : 1;
    const doubleActive = (this.doubleScoreUntil.get(playerIndex) ?? 0) > performance.now();
    const gained = Math.round(basePoints * comboMultiplier * (doubleActive ? 2 : 1));
    const total = (this.scores.get(playerIndex) ?? 0) + gained;
    this.scores.set(playerIndex, total);
    eventBus.emit(GameEvents.SCORE_CHANGED, { playerIndex, score: total, gained });
    return total;
  }

  addObstaclePassed(playerIndex: number): void {
    comboManager.registerSuccess(playerIndex);
    this.add(playerIndex, GameConfig.scoring.obstaclePassedPoints, true);
  }

  addStar(playerIndex: number): void {
    this.stars.set(playerIndex, (this.stars.get(playerIndex) ?? 0) + 1);
    this.add(playerIndex, GameConfig.scoring.starPoints, true);
  }

  addCoin(playerIndex: number): void {
    this.coins.set(playerIndex, (this.coins.get(playerIndex) ?? 0) + 1);
    this.add(playerIndex, GameConfig.scoring.coinPoints, true);
  }

  addBonus(playerIndex: number, points: number): void {
    this.add(playerIndex, points, false);
  }

  onHit(playerIndex: number): void {
    if (GameConfig.scoring.comboBreakOnHit) comboManager.breakCombo(playerIndex);
  }

  getScore(playerIndex: number): number {
    return this.scores.get(playerIndex) ?? 0;
  }

  getStars(playerIndex: number): number {
    return this.stars.get(playerIndex) ?? 0;
  }

  getCoins(playerIndex: number): number {
    return this.coins.get(playerIndex) ?? 0;
  }
}

export const scoreManager = new ScoreManager();
