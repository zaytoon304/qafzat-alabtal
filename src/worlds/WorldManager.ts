import type { PlayerProfileData, WorldId } from "../core/Types";

export interface WorldDef {
  id: WorldId;
  name: string;
  emoji: string;
  skyTop: number;
  skyBottom: number;
  groundColor: number;
  accentColor: number;
  requiredLevelsCompleted: number; // كم مرحلة يجب إنهاؤها لفتح هذا العالم
}

// كتالوج العوالم — بند 21. تُفتح تدريجياً حسب تقدّم اللاعب
export const WORLDS: WorldDef[] = [
  { id: "forest", name: "الغابة", emoji: "🌳", skyTop: 0x8fd6ff, skyBottom: 0xcdf2c8, groundColor: 0x4caf50, accentColor: 0x2e7d32, requiredLevelsCompleted: 0 },
  { id: "desert", name: "الصحراء", emoji: "🏜️", skyTop: 0xffe1a8, skyBottom: 0xffc774, groundColor: 0xe0b16a, accentColor: 0xc7893f, requiredLevelsCompleted: 2 },
  { id: "space", name: "الفضاء", emoji: "🚀", skyTop: 0x0b1440, skyBottom: 0x1c2a6b, groundColor: 0x2b2f5e, accentColor: 0x7c4dff, requiredLevelsCompleted: 4 },
  { id: "future_city", name: "المدينة المستقبلية", emoji: "🏙️", skyTop: 0x1a1240, skyBottom: 0x3b2a6b, groundColor: 0x30264f, accentColor: 0x00e5ff, requiredLevelsCompleted: 6 },
  { id: "volcano", name: "عالم البركان", emoji: "🌋", skyTop: 0x3a0f0f, skyBottom: 0x7a1f1f, groundColor: 0x4a1414, accentColor: 0xff6d00, requiredLevelsCompleted: 8 },
];

export class WorldManager {
  get(id: WorldId): WorldDef {
    return WORLDS.find((w) => w.id === id) ?? WORLDS[0];
  }

  all(): WorldDef[] {
    return WORLDS;
  }

  isUnlocked(world: WorldDef, profile: PlayerProfileData | null): boolean {
    const completed = profile?.levelsCompleted.length ?? 0;
    return completed >= world.requiredLevelsCompleted;
  }
}

export const worldManager = new WorldManager();
