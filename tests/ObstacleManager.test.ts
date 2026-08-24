import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { obstacleManager } from "../src/obstacles/ObstacleManager";
import { PlayerController } from "../src/players/PlayerController";
import { scoreManager } from "../src/scoring/ScoreManager";
import { difficultyManager } from "../src/game/DifficultyManager";

// دلتا كبير بما يكفي لإطلاق أول Spawn (عتبة الظهور بصعوبة NORMAL) ونقل العائق حتى خط اللاعب بنفس النداء
const SPAWN_AND_ARRIVE_MS = 3200;

describe("ObstacleManager — منطق التصادم الحقيقي (بند 10/11)", () => {
  let player: PlayerController;

  beforeEach(() => {
    difficultyManager.setBaseDifficulty("NORMAL");
    player = new PlayerController(0, "hero_boy");
    scoreManager.reset(0);
  });

  afterEach(() => {
    obstacleManager.stop();
    vi.restoreAllMocks();
  });

  it("LOW_OBSTACLE: القفز في الوقت المناسب ينجّي اللاعب ويزيد نقاطه", () => {
    obstacleManager.start(["LOW_OBSTACLE"]);
    player.handleMotion("JUMP", performance.now());
    obstacleManager.update(SPAWN_AND_ARRIVE_MS, [player]);
    expect(player.lives).toBe(3);
    expect(scoreManager.getScore(0)).toBeGreaterThan(0);
  });

  it("LOW_OBSTACLE: عدم القفز يسبب خسارة روح", () => {
    obstacleManager.start(["LOW_OBSTACLE"]);
    obstacleManager.update(SPAWN_AND_ARRIVE_MS, [player]);
    expect(player.lives).toBe(2);
  });

  it("OVERHEAD_OBSTACLE: يتطلب DUCK وليس JUMP", () => {
    obstacleManager.start(["OVERHEAD_OBSTACLE"]);
    player.handleMotion("JUMP", performance.now()); // خطأ: القفز لا ينفع هنا
    obstacleManager.update(SPAWN_AND_ARRIVE_MS, [player]);
    expect(player.lives).toBe(2); // اصطدم لأنه قفز بدل الانحناء

    const player2 = new PlayerController(1, "hero_boy");
    obstacleManager.start(["OVERHEAD_OBSTACLE"]);
    player2.handleMotion("DUCK", performance.now());
    obstacleManager.update(SPAWN_AND_ARRIVE_MS, [player2]);
    expect(player2.lives).toBe(3);
  });

  it("HIGH_OBSTACLE: البقاء بنفس مسار العائق يسبب اصطداماً، وتغيير المسار ينجّي", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // يجبر مسار العائق = 0

    obstacleManager.start(["HIGH_OBSTACLE"]);
    obstacleManager.update(SPAWN_AND_ARRIVE_MS, [player]); // اللاعب بالمسار 1 (وسط) والعائق بالمسار 0
    expect(player.lives).toBe(3); // نجا لأنه بمسار مختلف عن العائق

    const player2 = new PlayerController(1, "hero_boy");
    player2.handleMotion("MOVE_LEFT", performance.now()); // ينتقل لنفس مسار العائق (0)
    obstacleManager.start(["HIGH_OBSTACLE"]);
    obstacleManager.update(SPAWN_AND_ARRIVE_MS, [player2]);
    expect(player2.lives).toBe(2); // اصطدم لأنه بنفس مسار العائق
  });

  it("MULTI_OBSTACLE: يتطلب TURN و RAISE_HAND معاً", () => {
    obstacleManager.start(["MULTI_OBSTACLE"]);
    player.handleMotion("TURN", performance.now());
    // بدون رفع اليد -> يجب أن يفشل
    obstacleManager.update(SPAWN_AND_ARRIVE_MS, [player]);
    expect(player.lives).toBe(2);

    const player2 = new PlayerController(1, "hero_boy");
    player2.handleMotion("TURN", performance.now());
    player2.handleMotion("RAISE_HAND", performance.now());
    obstacleManager.start(["MULTI_OBSTACLE"]);
    obstacleManager.update(SPAWN_AND_ARRIVE_MS, [player2]);
    expect(player2.lives).toBe(3);
  });
});
