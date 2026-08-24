import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { bossManager } from "../src/boss/BossManager";
import { PlayerController } from "../src/players/PlayerController";
import { eventBus, GameEvents } from "../src/core/EventBus";

// نجبر الحركة المطلوبة الأولى دائماً = JUMP (أول عنصر بمصفوفة الحركات) عبر تثبيت Math.random
function forceJumpRequired() {
  vi.spyOn(Math, "random").mockReturnValue(0);
}

describe("BossManager — بند 18: سلسلة حركات حقيقية وليست شخصية متحركة عشوائياً", () => {
  let player: PlayerController;

  beforeEach(() => {
    player = new PlayerController(0, "hero_boy");
  });

  afterEach(() => {
    bossManager.stop();
    vi.restoreAllMocks();
  });

  it("تنفيذ الحركة الصحيحة بالوقت المناسب يُنقص صحة الزعيم", () => {
    forceJumpRequired();
    bossManager.start();
    expect(bossManager.health).toBe(bossManager.maxHealth);

    bossManager.update(500, [player]); // IDLE -> TELEGRAPH (يحدد JUMP كحركة مطلوبة)
    expect(bossManager.requiredMotion).toBe("JUMP");

    bossManager.update(1000, [player]); // TELEGRAPH -> WINDOW
    eventBus.emit(GameEvents.VISION_JUMP, { playerIndex: 0 }); // اللاعب ينفّذ الحركة الصحيحة

    bossManager.update(2000, [player]); // WINDOW -> resolve
    expect(bossManager.health).toBeLessThan(bossManager.maxHealth);
    expect(player.lives).toBe(3); // لم يُضرب لأنه نجح
  });

  it("عدم تنفيذ أي حركة أثناء نافذة الهجوم يجعل الزعيم يضرب اللاعب", () => {
    forceJumpRequired();
    bossManager.start();
    bossManager.update(500, [player]);
    bossManager.update(1000, [player]);
    // اللاعب لا يفعل شيئاً
    bossManager.update(2000, [player]);
    expect(bossManager.health).toBe(bossManager.maxHealth); // الزعيم لم يُصَب
    expect(player.lives).toBe(2); // اللاعب أُصيب
  });

  it("تنفيذ الحركة الخاطئة لا يُحسب نجاحاً", () => {
    forceJumpRequired();
    bossManager.start();
    bossManager.update(500, [player]);
    bossManager.update(1000, [player]);
    eventBus.emit(GameEvents.VISION_DUCK, { playerIndex: 0 }); // حركة خاطئة (المطلوب JUMP)
    bossManager.update(2000, [player]);
    expect(player.lives).toBe(2);
  });

  it("إنهاك صحة الزعيم بالكامل يصدر BOSS_DEFEATED", () => {
    forceJumpRequired();
    const onDefeated = vi.fn();
    const off = eventBus.on(GameEvents.BOSS_DEFEATED, onDefeated);
    bossManager.start();

    for (let round = 0; round < 10 && bossManager.health > 0; round++) {
      bossManager.update(500, [player]);
      bossManager.update(1000, [player]);
      eventBus.emit(GameEvents.VISION_JUMP, { playerIndex: 0 });
      bossManager.update(2000, [player]);
      bossManager.update(800, [player]); // COOLDOWN -> التحضير للجولة التالية
    }

    off();
    expect(bossManager.health).toBe(0);
    expect(onDefeated).toHaveBeenCalledTimes(1);
  });
});
