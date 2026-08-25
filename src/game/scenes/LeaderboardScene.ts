import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { leaderboard } from "../../scoring/Leaderboard";
import { characterManager } from "../../characters/CharacterManager";
import { titleText, bodyText, createBigButton, sceneBackdrop } from "../../ui/UIKit";

const MEDALS = ["🥇", "🥈", "🥉"];

// لوحة الأبطال المحلية — بند 25
export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("Leaderboard");
  }

  create(): void {
    const { width, height } = GameConfig.screen;
    sceneBackdrop(this);
    titleText(this, width / 2, 55, "🏆 لوحة الأبطال");

    const entries = leaderboard.top(8);
    if (entries.length === 0) {
      bodyText(this, width / 2, height / 2, "لا توجد نتائج بعد، العب أول جولة!", "24px");
    } else {
      entries.forEach((e, i) => {
        const y = 110 + i * 42;
        const medal = MEDALS[i] ?? `${i + 1}.`;
        const charDef = characterManager.get(e.character);
        bodyText(this, width / 2, y, `${medal} ${e.playerName} ${charDef.emoji} — ${e.score}`, "22px");
      });
    }

    createBigButton(this, width / 2, height - 50, "رجوع", "grey", () => this.scene.start("Menu"), { width: 200 });
  }
}
