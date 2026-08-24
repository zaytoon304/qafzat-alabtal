import { PoseLandmarkIndex, type BodyLandmark, type PlayerBaseline } from "../core/Types";

// كل دالة هنا تحوّل نقاط الجسم الخام إلى "إشارة" رقمية واحدة تُقارَن بحد أدنى (Threshold)
// الإشارات مطبَّعة (Normalized) بحجم جسم اللاعب (bboxHeight / shoulderWidth) عشان تشتغل
// بنفس الدقة سواء كان الطفل قريب أو بعيد عن الكاميرا

function mid(a: BodyLandmark, b: BodyLandmark): BodyLandmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

function visible(lm?: BodyLandmark): lm is BodyLandmark {
  return !!lm && (lm.visibility === undefined || lm.visibility > 0.3);
}

// ملاحظة: محور Y بإحداثيات MediaPipe يزيد للأسفل (0 أعلى الصورة). القفز = ارتفاع الجسم = انخفاض Y

export function jumpSignal(landmarks: BodyLandmark[], baseline: PlayerBaseline): number {
  const lh = landmarks[PoseLandmarkIndex.LEFT_HIP];
  const rh = landmarks[PoseLandmarkIndex.RIGHT_HIP];
  const ls = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const rs = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  if (!visible(lh) || !visible(rh) || !visible(ls) || !visible(rs)) return 0;
  const hip = mid(lh, rh);
  const rise = baseline.hipY - hip.y; // موجب = ارتفع عن خط الأساس
  return rise / baseline.bboxHeight;
}

export function duckSignal(landmarks: BodyLandmark[], baseline: PlayerBaseline): number {
  const lh = landmarks[PoseLandmarkIndex.LEFT_HIP];
  const rh = landmarks[PoseLandmarkIndex.RIGHT_HIP];
  const ls = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const rs = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  if (!visible(lh) || !visible(rh) || !visible(ls) || !visible(rs)) return 0;
  const shoulder = mid(ls, rs);
  const drop = shoulder.y - baseline.shoulderY; // موجب = نزل الكتف (انحناء)
  return drop / baseline.bboxHeight;
}

export function lateralSignal(landmarks: BodyLandmark[], baseline: PlayerBaseline): number {
  const lh = landmarks[PoseLandmarkIndex.LEFT_HIP];
  const rh = landmarks[PoseLandmarkIndex.RIGHT_HIP];
  if (!visible(lh) || !visible(rh)) return 0;
  const hip = mid(lh, rh);
  // في MediaPipe المرآة (selfie view) يمين الطفل = يمين الشاشة تلقائياً لأننا نعرض الفيديو مقلوباً أفقياً
  const shift = hip.x - baseline.hipX;
  return shift / Math.max(0.05, baseline.shoulderWidth);
}

// الدوران الجانبي يقلّص عرض الكتف الظاهر للكاميرا بشكل ملحوظ
export function turnSignal(landmarks: BodyLandmark[], baseline: PlayerBaseline): number {
  const ls = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const rs = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  if (!visible(ls) || !visible(rs)) return 0;
  const currentWidth = Math.abs(ls.x - rs.x);
  const shrink = baseline.shoulderWidth - currentWidth;
  return shrink / Math.max(0.05, baseline.shoulderWidth);
}

export function raiseHandSignal(landmarks: BodyLandmark[], baseline: PlayerBaseline): number {
  const lw = landmarks[PoseLandmarkIndex.LEFT_WRIST];
  const rw = landmarks[PoseLandmarkIndex.RIGHT_WRIST];
  const ls = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const rs = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  if (!visible(ls) || !visible(rs)) return 0;
  const shoulderY = mid(ls, rs).y;
  let best = 0;
  if (visible(lw)) best = Math.max(best, shoulderY - lw.y);
  if (visible(rw)) best = Math.max(best, shoulderY - rw.y);
  return best / baseline.bboxHeight;
}
