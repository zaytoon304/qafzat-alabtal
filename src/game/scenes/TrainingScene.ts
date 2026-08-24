import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { titleText, bodyText, createBigButton } from "../../ui/UIKit";
import { visionController } from "../../vision/VisionController";
import { eventBus, GameEvents } from "../../core/EventBus";
import { audioManager } from "../../audio/AudioManager";

interface TrainingStep {
  title: string;
  instruction: string;
  emoji: string;
  event: string;
}

// وضع التدريب — بند 8: تعليم → تجربة → اكتشاف بالكاميرا → نجاح → تشجيع
const STEPS: TrainingStep[] = [
  { title: "القفز", instruction: "اقفز لأعلى!", emoji: "⬆️", event: GameEvents.VISION_JUMP },
  { title: "الانحناء", instruction: "انحنِ للأسفل!", emoji: "⬇️", event: GameEvents.VISION_DUCK },
  { title: "الحركة يمين", instruction: "تحرّك يمين!", emoji: "➡️", event: GameEvents.VISION_RIGHT },
  { title: "الحركة يسار", instruction: "تحرّك يسار!", emoji: "⬅️", event: GameEvents.VISION_LEFT },
  { title: "الدوران", instruction: "لِف حول نفسك!", emoji: "🔄", event: GameEvents.VISION_TURN },
  { title: "رفع اليد", instruction: "ارفع يدك للأعلى!", emoji: "🖐️", event: GameEvents.VISION_RAISE_HAND },
];

const ENCOURAGEMENTS = ["رائع!", "ممتاز!", "كفو!", "يا سلام!", "أبدعت!"];

export class TrainingScene extends Phaser.Scene {
  private videoEl: HTMLVideoElement | null = null;
  private stepIndex = 0;
  private statusText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private emojiText!: Phaser.GameObjects.Text;
  private unsubscribe: (() => void) | null = null;
  private phase: "loading" | "calibrating" | "training" | "success" = "loading";
  private phaseTimer = 0;

  constructor() {
    super("Training");
  }

  create(): void {
    const { width, height } = GameConfig.screen;
    this.cameras.main.setBackgroundColor("#0b1020");
    titleText(this, width / 2, 45, "وضع التدريب 🎓", "32px");
    this.emojiText = this.add.text(width / 2, 150, "", { fontSize: "70px" }).setOrigin(0.5);
    this.instructionText = bodyText(this, width / 2, 230, "", "30px", "#ffd54f");
    this.statusText = bodyText(this, width / 2, height - 50, "نجهّز الكاميرا...", "22px");

    createBigButton(this, 90, 40, "رجوع", "grey", () => this.exit(), { width: 120, height: 44, fontSize: "18px" });

    this.startCamera();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  private async startCamera(): Promise<void> {
    try {
      await visionController.start(1);
      const video = visionController.videoElement;
      video.style.position = "absolute";
      video.style.left = "50%";
      video.style.bottom = "20px";
      video.style.transform = "translate(-50%, 0) scaleX(-1)";
      video.style.width = "280px";
      video.style.borderRadius = "12px";
      video.style.border = "3px solid #4fd1c5";
      document.getElementById("app")?.appendChild(video);
      this.videoEl = video;

      visionController.beginCalibration(0);
      this.phase = "calibrating";
      this.statusText.setText("قف بمكان مناسب... ثبّت مكانك 📸");
    } catch (err) {
      console.error("[Training] فشل تشغيل الكاميرا:", err);
      this.statusText.setText("تعذّر فتح الكاميرا، تأكد من إعطاء الإذن");
    }
  }

  update(_time: number, delta: number): void {
    if (this.phase === "calibrating") {
      if (visionController.getCalibrationProgress(0) >= 1) {
        visionController.finishCalibrationMode();
        this.phase = "training";
        this.beginStep(0);
      }
      return;
    }

    if (this.phase === "success") {
      this.phaseTimer -= delta;
      if (this.phaseTimer <= 0) {
        this.stepIndex++;
        if (this.stepIndex >= STEPS.length) {
          this.finishTraining();
        } else {
          this.beginStep(this.stepIndex);
        }
      }
    }
  }

  private beginStep(index: number): void {
    this.phase = "training";
    const step = STEPS[index];
    this.emojiText.setText(step.emoji);
    this.instructionText.setText(step.instruction);
    this.statusText.setText(`الحركة ${index + 1} من ${STEPS.length}: ${step.title}`);

    this.unsubscribe?.();
    this.unsubscribe = eventBus.on(step.event, (p: { playerIndex: number }) => {
      if (p.playerIndex !== 0 || this.phase !== "training") return;
      this.onStepSuccess();
    });
  }

  private onStepSuccess(): void {
    this.phase = "success";
    this.phaseTimer = 1100;
    audioManager.play("success");
    const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    this.instructionText.setText(`✅ ${msg}`);
    this.tweens.add({ targets: this.emojiText, scale: 1.4, duration: 200, yoyo: true });
  }

  private finishTraining(): void {
    this.statusText.setText("أحسنت! تعلّمت كل الحركات 🎉");
    this.instructionText.setText("");
    this.emojiText.setText("🏆");
    audioManager.play("levelComplete");
    this.time.delayedCall(1600, () => this.exit());
  }

  private exit(): void {
    this.cleanup();
    this.scene.start("Menu");
  }

  private cleanup(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.videoEl?.remove();
    this.videoEl = null;
    visionController.stop();
  }
}
