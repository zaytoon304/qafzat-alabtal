import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { titleText, bodyText, createBigButton } from "../../ui/UIKit";

interface ResultData {
  score: number;
  stars: number;
  coins: number;
  levelName: string;
}

const ENCOURAGEMENTS = ["حاول مرة ثانية، بتنجح أكيد!", "قريب جداً! جرّب مرة ثانية", "كل بطل يقع ويرجع يحاول 💪"];

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  create(data: ResultData): void {
    const { width, height } = GameConfig.screen;
    this.cameras.main.setBackgroundColor("#1a0b12");
    this.cameras.main.fadeIn(250, 11, 16, 32);

    const title = titleText(this, width / 2, 90, "🌟 خلصت المحاولة!");
    title.setScale(0.5);
    this.tweens.add({ targets: title, scale: 1, duration: 350, ease: "Back.easeOut" });
    bodyText(this, width / 2, 150, ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)], "22px", "#ffab91");

    bodyText(this, width / 2, 230, `⭐ النقاط: ${data.score}`, "26px");
    bodyText(this, width / 2, 270, `🌟 نجوم: ${data.stars}   🪙 عملات: ${data.coins}`, "22px");

    createBigButton(this, width / 2, 370, "🔁 حاول مرة أخرى", "green", () => this.scene.start("Calibration"), { width: 280 });
    createBigButton(this, width / 2, 440, "🏠 القائمة الرئيسية", "grey", () => this.scene.start("Menu"), { width: 280 });
  }
}
