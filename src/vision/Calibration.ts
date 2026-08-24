import { PoseLandmarkIndex, type BodyLandmark, type PlayerBaseline } from "../core/Types";

const CALIBRATION_FRAMES_NEEDED = 30; // نجمع ~1 ثانية من الإطارات المستقرة (30fps تقريباً)

function mid(a: BodyLandmark, b: BodyLandmark): BodyLandmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

// يجمع خط أساس (Baseline) لكل لاعب: أين يقف بشكل طبيعي قبل أي حركة
// كل الكاشفات (Jump/Duck/...) تقارن الوضع الحالي بهذا الخط
export class CalibrationSession {
  private samples: PlayerBaseline[] = [];
  private done = false;

  get isComplete(): boolean {
    return this.done;
  }

  get progress(): number {
    return Math.min(1, this.samples.length / CALIBRATION_FRAMES_NEEDED);
  }

  addFrame(landmarks: BodyLandmark[]): PlayerBaseline | null {
    if (this.done) return this.result();

    const leftHip = landmarks[PoseLandmarkIndex.LEFT_HIP];
    const rightHip = landmarks[PoseLandmarkIndex.RIGHT_HIP];
    const leftShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
    const rightShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
    const leftAnkle = landmarks[PoseLandmarkIndex.LEFT_ANKLE];
    const rightAnkle = landmarks[PoseLandmarkIndex.RIGHT_ANKLE];
    if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) return null;

    const hip = mid(leftHip, rightHip);
    const shoulder = mid(leftShoulder, rightShoulder);
    const ankleY = leftAnkle && rightAnkle ? (leftAnkle.y + rightAnkle.y) / 2 : hip.y + 0.3;

    this.samples.push({
      hipY: hip.y,
      shoulderY: shoulder.y,
      hipX: hip.x,
      shoulderWidth: Math.abs(leftShoulder.x - rightShoulder.x),
      bboxHeight: Math.max(0.05, ankleY - shoulder.y),
      capturedAt: performance.now(),
    });

    if (this.samples.length >= CALIBRATION_FRAMES_NEEDED) {
      this.done = true;
    }
    return this.done ? this.result() : null;
  }

  private result(): PlayerBaseline {
    const n = this.samples.length;
    const avg = (key: keyof PlayerBaseline) =>
      this.samples.reduce((sum, s) => sum + (s[key] as number), 0) / n;
    return {
      hipY: avg("hipY"),
      shoulderY: avg("shoulderY"),
      hipX: avg("hipX"),
      shoulderWidth: avg("shoulderWidth"),
      bboxHeight: avg("bboxHeight"),
      capturedAt: performance.now(),
    };
  }

  reset(): void {
    this.samples = [];
    this.done = false;
  }
}
