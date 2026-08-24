import type { Difficulty } from "./Types";

// كل الأرقام القابلة للضبط بمكان واحد بدل توزيعها بالكود
export const GameConfig = {
  screen: { width: 960, height: 540 },

  vision: {
    poseDetectionThrottleMs: 33, // ~30 استنتاج بالثانية، منفصل عن حلقة الرسم 60fps
    minPoseConfidence: 0.5,
    jumpThresholdRatio: 0.09, // نسبة من ارتفاع الجسم لاعتبارها قفزة
    duckThresholdRatio: 0.12,
    lateralThresholdRatio: 0.18,
    turnShoulderRatioThreshold: 0.45, // نسبة عرض الكتف عند الدوران الجانبي
    raiseHandThresholdRatio: 0.05, // كم يجب أن يرتفع المعصم فوق الكتف
    motionCooldownMs: 350, // منع تكرار اكتشاف نفس الحركة بسرعة غير طبيعية
    playerLostTimeoutMs: 1500,
  },

  difficultySettings: {
    EASY: { obstacleSpeed: 220, spawnIntervalMs: 2200, reactionWindowMs: 900 },
    NORMAL: { obstacleSpeed: 280, spawnIntervalMs: 1800, reactionWindowMs: 700 },
    HARD: { obstacleSpeed: 340, spawnIntervalMs: 1400, reactionWindowMs: 550 },
    EXPERT: { obstacleSpeed: 400, spawnIntervalMs: 1100, reactionWindowMs: 420 },
  } as Record<Difficulty, { obstacleSpeed: number; spawnIntervalMs: number; reactionWindowMs: number }>,

  player: {
    startingLives: 3,
    invincibilityAfterHitMs: 1200,
  },

  scoring: {
    obstaclePassedPoints: 10,
    starPoints: 20,
    coinPoints: 5,
    comboMultiplierStep: 0.5, // كل مستوى Combo يضيف 0.5 لمضاعف النقاط
    comboBreakOnHit: true,
    comboTimeoutMs: 4000,
  },

  storageKeys: {
    profiles: "qafzat_profiles_v1",
    activeProfileId: "qafzat_active_profile_v1",
    leaderboard: "qafzat_leaderboard_v1",
  },
} as const;
