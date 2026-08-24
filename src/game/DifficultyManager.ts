import { eventBus, GameEvents } from "../core/EventBus";
import { GameConfig } from "../core/Config";
import type { Difficulty } from "../core/Types";

// الصعوبة الأساسية يختارها اللاعب (بند 22) + معدّل ديناميكي ناعم يتكيف مع أدائه (بند 23)
export class DifficultyManager {
  private base: Difficulty = "NORMAL";
  private dynamicModifier = 1; // 1 = بدون تعديل، >1 أصعب، <1 أسهل
  private targetModifier = 1;
  private readonly stepPerEvent = 0.035;
  private readonly minModifier = 0.75;
  private readonly maxModifier = 1.35;
  private readonly smoothingPerSecond = 0.6; // سرعة التقارب نحو الهدف (تدرّج ناعم)

  setBaseDifficulty(difficulty: Difficulty): void {
    this.base = difficulty;
    this.dynamicModifier = 1;
    this.targetModifier = 1;
    eventBus.emit(GameEvents.DIFFICULTY_CHANGED, { difficulty });
  }

  getBaseDifficulty(): Difficulty {
    return this.base;
  }

  onObstaclePassed(): void {
    this.targetModifier = Math.min(this.maxModifier, this.targetModifier + this.stepPerEvent);
  }

  onObstacleHit(): void {
    this.targetModifier = Math.max(this.minModifier, this.targetModifier - this.stepPerEvent * 2);
  }

  // يُستدعى كل إطار من GameLoop عشان التغيير يكون تدريجي وغير محسوس فجأة
  update(deltaSeconds: number): void {
    const diff = this.targetModifier - this.dynamicModifier;
    this.dynamicModifier += diff * Math.min(1, this.smoothingPerSecond * deltaSeconds);
  }

  getObstacleSpeed(): number {
    return GameConfig.difficultySettings[this.base].obstacleSpeed * this.dynamicModifier;
  }

  getSpawnIntervalMs(): number {
    return GameConfig.difficultySettings[this.base].spawnIntervalMs / this.dynamicModifier;
  }

  getReactionWindowMs(): number {
    return GameConfig.difficultySettings[this.base].reactionWindowMs / this.dynamicModifier;
  }

  getModifierForDebug(): number {
    return this.dynamicModifier;
  }
}

export const difficultyManager = new DifficultyManager();
