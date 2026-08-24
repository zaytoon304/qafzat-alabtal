// ناقل أحداث مركزي: كل نظام يتحدث مع الأنظمة الأخرى عبر أحداث بدل الاستدعاء المباشر
// هذا يسمح بإضافة حركات/أنظمة جديدة بدون تعديل الكود القديم

export const GameEvents = {
  // أحداث الرؤية الحاسوبية
  VISION_READY: "VISION_READY",
  VISION_LOST: "VISION_LOST",
  VISION_JUMP: "VISION_JUMP",
  VISION_DUCK: "VISION_DUCK",
  VISION_LEFT: "VISION_LEFT",
  VISION_RIGHT: "VISION_RIGHT",
  VISION_TURN: "VISION_TURN",
  VISION_RAISE_HAND: "VISION_RAISE_HAND",
  VISION_PLAYER_COUNT_CHANGED: "VISION_PLAYER_COUNT_CHANGED",

  // أحداث اللعب
  OBSTACLE_SPAWN: "OBSTACLE_SPAWN",
  OBSTACLE_PASSED: "OBSTACLE_PASSED",
  OBSTACLE_HIT: "OBSTACLE_HIT",
  COLLECT_STAR: "COLLECT_STAR",
  COLLECT_COIN: "COLLECT_COIN",
  POWERUP_SPAWN: "POWERUP_SPAWN",
  POWERUP_COLLECTED: "POWERUP_COLLECTED",
  POWERUP_EXPIRED: "POWERUP_EXPIRED",
  PLAYER_COLLISION: "PLAYER_COLLISION",
  PLAYER_LIFE_LOST: "PLAYER_LIFE_LOST",
  PLAYER_DIED: "PLAYER_DIED",
  SCORE_CHANGED: "SCORE_CHANGED",
  COMBO_CHANGED: "COMBO_CHANGED",
  COMBO_BROKEN: "COMBO_BROKEN",
  ACHIEVEMENT_UNLOCKED: "ACHIEVEMENT_UNLOCKED",

  // Boss
  BOSS_SPAWN: "BOSS_SPAWN",
  BOSS_HIT: "BOSS_HIT",
  BOSS_ATTACK: "BOSS_ATTACK",
  BOSS_DEFEATED: "BOSS_DEFEATED",
  BOSS_PLAYER_HIT: "BOSS_PLAYER_HIT",

  // حالة اللعبة
  STATE_CHANGED: "STATE_CHANGED",
  LEVEL_COMPLETE: "LEVEL_COMPLETE",
  GAME_OVER: "GAME_OVER",
  DIFFICULTY_CHANGED: "DIFFICULTY_CHANGED",

  // معايرة وتدريب
  CALIBRATION_COMPLETE: "CALIBRATION_COMPLETE",
  TRAINING_MOVE_SUCCESS: "TRAINING_MOVE_SUCCESS",
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];

type Listener<T = any> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  on<T = any>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener);
    return () => this.off(event, listener);
  }

  once<T = any>(event: string, listener: Listener<T>): void {
    const wrapper: Listener<T> = (payload) => {
      this.off(event, wrapper);
      listener(payload);
    };
    this.on(event, wrapper);
  }

  off(event: string, listener: Listener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit<T = any>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // ننسخ المصفوفة عشان لو أحد المستمعين ألغى اشتراكه أثناء التنفيذ ما يكسر الحلقة
    for (const listener of Array.from(set)) {
      listener(payload);
    }
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// نسخة واحدة مشتركة لكل اللعبة (Singleton) — كل الأنظمة تستورد نفس الكائن
export const eventBus = new EventBus();
