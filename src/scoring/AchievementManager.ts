import { eventBus, GameEvents } from "../core/EventBus";
import { storageManager } from "../storage/LocalStorageManager";

export interface Achievement {
  id: string;
  title: string;
  icon: string;
}

// قائمة الإنجازات الثابتة — بند 26
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_jump", title: "أول قفزة", icon: "🏆" },
  { id: "first_level", title: "أول مرحلة", icon: "🏆" },
  { id: "combo_10", title: "10 عوائق متتالية", icon: "🏆" },
  { id: "stars_100", title: "100 نجمة", icon: "🏆" },
  { id: "boss_defeated", title: "هزمت الزعيم", icon: "🏆" },
  { id: "perfect_run", title: "جولة مثالية بدون اصطدام", icon: "🏆" },
];

// يتتبع تقدّم اللاعب النشط نحو الإنجازات ويحفظها بملفه الشخصي (بند 26)
// يستمع مباشرة لأحداث EventBus بدل أن تستدعيه الأنظمة الأخرى يدوياً — تقليل الترابط
export class AchievementManager {
  private sessionStars: Map<number, number> = new Map();
  private sessionHits: Map<number, number> = new Map();

  constructor() {
    eventBus.on(GameEvents.VISION_JUMP, () => this.unlock("first_jump"));
    eventBus.on(GameEvents.COMBO_CHANGED, (p: { combo: number }) => {
      if (p.combo >= 10) this.unlock("combo_10");
    });
    eventBus.on(GameEvents.COLLECT_STAR, (p: { playerIndex: number }) => this.onStarCollected(p.playerIndex));
    eventBus.on(GameEvents.PLAYER_LIFE_LOST, (p: { playerIndex: number }) => this.onHit(p.playerIndex));
    eventBus.on(GameEvents.BOSS_DEFEATED, () => this.unlock("boss_defeated"));
    eventBus.on(GameEvents.LEVEL_COMPLETE, (p: { playerIndex: number }) => this.onLevelComplete(p.playerIndex));
  }

  resetSession(playerIndex: number): void {
    this.sessionStars.set(playerIndex, 0);
    this.sessionHits.set(playerIndex, 0);
  }

  private unlock(id: string): void {
    const profile = storageManager.getActiveProfile();
    if (!profile || profile.achievements.includes(id)) return;
    profile.achievements.push(id);
    storageManager.saveProfile(profile);
    const meta = ACHIEVEMENTS.find((a) => a.id === id);
    eventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, { id, title: meta?.title ?? id, icon: meta?.icon ?? "🏆" });
  }

  private onStarCollected(playerIndex: number): void {
    const total = (this.sessionStars.get(playerIndex) ?? 0) + 1;
    this.sessionStars.set(playerIndex, total);
    const profile = storageManager.getActiveProfile();
    if (profile && profile.totalStars + total >= 100) this.unlock("stars_100");
  }

  private onHit(playerIndex: number): void {
    this.sessionHits.set(playerIndex, (this.sessionHits.get(playerIndex) ?? 0) + 1);
  }

  private onLevelComplete(playerIndex: number): void {
    this.unlock("first_level");
    if ((this.sessionHits.get(playerIndex) ?? 0) === 0) this.unlock("perfect_run");
  }
}

export const achievementManager = new AchievementManager();
