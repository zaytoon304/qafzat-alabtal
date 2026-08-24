import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { titleText, bodyText, createBigButton, createPanel } from "../../ui/UIKit";
import { audioManager } from "../../audio/AudioManager";

// الإعدادات — بند 7
export class SettingsScene extends Phaser.Scene {
  private muteLabel!: Phaser.GameObjects.Text;

  constructor() {
    super("Settings");
  }

  create(): void {
    const { width, height } = GameConfig.screen;
    this.cameras.main.setBackgroundColor("#0b1020");
    titleText(this, width / 2, 60, "⚙️ الإعدادات");

    createPanel(this, width / 2, 180, 480, 90);
    this.muteLabel = bodyText(this, width / 2, 180, audioManager.isMuted() ? "🔇 الصوت مطفأ" : "🔊 الصوت شغّال", "24px");
    createBigButton(this, width / 2, 260, "تبديل الصوت", "blue", () => {
      audioManager.setMuted(!audioManager.isMuted());
      this.muteLabel.setText(audioManager.isMuted() ? "🔇 الصوت مطفأ" : "🔊 الصوت شغّال");
    }, { width: 260 });

    createBigButton(this, width / 2, 350, "👤 تبديل اللاعب", "yellow", () => this.scene.start("Profile"), { width: 260 });

    createBigButton(this, width / 2, height - 50, "رجوع", "grey", () => this.scene.start("Menu"), { width: 200 });
  }
}
