// يحوّل إشارة رقمية مستمرة (Signal) إلى حدث لحظي واحد (Trigger)
// يستخدم عتبتين مختلفتين للدخول والخروج (Schmitt Trigger) عشان الإشارة المهتزة
// (اهتزاز طبيعي بالكاميرا/الجسم) ما تسبب أحداث مكررة بالخطأ + فترة تهدئة (Cooldown)
export class EdgeTrigger {
  private active = false;
  // -Infinity وليس 0: لو بدأ التتبع عند now قريب من الصفر (بداية اللعبة)، أول حركة حقيقية
  // ما لازم تُحجب بحجة "التهدئة" ضد إطلاق وهمي بزمن صفر لم يحدث فعلياً
  private lastFiredAt = -Infinity;

  constructor(
    private readonly enterThreshold: number,
    private readonly exitThreshold: number,
    private readonly cooldownMs: number,
  ) {}

  // يرجع true مرة واحدة فقط لحظة عبور الإشارة الحد الأدنى (بداية الحركة)
  update(signal: number, now: number): boolean {
    if (!this.active) {
      if (signal >= this.enterThreshold && now - this.lastFiredAt >= this.cooldownMs) {
        this.active = true;
        this.lastFiredAt = now;
        return true;
      }
    } else if (signal <= this.exitThreshold) {
      this.active = false;
    }
    return false;
  }

  reset(): void {
    this.active = false;
  }
}
