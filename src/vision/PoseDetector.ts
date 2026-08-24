import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import type { PoseFrame } from "../core/Types";

// يشغّل نموذج MediaPipe Pose محلياً بالكامل (WASM) لاكتشاف نقاط الجسم من الفيديو
// لا يوجد أي اتصال بالإنترنت هنا — الملفات محملة من public/mediapipe محلياً
export class PoseDetector {
  private landmarker: PoseLandmarker | null = null;
  private loading = false;

  async initialize(numPoses: number): Promise<void> {
    if (this.landmarker || this.loading) return;
    this.loading = true;
    try {
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      this.landmarker = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "/mediapipe/models/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (gpuError) {
      // بعض أجهزة Mac القديمة لا تدعم تفويض GPU بالمتصفح — نرجع لـ CPU تلقائياً
      console.warn("[PoseDetector] فشل تفويض GPU، المحاولة عبر CPU:", gpuError);
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      this.landmarker = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "/mediapipe/models/pose_landmarker_lite.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } finally {
      this.loading = false;
    }
  }

  get isReady(): boolean {
    return this.landmarker !== null;
  }

  detect(video: HTMLVideoElement, timestampMs: number): PoseFrame[] {
    if (!this.landmarker) return [];
    const result: PoseLandmarkerResult = this.landmarker.detectForVideo(video, timestampMs);
    return result.landmarks.map((landmarks, personIndex) => ({
      landmarks: landmarks.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility })),
      timestamp: timestampMs,
      personIndex,
    }));
  }

  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
