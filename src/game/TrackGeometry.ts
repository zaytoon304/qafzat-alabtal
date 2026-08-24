import { GameConfig } from "../core/Config";

// نظام إحداثيات مشترك بين كل الأنظمة التي "تُصدر" عناصر متحركة (عوائق/نجوم/عملات/Power-ups)
// وبين GameScene الذي يرسمها. القيمة x تمثل "المسافة المتبقية حتى خط اللاعب" (تنزل من SPAWN_X إلى الصفر)
export const TRACK_SPAWN_X = GameConfig.screen.width + 80;
export const TRACK_HIT_LINE_X = 170;
export const TRACK_CLEANUP_X = -150;

export type LaneIndex = 0 | 1 | 2;
export const LANE_COUNT = 3;
