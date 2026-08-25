import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { storageManager } from "../../storage/LocalStorageManager";
import { characterManager, poseKey } from "../../characters/CharacterManager";
import { ACHIEVEMENTS } from "../../scoring/AchievementManager";
import { titleText, bodyText, createBigButton, createPanel, sceneBackdrop } from "../../ui/UIKit";

// ملف اللاعب — بند 24
export class ProfileStatsScene extends Phaser.Scene {
  constructor() {
    super("ProfileStats");
  }

  create(): void {
    const { width, height } = GameConfig.screen;
    sceneBackdrop(this);
    const profile = storageManager.getActiveProfile();

    if (!profile) {
      this.scene.start("Profile");
      return;
    }

    const charDef = characterManager.get(profile.character);
    titleText(this, width / 2, 55, `👤 ${profile.name}`);
    this.add.image(width / 2, 130, poseKey(charDef.spriteKey, "cheer1")).setDisplaySize(90 * charDef.aspect, 90);

    createPanel(this, width / 2, 250, 560, 140);
    bodyText(this, width / 2, 210, `🏆 أفضل نتيجة: ${profile.highestScore}`, "22px");
    bodyText(this, width / 2, 245, `🌟 نجوم: ${profile.totalStars}   🪙 عملات: ${profile.totalCoins}`, "20px");
    bodyText(this, width / 2, 280, `🗺️ مراحل مكتملة: ${profile.levelsCompleted.length}`, "20px");

    bodyText(this, width / 2, 340, "🏅 الإنجازات", "22px", "#ffd54f");
    const unlocked = ACHIEVEMENTS.filter((a) => profile.achievements.includes(a.id));
    if (unlocked.length === 0) {
      bodyText(this, width / 2, 375, "لا توجد إنجازات بعد", "18px", "#888");
    } else {
      const text = unlocked.map((a) => `${a.icon} ${a.title}`).join("   ");
      bodyText(this, width / 2, 375, text, "16px");
    }

    createBigButton(this, width / 2, height - 40, "رجوع", "grey", () => this.scene.start("Menu"), { width: 200 });
  }
}
