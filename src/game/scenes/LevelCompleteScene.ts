import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { titleText, bodyText, createBigButton } from "../../ui/UIKit";

interface ResultData {
  score: number;
  stars: number;
  coins: number;
  levelName: string;
}

// شاشة إنهاء المرحلة بنجاح — بند 9 (Results)
export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super("LevelComplete");
  }

  create(data: ResultData): void {
    const { width, height } = GameConfig.screen;
    this.cameras.main.setBackgroundColor("#0b1020");
    this.cameras.main.fadeIn(250, 11, 16, 32);
    this.add.particles(width / 2, 0, "tile_gem", {
      x: { min: 0, max: width },
      y: 0,
      lifespan: 2200,
      speedY: { min: 100, max: 220 },
      scale: { start: 0.5, end: 0.1 },
      quantity: 1,
      frequency: 120,
    });

    const title = titleText(this, width / 2, 90, "🎉 أحسنت! أنهيت المرحلة");
    title.setScale(0.3);
    this.tweens.add({ targets: title, scale: 1, duration: 400, ease: "Back.easeOut" });
    bodyText(this, width / 2, 150, data.levelName, "26px", "#ffd54f");

    bodyText(this, width / 2, 230, `⭐ النقاط: ${data.score}`, "26px");
    bodyText(this, width / 2, 270, `🌟 نجوم: ${data.stars}   🪙 عملات: ${data.coins}`, "22px");

    createBigButton(this, width / 2, 380, "القائمة الرئيسية", "green", () => this.scene.start("Menu"), { width: 280 });
    createBigButton(this, width / 2, 450, "🏆 لوحة الأبطال", "yellow", () => this.scene.start("Leaderboard"), { width: 280 });
  }
}
