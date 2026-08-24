import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { titleText, bodyText, createBigButton } from "../../ui/UIKit";
import { session } from "../Session";
import { visionController } from "../../vision/VisionController";

// المعايرة — بند 6: "قفوا بمكان مناسب" ثم "ثبتوا مكانكم" ثم "ممتاز! جاهزين؟"
export class CalibrationScene extends Phaser.Scene {
  private videoEl: HTMLVideoElement | null = null;
  private statusText!: Phaser.GameObjects.Text;
  private progressBars: Phaser.GameObjects.Rectangle[] = [];
  private phase: "starting" | "positioning" | "capturing" | "done" | "error" = "starting";
  private phaseTimer = 0;

  constructor() {
    super("Calibration");
  }

  create(): void {
    const { width, height } = GameConfig.screen;
    this.cameras.main.setBackgroundColor("#0b1020");
    titleText(this, width / 2, 50, "نجهّز الكاميرا", "34px");
    this.statusText = bodyText(this, width / 2, height - 130, "نطلب إذن الكاميرا...", "24px");

    const barWidth = 400;
    for (let i = 0; i < session.playerCount; i++) {
      const bg = this.add.rectangle(width / 2, height - 80 + i * 30, barWidth, 18, 0x222222).setStrokeStyle(2, 0xffffff);
      const bar = this.add.rectangle(width / 2 - barWidth / 2, height - 80 + i * 30, 4, 12, 0x4fd1c5).setOrigin(0, 0.5);
      this.progressBars.push(bar);
    }

    this.phase = "starting";
    this.initCamera();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupVideo());
  }

  private async initCamera(): Promise<void> {
    try {
      await visionController.start(session.playerCount);
      this.attachVideoPreview();
      this.statusText.setText("قفوا بمكان مناسب أمام الكاميرا 🧍");
      this.phase = "positioning";
      this.phaseTimer = 1800;
    } catch (err) {
      console.error("[Calibration] فشل تشغيل الكاميرا:", err);
      this.phase = "error";
      this.statusText.setText("تعذّر فتح الكاميرا! تأكد من السماح للمتصفح باستخدامها ثم أعد المحاولة");
      createBigButton(this, GameConfig.screen.width / 2, GameConfig.screen.height - 40, "إعادة المحاولة", "yellow", () => {
        this.scene.restart();
      }, { width: 220 });
    }
  }

  private attachVideoPreview(): void {
    const video = visionController.videoElement;
    video.style.position = "absolute";
    video.style.left = "50%";
    video.style.top = "140px";
    video.style.transform = "translate(-50%, 0) scaleX(-1)"; // مرآة طبيعية
    video.style.width = "480px";
    video.style.borderRadius = "16px";
    video.style.border = "3px solid #4fd1c5";
    document.getElementById("app")?.appendChild(video);
    this.videoEl = video;
  }

  update(_time: number, delta: number): void {
    if (this.phase === "positioning") {
      this.phaseTimer -= delta;
      if (this.phaseTimer <= 0) {
        this.statusText.setText("جاهزين؟ ثبّتوا مكانكم... 📸");
        for (let i = 0; i < session.playerCount; i++) {
          visionController.beginCalibration(i);
        }
        this.phase = "capturing";
      }
      return;
    }

    if (this.phase === "capturing") {
      let allReady = true;
      const barWidth = 400;
      for (let i = 0; i < session.playerCount; i++) {
        const progress = visionController.getCalibrationProgress(i);
        this.progressBars[i]?.setSize(Math.max(4, barWidth * progress), 12);
        if (progress < 1) allReady = false;
      }
      if (allReady) {
        session.calibratedBaselines.clear();
        for (let i = 0; i < session.playerCount; i++) {
          const b = visionController.getBaseline(i);
          if (b) session.calibratedBaselines.set(i, b);
        }
        visionController.finishCalibrationMode();
        this.statusText.setText("ممتاز! جاهزين؟ 🎉");
        this.phase = "done";
        this.time.delayedCall(900, () => {
          this.cleanupVideo();
          this.scene.start("Game");
        });
      }
    }
  }

  private cleanupVideo(): void {
    this.videoEl?.remove();
    this.videoEl = null;
  }
}
