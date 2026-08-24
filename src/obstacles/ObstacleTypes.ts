import type { MotionType, ObstacleType } from "../core/Types";

// "ALL" = العائق يمتد بعرض المسارات الثلاثة (لازم قفز/انحناء بغض النظر عن المسار)
// رقم 0/1/2 = العائق بمسار محدد (لازم اللاعب يكون بمسار مختلف)
export type ObstacleLane = "ALL" | 0 | 1 | 2;

export interface ObstacleDef {
  type: ObstacleType;
  spriteTile: string; // مفتاح صورة Phaser
  laneMode: "ALL" | "SINGLE" | "MOVING";
  requiredMotions: MotionType[]; // كل الحركات المطلوبة يجب تنفيذها بنفس اللحظة تقريباً
  color: number;
  heightPx: number;
  widthPx: number;
  yOffsetPx: number; // إزاحة عن خط الأرض (سالب = عائق معلّق بالأعلى)
}

// بند 10: 6 أنواع عوائق، كل عائق مرتبط بحركة حقيقية (بند 11) — لا افتراض أن كل شيء يحتاج قفزة
export const OBSTACLE_DEFS: Record<ObstacleType, ObstacleDef> = {
  LOW_OBSTACLE: {
    type: "LOW_OBSTACLE",
    spriteTile: "tile_spike",
    laneMode: "ALL",
    requiredMotions: ["JUMP"],
    color: 0x8d6e63,
    heightPx: 46,
    widthPx: 46,
    yOffsetPx: 0,
  },
  OVERHEAD_OBSTACLE: {
    type: "OVERHEAD_OBSTACLE",
    spriteTile: "tile_door",
    laneMode: "ALL",
    requiredMotions: ["DUCK"],
    color: 0x5c6bc0,
    heightPx: 40,
    widthPx: 80,
    yOffsetPx: -90,
  },
  PIT: {
    type: "PIT",
    spriteTile: "tile_water",
    laneMode: "ALL",
    requiredMotions: ["JUMP"],
    color: 0x1565c0,
    heightPx: 30,
    widthPx: 90,
    yOffsetPx: 25,
  },
  HIGH_OBSTACLE: {
    type: "HIGH_OBSTACLE",
    spriteTile: "tile_block",
    laneMode: "SINGLE",
    requiredMotions: ["MOVE_LEFT", "MOVE_RIGHT"],
    color: 0x6d4c41,
    heightPx: 110,
    widthPx: 60,
    yOffsetPx: -40,
  },
  MOVING_OBSTACLE: {
    type: "MOVING_OBSTACLE",
    spriteTile: "tile_crate",
    laneMode: "MOVING",
    requiredMotions: ["MOVE_LEFT", "MOVE_RIGHT"],
    color: 0xef6c00,
    heightPx: 70,
    widthPx: 60,
    yOffsetPx: -15,
  },
  MULTI_OBSTACLE: {
    type: "MULTI_OBSTACLE",
    spriteTile: "tile_castle",
    laneMode: "ALL",
    requiredMotions: ["TURN", "RAISE_HAND"],
    color: 0xad1457,
    heightPx: 80,
    widthPx: 70,
    yOffsetPx: -10,
  },
};
