import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { storageManager } from "../../storage/LocalStorageManager";
import { titleText, bodyText, createBigButton, sceneBackdrop } from "../../ui/UIKit";
import { audioManager } from "../../audio/AudioManager";

// القائمة الرئيسية — بند 7
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  create(): void {
    const { width, height } = GameConfig.screen;
    sceneBackdrop(this);
    this.cameras.main.fadeIn(250, 11, 16, 32);
    audioManager.startMusic();

    const profile = storageManager.getActiveProfile();
    const title = titleText(this, width / 2, 70, "🦸 قفزة الأبطال", "48px");
    this.tweens.add({ targets: title, y: title.y - 6, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    bodyText(this, width / 2, 120, profile ? `مرحباً ${profile.name}!` : "", "22px");

    const items: Array<[string, string, () => void]> = [
      ["🎮 ابدأ اللعب", "green", () => this.scene.start("CharacterSelect", { standalone: false })],
      ["🎓 التدريب", "blue", () => this.scene.start("Training")],
      ["🧑 اختيار الشخصية", "yellow", () => this.scene.start("CharacterSelect", { standalone: true })],
      ["🌍 اختيار العالم", "yellow", () => this.scene.start("WorldSelect", { standalone: true })],
      ["👤 ملفي", "grey", () => this.scene.start("ProfileStats")],
      ["🏆 لوحة الأبطال", "red", () => this.scene.start("Leaderboard")],
      ["⚙️ الإعدادات", "grey", () => this.scene.start("Settings")],
    ];

    const startY = 185;
    const gap = 48;
    items.forEach(([label, color, cb], i) => {
      const btn = createBigButton(this, width / 2, startY + i * gap, label, color as any, cb, { width: 320, height: 42, fontSize: "20px" });
      btn.setAlpha(0);
      btn.x -= 40;
      this.tweens.add({ targets: btn, alpha: 1, x: width / 2, duration: 300, delay: 80 + i * 60, ease: "Quad.easeOut" });
    });
  }
}
