import type { CharacterId, Difficulty, PlayerBaseline, WorldId } from "../core/Types";

// حالة مؤقتة تُشارك بين شاشات Phaser أثناء التنقل (ليست محفوظة دائماً — استخدم storageManager لذلك)
class SessionStore {
  selectedCharacter: CharacterId = "hero_boy";
  selectedWorld: WorldId = "forest";
  difficulty: Difficulty = "NORMAL";
  playerCount = 1;
  selectedLevelId = 1;
  calibratedBaselines: Map<number, PlayerBaseline> = new Map();
  debugMode = false;
}

export const session = new SessionStore();
