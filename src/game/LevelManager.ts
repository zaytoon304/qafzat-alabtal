import type { ObstacleType } from "../core/Types";

export interface LevelDef {
  id: number;
  name: string;
  description: string;
  allowedObstacleTypes: ObstacleType[];
  distanceGoalM: number; // مسافة افتراضية للإنهاء (تُحسب من الوقت × السرعة)
  hasBoss: boolean;
}

// مستويات تعليمية متدرجة — بند 19: كل مستوى يضيف حركة/عائق جديد بدل رمي كل شيء دفعة وحدة
export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: "تعلّم القفز",
    description: "اقفز فوق العوائق!",
    allowedObstacleTypes: ["LOW_OBSTACLE", "PIT"],
    distanceGoalM: 300,
    hasBoss: false,
  },
  {
    id: 2,
    name: "القفز والانحناء",
    description: "اقفز أو انحنِ حسب العائق",
    allowedObstacleTypes: ["LOW_OBSTACLE", "PIT", "OVERHEAD_OBSTACLE"],
    distanceGoalM: 400,
    hasBoss: false,
  },
  {
    id: 3,
    name: "يمين ويسار",
    description: "تحرّك يمين أو يسار لتفادي الحواجز",
    allowedObstacleTypes: ["OVERHEAD_OBSTACLE", "HIGH_OBSTACLE"],
    distanceGoalM: 400,
    hasBoss: false,
  },
  {
    id: 4,
    name: "كل الحركات الأساسية",
    description: "قفز + انحناء + يمين/يسار معاً",
    allowedObstacleTypes: ["LOW_OBSTACLE", "PIT", "OVERHEAD_OBSTACLE", "HIGH_OBSTACLE", "MOVING_OBSTACLE"],
    distanceGoalM: 500,
    hasBoss: false,
  },
  {
    id: 5,
    name: "التحدي الكامل",
    description: "كل الحركات الستة + الزعيم بالنهاية",
    allowedObstacleTypes: ["LOW_OBSTACLE", "PIT", "OVERHEAD_OBSTACLE", "HIGH_OBSTACLE", "MOVING_OBSTACLE", "MULTI_OBSTACLE"],
    distanceGoalM: 500,
    hasBoss: true,
  },
];

export class LevelManager {
  get(id: number): LevelDef {
    return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
  }

  all(): LevelDef[] {
    return LEVELS;
  }

  isUnlocked(id: number, completedLevels: number[]): boolean {
    if (id === 1) return true;
    return completedLevels.includes(id - 1);
  }

  // المستويات بعد الخامسة تتكرر بخليط عشوائي من كل الأنواع (لا نهاية للعب)
  getMixedEndless(): LevelDef {
    return {
      id: 999,
      name: "مغامرة مستمرة",
      description: "كل العوائق مختلطة",
      allowedObstacleTypes: ["LOW_OBSTACLE", "PIT", "OVERHEAD_OBSTACLE", "HIGH_OBSTACLE", "MOVING_OBSTACLE", "MULTI_OBSTACLE"],
      distanceGoalM: 100000,
      hasBoss: false,
    };
  }
}

export const levelManager = new LevelManager();
