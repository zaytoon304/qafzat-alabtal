import type { CharacterId } from "../core/Types";

export interface CharacterDef {
  id: CharacterId;
  name: string;
  emoji: string;
  spriteKey: string; // مفتاح الصورة المحمّلة بـ Phaser (PreloadScene)
  tint: number;
}

// كتالوج الشخصيات — بند 20. كل الشخصيات موجودة من البداية (لا فتح تدريجي هنا، الفتح التدريجي للعوالم)
export const CHARACTERS: CharacterDef[] = [
  { id: "hero_boy", name: "بطل", emoji: "👦", spriteKey: "char_hero_boy", tint: 0xffffff },
  { id: "hero_girl", name: "بطلة", emoji: "👧", spriteKey: "char_hero_girl", tint: 0xffffff },
  { id: "robot", name: "روبوت", emoji: "🤖", spriteKey: "char_robot", tint: 0xc7d3dd },
  { id: "explorer", name: "مستكشف", emoji: "🚀", spriteKey: "char_explorer", tint: 0xffffff },
  { id: "wizard", name: "ساحر", emoji: "🧙", spriteKey: "char_wizard", tint: 0xffffff },
];

export class CharacterManager {
  get(id: CharacterId): CharacterDef {
    return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
  }
  all(): CharacterDef[] {
    return CHARACTERS;
  }
}

export const characterManager = new CharacterManager();
