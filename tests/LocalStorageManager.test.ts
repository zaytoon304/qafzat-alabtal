import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageManager } from "../src/storage/LocalStorageManager";
import { Leaderboard } from "../src/scoring/Leaderboard";

describe("LocalStorageManager — بند 24: حفظ محلي بلا إنترنت وبلا حساب", () => {
  let storage: LocalStorageManager;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageManager();
  });

  it("createProfile ينشئ ملفاً ويجعله النشط", () => {
    const profile = storage.createProfile("سارة", "hero_girl", "forest");
    expect(profile.name).toBe("سارة");
    expect(storage.getActiveProfile()?.id).toBe(profile.id);
  });

  it("saveProfile يحدّث الملف الموجود بدل تكراره", () => {
    const profile = storage.createProfile("خالد", "robot", "desert");
    profile.highestScore = 500;
    storage.saveProfile(profile);
    expect(storage.getProfiles()).toHaveLength(1);
    expect(storage.getActiveProfile()?.highestScore).toBe(500);
  });

  it("البيانات تبقى بعد إعادة إنشاء المدير (محاكاة إعادة فتح اللعبة)", () => {
    storage.createProfile("محمد", "hero_boy", "forest");
    const storage2 = new LocalStorageManager();
    expect(storage2.getActiveProfile()?.name).toBe("محمد");
  });
});

describe("Leaderboard — بند 25", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("يرتب النتائج تنازلياً وياخذ أفضل 10", () => {
    const board = new Leaderboard();
    board.submit("أ", 100, "hero_boy");
    board.submit("ب", 500, "robot");
    board.submit("ج", 300, "wizard");
    const top = board.top(10);
    expect(top.map((e) => e.score)).toEqual([500, 300, 100]);
  });
});
