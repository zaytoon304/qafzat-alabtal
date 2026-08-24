import { eventBus, GameEvents } from "../core/EventBus";
import { GameConfig } from "../core/Config";
import type { PlayerBaseline, PoseFrame } from "../core/Types";
import { PoseDetector } from "./PoseDetector";
import { CalibrationSession } from "./Calibration";
import { motionRecognition } from "./MotionRecognition";

export type VisionMode = "idle" | "calibrating" | "tracking";

// المسؤول الوحيد عن الكاميرا وحلقة الرؤية. منفصل تماماً عن حلقة رسم اللعبة (Phaser)
// حتى لا يسبب تحليل الفيديو أي تهنيج (Lag) بالرسم — بند 29
export class VisionController {
  private video: HTMLVideoElement;
  private detector = new PoseDetector();
  private stream: MediaStream | null = null;
  private rafHandle = 0;
  private lastInferenceAt = 0;
  private mode: VisionMode = "idle";
  private calibrationSessions: Map<number, CalibrationSession> = new Map();
  private baselines: Map<number, PlayerBaseline> = new Map();
  private latestFrames: PoseFrame[] = [];
  private lastSeenAt = new Map<number, number>();
  private lostCheckHandle = 0;

  constructor() {
    this.video = document.createElement("video");
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;
  }

  get videoElement(): HTMLVideoElement {
    return this.video;
  }

  get currentMode(): VisionMode {
    return this.mode;
  }

  get isCameraActive(): boolean {
    return !!this.stream;
  }

  async start(numPlayers: number): Promise<void> {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 960 }, height: { ideal: 540 }, facingMode: "user" },
      audio: false,
    });
    this.video.srcObject = this.stream;
    await this.video.play();
    await this.detector.initialize(numPlayers);
    this.mode = "tracking";
    eventBus.emit(GameEvents.VISION_READY, { numPlayers });
    this.loop();
    this.lostCheckHandle = window.setInterval(() => this.checkLostPlayers(), 500);
  }

  stop(): void {
    cancelAnimationFrame(this.rafHandle);
    window.clearInterval(this.lostCheckHandle);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.mode = "idle";
    this.detector.dispose();
  }

  // يبدأ جمع خط أساس لاعب معيّن (يُستدعى من شاشة المعايرة)
  beginCalibration(playerIndex: number): void {
    this.calibrationSessions.set(playerIndex, new CalibrationSession());
    this.mode = "calibrating";
  }

  getCalibrationProgress(playerIndex: number): number {
    return this.calibrationSessions.get(playerIndex)?.progress ?? 0;
  }

  isBaselineReady(playerIndex: number): boolean {
    return this.baselines.has(playerIndex);
  }

  getBaseline(playerIndex: number): PlayerBaseline | undefined {
    return this.baselines.get(playerIndex);
  }

  finishCalibrationMode(): void {
    this.mode = "tracking";
  }

  getLatestFrames(): PoseFrame[] {
    return this.latestFrames;
  }

  private loop = (): void => {
    this.rafHandle = requestAnimationFrame(this.loop);
    if (!this.detector.isReady || this.video.readyState < 2) return;

    const now = performance.now();
    if (now - this.lastInferenceAt < GameConfig.vision.poseDetectionThrottleMs) return;
    this.lastInferenceAt = now;

    const frames = this.detector.detect(this.video, now);
    this.latestFrames = frames;

    for (const frame of frames) {
      this.lastSeenAt.set(frame.personIndex, now);

      if (this.mode === "calibrating") {
        const session = this.calibrationSessions.get(frame.personIndex);
        if (session) {
          const baseline = session.addFrame(frame.landmarks);
          if (baseline) {
            this.baselines.set(frame.personIndex, baseline);
            eventBus.emit(GameEvents.CALIBRATION_COMPLETE, { playerIndex: frame.personIndex, baseline });
          }
        }
        continue;
      }

      const baseline = this.baselines.get(frame.personIndex);
      if (baseline) {
        motionRecognition.process(frame.personIndex, frame.landmarks, baseline, now);
      }
    }

    eventBus.emit(GameEvents.VISION_PLAYER_COUNT_CHANGED, { count: frames.length });
  };

  private checkLostPlayers(): void {
    const now = performance.now();
    for (const [playerIndex, lastSeen] of this.lastSeenAt.entries()) {
      if (now - lastSeen > GameConfig.vision.playerLostTimeoutMs) {
        eventBus.emit(GameEvents.VISION_LOST, { playerIndex });
        this.lastSeenAt.delete(playerIndex);
      }
    }
  }
}

export const visionController = new VisionController();
