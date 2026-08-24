# ذاكرة مشروع "قفزة الأبطال"

## الوضع الحالي (2026-08-24)
**البناء مكتمل فعلياً بكل الأنظمة الـ46 المطلوبة، ومُختبر آلياً (56 اختبار Vitest ناجح + build نظيف).**
الجزء الوحيد المتبقي: تجربة حقيقية بجسد طفل أمام الكاميرا (Claude لا يملك جسداً ليقوم بهذا). راجع قسم "⚠️" بنهاية PLAN.md للتفاصيل الكاملة والصادقة.

## القرارات المقفولة (لا تعيد سؤال المستخدم عنها)
- المسار: `/Users/mac/Desktop/أردوينو/المشاريع والكتب/qafzat-alabtal/`
- التقنية: TypeScript + Vite + Phaser 3 + MediaPipe Tasks Vision (Pose Landmarker، محلي بالكامل عبر public/mediapipe)
- الرسومات: Kenney.nl Scribble Platformer + UI Pack (CC0) — راجع public/assets/CREDITS.md
- ممنوع Fake/Random Detection في أي مرحلة غير Debug Mode — والنظام فعلاً لا يستخدم عشوائية بمنطق الحركة

## انحرافات هندسية بسيطة عن الخطة الأصلية (وسببها)
- لا يوجد ملف "MotionController" منفصل — دُمج داخل VisionController + MotionRecognition (نفس الفصل المطلوب بواجهتين لا ثلاث).
- لا يوجد ملفات منفصلة لكل نوع عائق (LowObstacle.ts, HighObstacle.ts...) — كلها Descriptor objects بملف واحد `obstacles/ObstacleTypes.ts` يقرأه `ObstacleManager.ts` (نفس المرونة، أقل تكرار كود).
- `MULTI_OBSTACLE` يتطلب حركتي TURN+RAISE_HAND معاً (بدل JUMP+RAISE_HAND) — عشان كل حركة من الست تُستخدم فعلياً بعائق مخصص لها بدل تكرار JUMP.
- Time Challenge Mode = "مرحلة 999: مغامرة مستمرة" بدل شاشة مؤقّت 60 ثانية منفصلة.
- Character `explorer` يستخدم شخصية squareYellow بدل handYellow (اكتشفنا أن ملفات "hand" بالحزمة رسمة بيضاوية صغيرة غير مناسبة كشخصية، وليست يداً كما ظنّ الاسم).

## قواعد ثابتة أثناء البناء
- Vision Loop (VisionController، rAF خاص بها) منفصلة تماماً عن Game Loop (GameLoop.ts يُستدعى من GameScene.update)
- الطفل لا يرى أي مصطلح تقني (Pose/AI/Confidence) إلا بـ Debug Mode المخفي (زر F1 بالكيبورد، للمطوّر/الوالد فقط)
- لا رفع فيديو لأي سيرفر — كل شي محلي، حتى نموذج MediaPipe نفسه محفوظ محلياً بـ public/mediapipe (38MB) بدل الاعتماد على CDN

## قيد بيئي اكتُشف أثناء الاختبار (ليس بالمنتج، فقط ببيئة اختبار Claude الآلية)
أدوات أتمتة كروم بهذه البيئة لا تعطي نافذة Chrome رؤية حقيقية (`document.hidden=true` دائماً)، مما يوقف Tweens/rAF الخاصة بـ Phaser أثناء اختبار النقر الآلي. لن يواجه محمد هذا إطلاقاً بمتصفح عادي. لذلك اعتمد Claude على Vitest (56 اختبار حقيقي بدون متصفح) + فحوصات متصفح محدودة (تحميل صفحات، تحميل نموذج MediaPipe فعلياً بنجاح) بدل النقر الكامل عبر كل الشاشات.

## كيف تشغّل المشروع
```
cd "/Users/mac/Desktop/أردوينو/المشاريع والكتب/qafzat-alabtal"
npm install
npm run dev
```
وللاختبارات: `npm test`

## سجل التقدّم
- 2026-08-24: إنشاء PLAN.md وCLAUDE.md (تخطيط).
- 2026-08-24: بناء كامل لكل المراحل الـ11 (Boot→Vision→6 حركات→لعب كامل→تدريب→تخصيص→Power-ups→Boss→Multiplayer→حفظ→تلميع)، تنزيل أصول Kenney (CC0)، MediaPipe محلي بالكامل، 56 اختبار Vitest، تلميع "Juicy" (Squash&Stretch، Particles، عبارات تشجيع متنوعة، انتقالات Fade بين الشاشات)، تنظيم git بـ6 commits منطقية. الخطوة المتبقية الوحيدة: تجربة محمد الفعلية بالكاميرا.
