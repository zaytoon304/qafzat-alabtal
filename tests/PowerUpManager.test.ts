import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { powerUpManager } from "../src/powerups/PowerUpManager";
import { PlayerController } from "../src/players/PlayerController";
import { difficultyManager } from "../src/game/DifficultyManager";

const SPAWN_AND_ARRIVE_MS = 9000; // يتجاوز فترة ظهور Power-Up (9000ms) بصعوبة NORMAL

describe("PowerUpManager — بند 13: 5 أنواع بتأثيرات حقيقية على اللاعب", () => {
  let player: PlayerController;

  beforeEach(() => {
    difficultyManager.setBaseDifficulty("NORMAL");
    player = new PlayerController(0, "hero_boy");
  });

  afterEach(() => {
    powerUpManager.stop();
    vi.restoreAllMocks();
  });

  it("EXTRA_LIFE يزيد الأرواح فعلياً عند الجمع بنفس المسار", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // يختار EXTRA_LIFE بمسار 1 (وسط، نفس مسار اللاعب الافتراضي)
    powerUpManager.start();
    powerUpManager.update(SPAWN_AND_ARRIVE_MS, [player]);
    expect(player.lives).toBe(4);
  });

  it("SHIELD يفعّل الحصانة فعلياً عند الجمع", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.25); // index 1 = SHIELD, lane=0
    player.handleMotion("MOVE_LEFT", performance.now()); // ينتقل لمسار 0 ليطابق العائق
    powerUpManager.start();
    powerUpManager.update(SPAWN_AND_ARRIVE_MS, [player]);
    expect(player.isInvincible).toBe(true);
  });

  it("لا يُجمع Power-Up إن كان اللاعب بمسار مختلف", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // EXTRA_LIFE بمسار 1
    player.handleMotion("MOVE_LEFT", performance.now()); // اللاعب انتقل لمسار 0 (مختلف)
    powerUpManager.start();
    powerUpManager.update(SPAWN_AND_ARRIVE_MS, [player]);
    expect(player.lives).toBe(3); // لم يجمعه
  });
});
