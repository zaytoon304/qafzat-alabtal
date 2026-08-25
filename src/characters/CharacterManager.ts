import type { CharacterId } from "../core/Types";

export interface CharacterDef {
  id: CharacterId;
  name: string;
  emoji: string;
  spriteKey: string; // البادئة الأساسية لمفاتيح الصور (بدون وضعية) - استخدم poseKey() لجلب وضعية محددة
  aspect: number; // عرض/ارتفاع الصورة الأصلية - لعرضها بلا تشويه
}

// كتالوج الشخصيات — بند 20. كل الشخصيات موجودة من البداية (لا فتح تدريجي هنا، الفتح التدريجي للعوالم)
// كل شخصية لها 6 وضعيات رسومية حقيقية (وقوف/قفز/انحناء/مشي/إصابة/احتفال) - حزمة Kenney "Platformer Characters" (CC0)
export const CHARACTERS: CharacterDef[] = [
  { id: "hero_boy", name: "بطل", emoji: "👦", spriteKey: "char_hero_boy", aspect: 80 / 110 },
  { id: "hero_girl", name: "بطلة", emoji: "👧", spriteKey: "char_hero_girl", aspect: 80 / 110 },
  { id: "robot", name: "المحارب", emoji: "🛡️", spriteKey: "char_robot", aspect: 80 / 110 },
  { id: "explorer", name: "المغامر", emoji: "🎒", spriteKey: "char_explorer", aspect: 80 / 110 },
  { id: "wizard", name: "الوحش الودود", emoji: "🧌", spriteKey: "char_wizard", aspect: 80 / 110 },
];

export type CharacterPose = "idle" | "jump" | "duck" | "walk1" | "hurt" | "cheer1";

export function poseKey(spriteKey: string, pose: CharacterPose): string {
  return `${spriteKey}_${pose}`;
}

export class CharacterManager {
  get(id: CharacterId): CharacterDef {
    return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
  }
  all(): CharacterDef[] {
    return CHARACTERS;
  }
}

export const characterManager = new CharacterManager();
