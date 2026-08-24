import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { WORLDS, worldManager } from "../../worlds/WorldManager";
import { titleText, createPanel, bodyText } from "../../ui/UIKit";
import { session } from "../Session";
import { storageManager } from "../../storage/LocalStorageManager";
import { audioManager } from "../../audio/AudioManager";

interface SceneData {
  standalone?: boolean;
}

// اختيار العالم — بند 21، تُفتح العوالم تدريجياً حسب التقدّم
export class WorldSelectScene extends Phaser.Scene {
  private standalone = true;

  constructor() {
    super("WorldSelect");
  }

  init(data: SceneData): void {
    this.standalone = data?.standalone ?? true;
  }

  create(): void {
    const { width, height } = GameConfig.screen;
    this.cameras.main.setBackgroundColor("#0b1020");
    titleText(this, width / 2, 60, "اختر العالم");

    const profile = storageManager.getActiveProfile();
    const cols = 3;
    const cellW = 260;
    const cellH = 150;
    const startX = width / 2 - cellW;
    const startY = 170;

    WORLDS.forEach((w, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * (cellH + 20);
      const unlocked = worldManager.isUnlocked(w, profile);

      const panel = createPanel(this, x, y, 230, cellH, unlocked ? 0x1b2b52 : 0x25262b, unlocked ? 0.95 : 0.75);
      this.add.rectangle(x, y - 30, 60, 60, w.groundColor).setStrokeStyle(3, w.accentColor);
      bodyText(this, x, y - 30, w.emoji, "30px");
      bodyText(this, x, y + 15, w.name, "20px", unlocked ? "#ffffff" : "#888888");

      if (!unlocked) {
        bodyText(this, x, y + 45, `🔒 أنهِ ${w.requiredLevelsCompleted} مراحل`, "14px", "#888888");
      } else {
        panel.setInteractive(new Phaser.Geom.Rectangle(-115, -75, 230, cellH), Phaser.Geom.Rectangle.Contains);
        panel.on("pointerdown", () => {
          audioManager.play("uiClick");
          session.selectedWorld = w.id;
          const p = storageManager.getActiveProfile();
          if (p) {
            p.world = w.id;
            storageManager.saveProfile(p);
          }
          this.scene.start(this.standalone ? "Menu" : "SetupPlay");
        });
      }

      if (session.selectedWorld === w.id && unlocked) {
        this.add.rectangle(x, y, 238, cellH + 8).setStrokeStyle(4, 0xffd700);
      }
    });
  }
}
