import { GameConfig } from "../core/Config";
import type { CharacterId, LeaderboardEntry, PlayerProfileData, WorldId } from "../core/Types";

// كل الحفظ محلي بالمتصفح (localStorage) — بدون إنترنت وبدون حساب (بند 24)
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("[Storage] فشل الحفظ محلياً:", err);
  }
}

export class LocalStorageManager {
  getProfiles(): PlayerProfileData[] {
    return readJSON<PlayerProfileData[]>(GameConfig.storageKeys.profiles, []);
  }

  saveProfile(profile: PlayerProfileData): void {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    profile.updatedAt = Date.now();
    if (idx >= 0) profiles[idx] = profile;
    else profiles.push(profile);
    writeJSON(GameConfig.storageKeys.profiles, profiles);
  }

  createProfile(name: string, character: CharacterId, world: WorldId): PlayerProfileData {
    const profile: PlayerProfileData = {
      id: `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      character,
      world,
      highestScore: 0,
      bestTimeSeconds: null,
      totalStars: 0,
      totalCoins: 0,
      levelsCompleted: [],
      achievements: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.saveProfile(profile);
    this.setActiveProfileId(profile.id);
    return profile;
  }

  getActiveProfileId(): string | null {
    return localStorage.getItem(GameConfig.storageKeys.activeProfileId);
  }

  setActiveProfileId(id: string): void {
    localStorage.setItem(GameConfig.storageKeys.activeProfileId, id);
  }

  getActiveProfile(): PlayerProfileData | null {
    const id = this.getActiveProfileId();
    if (!id) return null;
    return this.getProfiles().find((p) => p.id === id) ?? null;
  }

  getLeaderboard(): LeaderboardEntry[] {
    return readJSON<LeaderboardEntry[]>(GameConfig.storageKeys.leaderboard, []);
  }

  addLeaderboardEntry(entry: LeaderboardEntry): void {
    const list = this.getLeaderboard();
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    writeJSON(GameConfig.storageKeys.leaderboard, list.slice(0, 20));
  }
}

export const storageManager = new LocalStorageManager();
