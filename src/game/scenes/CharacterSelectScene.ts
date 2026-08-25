import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { CHARACTERS, poseKey } from "../../characters/CharacterManager";
import { titleText, createPanel, bodyText, sceneBackdrop } from "../../ui/UIKit";
import { session } from "../Session";
import { storageManager } from "../../storage/LocalStorageManager";
import { audioManager } from "../../audio/AudioManager";

interface SceneData {
  standalone?: boolean;
}

// اختيار الشخصية — بند 20
export class CharacterSelectScene extends Phaser.Scene {
  private standalone = true;

  constructor() {
    super("CharacterSelect");
  }

  init(data: SceneData): void {
    this.standalone = data?.standalone ?? true;
  }

  create(): void {
    const { width, height } = GameConfig.screen;
    sceneBackdrop(this);
    titleText(this, width / 2, 70, "اختر شخصيتك");

    const startX = width / 2 - ((CHARACTERS.length - 1) / 2) * 150;
    CHARACTERS.forEach((c, i) => {
      const x = startX + i * 150;
      const y = height / 2;
      const panel = createPanel(this, x, y, 130, 190, 0x1b2b52);
      panel.setInteractive(new Phaser.Geom.Rectangle(-65, -95, 130, 190), Phaser.Geom.Rectangle.Contains);

      const img = this.add.image(x, y - 30, poseKey(c.spriteKey, "idle")).setDisplaySize(90 * c.aspect, 90);
      bodyText(this, x, y + 45, `${c.emoji} ${c.name}`, "18px");

      const select = () => {
        audioManager.play("uiClick");
        session.selectedCharacter = c.id;
        const profile = storageManager.getActiveProfile();
        if (profile) {
          profile.character = c.id;
          storageManager.saveProfile(profile);
        }
        this.scene.start(this.standalone ? "Menu" : "WorldSelect", { standalone: this.standalone });
      };
      panel.on("pointerdown", select);
      img.setInteractive({ useHandCursor: true }).on("pointerdown", select);

      if (session.selectedCharacter === c.id) {
        this.add.rectangle(x, y, 138, 198).setStrokeStyle(4, 0xffd700);
      }
    });

    bodyText(this, width / 2, height - 40, "اضغط على الشخصية عشان تختارها", "18px", "#a0a8c0");
  }
}
