import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import type { Difficulty } from "../../core/Types";
import { titleText, bodyText, createBigButton, createPanel } from "../../ui/UIKit";
import { session } from "../Session";
import { levelManager } from "../LevelManager";
import { storageManager } from "../../storage/LocalStorageManager";

const DIFFICULTIES: Difficulty[] = ["EASY", "NORMAL", "HARD", "EXPERT"];
const DIFFICULTY_LABELS: Record<Difficulty, string> = { EASY: "سهل", NORMAL: "عادي", HARD: "صعب", EXPERT: "خبير" };

// تحديد عدد اللاعبين + الصعوبة + المرحلة قبل المعايرة — بند 5 و22
export class SetupPlayScene extends Phaser.Scene {
  private difficultyLabelText!: Phaser.GameObjects.Text;
  private playerCountLabelText!: Phaser.GameObjects.Text;
  private levelLabelText!: Phaser.GameObjects.Text;
  private levelIndex = 0;

  constructor() {
    super("SetupPlay");
  }

  create(): void {
    const { width, height } = GameConfig.screen;
    this.cameras.main.setBackgroundColor("#0b1020");
    titleText(this, width / 2, 50, "جاهزين نبدأ؟", "38px");

    const profile = storageManager.getActiveProfile();
    const completed = profile?.levelsCompleted ?? [];
    const unlockedLevels = levelManager.all().filter((l) => levelManager.isUnlocked(l.id, completed));
    this.levelIndex = Math.max(0, unlockedLevels.findIndex((l) => l.id === session.selectedLevelId));
    if (this.levelIndex < 0) this.levelIndex = 0;

    // عدد اللاعبين
    createPanel(this, width / 2, 130, 560, 90);
    bodyText(this, width / 2, 105, "👤👥 عدد اللاعبين", "20px");
    this.playerCountLabelText = bodyText(this, width / 2, 145, this.playerCountLabel(), "24px", "#ffd54f");
    createBigButton(this, width / 2 - 220, 145, "◀", "grey", () => this.changePlayerCount(-1), { width: 60, height: 50 });
    createBigButton(this, width / 2 + 220, 145, "▶", "grey", () => this.changePlayerCount(1), { width: 60, height: 50 });

    // الصعوبة
    createPanel(this, width / 2, 240, 560, 90);
    bodyText(this, width / 2, 215, "⚙️ مستوى الصعوبة", "20px");
    this.difficultyLabelText = bodyText(this, width / 2, 255, DIFFICULTY_LABELS[session.difficulty], "24px", "#ffd54f");
    createBigButton(this, width / 2 - 220, 255, "◀", "grey", () => this.changeDifficulty(-1), { width: 60, height: 50 });
    createBigButton(this, width / 2 + 220, 255, "▶", "grey", () => this.changeDifficulty(1), { width: 60, height: 50 });

    // المرحلة
    createPanel(this, width / 2, 350, 560, 90);
    bodyText(this, width / 2, 325, "🗺️ المرحلة", "20px");
    this.levelLabelText = bodyText(this, width / 2, 365, this.levelLabel(unlockedLevels), "22px", "#ffd54f");
    createBigButton(this, width / 2 - 220, 365, "◀", "grey", () => this.changeLevel(-1, unlockedLevels), { width: 60, height: 50 });
    createBigButton(this, width / 2 + 220, 365, "▶", "grey", () => this.changeLevel(1, unlockedLevels), { width: 60, height: 50 });

    createBigButton(this, width / 2, 460, "ابدأ المعايرة", "green", () => {
      session.selectedLevelId = unlockedLevels[this.levelIndex]?.id ?? 1;
      this.scene.start("Calibration");
    }, { width: 260 });

    createBigButton(this, 90, 40, "رجوع", "grey", () => this.scene.start("Menu"), { width: 120, height: 44, fontSize: "18px" });
  }

  private playerCountLabel(): string {
    return session.playerCount === 1 ? "👤 لاعب واحد" : `👥 مجموعة (${session.playerCount} لاعبين)`;
  }

  private changePlayerCount(delta: number): void {
    session.playerCount = Phaser.Math.Clamp(session.playerCount + delta, 1, 4);
    this.playerCountLabelText.setText(this.playerCountLabel());
  }

  private changeDifficulty(delta: number): void {
    const idx = DIFFICULTIES.indexOf(session.difficulty);
    const next = Phaser.Math.Clamp(idx + delta, 0, DIFFICULTIES.length - 1);
    session.difficulty = DIFFICULTIES[next];
    this.difficultyLabelText.setText(DIFFICULTY_LABELS[session.difficulty]);
  }

  private levelLabel(levels: ReturnType<typeof levelManager.all>): string {
    const l = levels[this.levelIndex];
    return l ? `${l.id}. ${l.name}` : "";
  }

  private changeLevel(delta: number, levels: ReturnType<typeof levelManager.all>): void {
    this.levelIndex = Phaser.Math.Clamp(this.levelIndex + delta, 0, levels.length - 1);
    this.levelLabelText.setText(this.levelLabel(levels));
  }
}
