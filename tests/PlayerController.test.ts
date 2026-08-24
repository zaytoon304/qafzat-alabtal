import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PlayerController } from "../src/players/PlayerController";
import { GameConfig } from "../src/core/Config";

describe("PlayerController", () => {
  let p: PlayerController;

  beforeEach(() => {
    p = new PlayerController(99, "hero_boy");
  });

  it("يبدأ بـ 3 أرواح ووسط المسارات", () => {
    expect(p.lives).toBe(GameConfig.player.startingLives);
    expect(p.lane).toBe(1);
    expect(p.isAlive).toBe(true);
  });

  it("MOVE_LEFT/MOVE_RIGHT تحرّك المسار ضمن الحدود 0..2", () => {
    p.handleMotion("MOVE_LEFT", 0);
    expect(p.lane).toBe(0);
    p.handleMotion("MOVE_LEFT", 0); // لا يقل عن 0
    expect(p.lane).toBe(0);
    p.handleMotion("MOVE_RIGHT", 0);
    p.handleMotion("MOVE_RIGHT", 0);
    p.handleMotion("MOVE_RIGHT", 0); // لا يزيد عن 2
    expect(p.lane).toBe(2);
  });

  it("JUMP يفعّل isJumping لمدة محدودة فقط", () => {
    p.handleMotion("JUMP", performance.now());
    expect(p.isJumping).toBe(true);
  });

  it("takeHit تنقص روح وتفعّل الحصانة المؤقتة", () => {
    const alive1 = p.takeHit();
    expect(alive1).toBe(false); // false = لم تُمتص الضربة بدرع
    expect(p.lives).toBe(2);
    expect(p.isInvincible).toBe(true);
  });

  it("الضربة الثانية أثناء الحصانة لا تنقص روح إضافية", () => {
    p.takeHit();
    const livesAfterFirst = p.lives;
    p.takeHit(); // بينما still invincible
    expect(p.lives).toBe(livesAfterFirst);
  });

  it("نفاد الأرواح (3 ضربات بعد زوال الحصانة كل مرة) يجعل اللاعب غير حي", () => {
    let clock = performance.now();
    const spy = vi.spyOn(performance, "now").mockImplementation(() => clock);
    try {
      p.takeHit(); // lives=2
      clock += GameConfig.player.invincibilityAfterHitMs + 10;
      p.takeHit(); // lives=1
      clock += GameConfig.player.invincibilityAfterHitMs + 10;
      p.takeHit(); // lives=0
      expect(p.lives).toBe(0);
      expect(p.isAlive).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it("Shield يمتص ضربة واحدة بدون خسارة روح", () => {
    p.applyShield(5000);
    const absorbed = p.takeHit();
    expect(absorbed).toBe(true);
    expect(p.lives).toBe(GameConfig.player.startingLives);
  });

  it("Magnet يفعّل isMagnetActive للمدة المحددة فقط", () => {
    expect(p.isMagnetActive).toBe(false);
    p.applyMagnet(1000);
    expect(p.isMagnetActive).toBe(true);
  });

  it("addExtraLife تزيد الأرواح", () => {
    p.addExtraLife();
    expect(p.lives).toBe(GameConfig.player.startingLives + 1);
  });
});
