import { describe, it, expect, beforeEach, vi } from "vitest";
import { ScoreManager } from "../src/scoring/ScoreManager";
import { ComboManager } from "../src/scoring/ComboManager";

// ScoreManager/ComboManager يستوردان singleton داخلي comboManager — نختبر عبر الـsingletons المصدَّرة
import { scoreManager } from "../src/scoring/ScoreManager";
import { comboManager } from "../src/scoring/ComboManager";

describe("ComboManager", () => {
  beforeEach(() => {
    comboManager.resetPlayer(0);
  });

  it("يزيد Combo مع كل نجاح متتالي", () => {
    expect(comboManager.registerSuccess(0)).toBe(1);
    expect(comboManager.registerSuccess(0)).toBe(2);
    expect(comboManager.registerSuccess(0)).toBe(3);
    expect(comboManager.getCombo(0)).toBe(3);
  });

  it("يصفر Combo عند breakCombo", () => {
    comboManager.registerSuccess(0);
    comboManager.registerSuccess(0);
    comboManager.breakCombo(0);
    expect(comboManager.getCombo(0)).toBe(0);
  });

  it("المضاعف يزيد مع كل مستوى Combo", () => {
    expect(comboManager.getMultiplier(0)).toBe(1);
    comboManager.registerSuccess(0);
    expect(comboManager.getMultiplier(0)).toBeGreaterThan(1);
  });
});

describe("ScoreManager + Combo تكامل", () => {
  beforeEach(() => {
    scoreManager.reset(0);
    comboManager.resetPlayer(0);
  });

  it("تجاوز عائق يزيد Combo والنقاط معاً", () => {
    scoreManager.addObstaclePassed(0);
    expect(comboManager.getCombo(0)).toBe(1);
    expect(scoreManager.getScore(0)).toBeGreaterThan(0);
  });

  it("النقاط تزيد أكثر مع Combo أعلى (نفس الحدث الأساسي)", () => {
    scoreManager.addObstaclePassed(0); // combo=1
    const scoreAfterFirst = scoreManager.getScore(0);
    scoreManager.addObstaclePassed(0); // combo=2, مضاعف أعلى
    const gainedSecond = scoreManager.getScore(0) - scoreAfterFirst;
    expect(gainedSecond).toBeGreaterThan(scoreAfterFirst);
  });

  it("الاصطدام يصفّر الـCombo", () => {
    scoreManager.addObstaclePassed(0);
    scoreManager.addObstaclePassed(0);
    expect(comboManager.getCombo(0)).toBe(2);
    scoreManager.onHit(0);
    expect(comboManager.getCombo(0)).toBe(0);
  });

  it("جمع نجمة وعملة يزيد العدّاد الصحيح", () => {
    scoreManager.addStar(0);
    scoreManager.addCoin(0);
    scoreManager.addCoin(0);
    expect(scoreManager.getStars(0)).toBe(1);
    expect(scoreManager.getCoins(0)).toBe(2);
  });

  it("Double Score يضاعف النقاط المكتسبة", () => {
    scoreManager.reset(1);
    scoreManager.addBonus(1, 100);
    const before = scoreManager.getScore(1);
    scoreManager.activateDoubleScore(1, 5000);
    scoreManager.addBonus(1, 100);
    const gained = scoreManager.getScore(1) - before;
    expect(gained).toBe(200);
  });
});
