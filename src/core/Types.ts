// الأنواع الأساسية المشتركة بين كل أنظمة اللعبة

export type MotionType =
  | "JUMP"
  | "DUCK"
  | "MOVE_LEFT"
  | "MOVE_RIGHT"
  | "TURN"
  | "RAISE_HAND";

export type ObstacleType =
  | "LOW_OBSTACLE"
  | "HIGH_OBSTACLE"
  | "PIT"
  | "OVERHEAD_OBSTACLE"
  | "MOVING_OBSTACLE"
  | "MULTI_OBSTACLE";

export type Difficulty = "EASY" | "NORMAL" | "HARD" | "EXPERT";

export type GameStateName =
  | "BOOT"
  | "MENU"
  | "PROFILE"
  | "CHARACTER_SELECT"
  | "WORLD_SELECT"
  | "TRAINING"
  | "CALIBRATION"
  | "READY"
  | "PLAYING"
  | "PAUSED"
  | "BOSS"
  | "RESULTS"
  | "GAME_OVER"
  | "LEVEL_COMPLETE"
  | "LEADERBOARD";

export interface Vector2 {
  x: number;
  y: number;
}

// نقطة جسم واحدة يرجعها نظام الرؤية (MediaPipe Pose Landmark)
export interface BodyLandmark {
  x: number; // نسبة 0..1 من عرض الفيديو
  y: number; // نسبة 0..1 من ارتفاع الفيديو
  z: number;
  visibility?: number;
}

// فهرس نقاط الجسم حسب معيار MediaPipe Pose (33 نقطة)
export enum PoseLandmarkIndex {
  NOSE = 0,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
}

export interface PoseFrame {
  landmarks: BodyLandmark[];
  timestamp: number;
  personIndex: number; // ترتيب الشخص إذا في أكثر من لاعب أمام الكاميرا
}

export interface PlayerBaseline {
  hipY: number;
  shoulderY: number;
  hipX: number;
  shoulderWidth: number; // لمعرفة حجم الجسم (يستخدم لتطبيع الحركة)
  bboxHeight: number;
  capturedAt: number;
}

export type CharacterId = "hero_boy" | "hero_girl" | "robot" | "explorer" | "wizard";
export type WorldId = "forest" | "desert" | "space" | "future_city" | "volcano";

export interface PlayerProfileData {
  id: string;
  name: string;
  character: CharacterId;
  world: WorldId;
  highestScore: number;
  bestTimeSeconds: number | null;
  totalStars: number;
  totalCoins: number;
  levelsCompleted: number[];
  achievements: string[];
  createdAt: number;
  updatedAt: number;
}

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  character: CharacterId;
  date: number;
}
