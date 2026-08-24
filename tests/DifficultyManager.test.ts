import { describe, it, expect, beforeEach } from "vitest";
import { DifficultyManager } from "../src/game/DifficultyManager";

describe("DifficultyManager", () => {
  let dm: DifficultyManager;

  beforeEach(() => {
    dm = new DifficultyManager();
    dm.setBaseDifficulty("NORMAL");
  });

  it("لا تغيير مفاجئ: معدل السرعة الأولي = سرعة الصعوبة الأساسية بالضبط", () => {
    const base = 280; // GameConfig.difficultySettings.NORMAL.obstacleSpeed
    expect(dm.getObstacleSpeed()).toBeCloseTo(base, 5);
  });

  it("النجاح المتكرر يرفع السرعة تدريجياً لا فجأة", () => {
    const before = dm.getObstacleSpeed();
    dm.onObstaclePassed();
    dm.update(0.016); // إطار واحد فقط (~16ms)
    const afterOneFrame = dm.getObstacleSpeed();
    // التغيير بعد إطار واحد يجب أن يكون صغيراً جداً (تدرّج ناعم) وليس قفزة كاملة للهدف
    expect(afterOneFrame).toBeGreaterThan(before);
    expect(afterOneFrame - before).toBeLessThan(5);
  });

  it("مع مرور وقت كافٍ يقترب المعدل من الهدف", () => {
    dm.onObstaclePassed();
    for (let i = 0; i < 300; i++) dm.update(0.05);
    expect(dm.getObstacleSpeed()).toBeGreaterThan(280);
  });

  it("الفشل المتكرر يخفّض الصعوبة ولا ينزل تحت الحد الأدنى", () => {
    for (let i = 0; i < 50; i++) {
      dm.onObstacleHit();
      dm.update(0.5);
    }
    expect(dm.getObstacleSpeed()).toBeGreaterThanOrEqual(280 * 0.75 - 1);
  });

  it("تغيير الصعوبة الأساسية يعيد ضبط المعدل الديناميكي", () => {
    dm.onObstaclePassed();
    for (let i = 0; i < 100; i++) dm.update(0.1);
    dm.setBaseDifficulty("HARD");
    expect(dm.getObstacleSpeed()).toBeCloseTo(340, 5);
  });
});
