import { describe, it, expect, beforeEach, vi } from "vitest";
import { MotionRecognition } from "../src/vision/MotionRecognition";
import { eventBus, GameEvents } from "../src/core/EventBus";
import { PoseLandmarkIndex, type BodyLandmark, type PlayerBaseline } from "../src/core/Types";

function makeLandmarks(overrides: Partial<Record<number, Partial<BodyLandmark>>>): BodyLandmark[] {
  const arr: BodyLandmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  for (const [idx, val] of Object.entries(overrides)) {
    arr[Number(idx)] = { ...arr[Number(idx)], ...val };
  }
  return arr;
}

const baseline: PlayerBaseline = {
  hipY: 0.6,
  shoulderY: 0.4,
  hipX: 0.5,
  shoulderWidth: 0.2,
  bboxHeight: 0.3,
  capturedAt: 0,
};

function neutralLandmarks(): BodyLandmark[] {
  return makeLandmarks({
    [PoseLandmarkIndex.LEFT_HIP]: { x: 0.45, y: 0.6 },
    [PoseLandmarkIndex.RIGHT_HIP]: { x: 0.55, y: 0.6 },
    [PoseLandmarkIndex.LEFT_SHOULDER]: { x: 0.4, y: 0.4 },
    [PoseLandmarkIndex.RIGHT_SHOULDER]: { x: 0.6, y: 0.4 },
    [PoseLandmarkIndex.LEFT_ANKLE]: { x: 0.45, y: 0.9 },
    [PoseLandmarkIndex.RIGHT_ANKLE]: { x: 0.55, y: 0.9 },
    [PoseLandmarkIndex.LEFT_WRIST]: { x: 0.35, y: 0.5 },
    [PoseLandmarkIndex.RIGHT_WRIST]: { x: 0.65, y: 0.5 },
  });
}

describe("MotionRecognition — القفز (بند 45: يجب أن يكون اكتشافاً حقيقياً وليس عشوائياً)", () => {
  let mr: MotionRecognition;

  beforeEach(() => {
    mr = new MotionRecognition();
  });

  it("لا يصدر VISION_JUMP طالما اللاعب بوضعه الطبيعي", () => {
    const spy = vi.fn();
    const off = eventBus.on(GameEvents.VISION_JUMP, spy);
    for (let t = 0; t < 5; t++) {
      mr.process(0, neutralLandmarks(), baseline, t * 100);
    }
    off();
    expect(spy).not.toHaveBeenCalled();
  });

  it("يصدر VISION_JUMP فقط عندما يرتفع الورك فعلياً فوق العتبة", () => {
    const spy = vi.fn();
    const off = eventBus.on(GameEvents.VISION_JUMP, spy);

    const jumpFrame = makeLandmarks({
      [PoseLandmarkIndex.LEFT_HIP]: { x: 0.45, y: 0.55 }, // ارتفع 0.05 -> إشارة 0.05/0.3=0.166 > العتبة 0.09
      [PoseLandmarkIndex.RIGHT_HIP]: { x: 0.55, y: 0.55 },
      [PoseLandmarkIndex.LEFT_SHOULDER]: { x: 0.4, y: 0.4 },
      [PoseLandmarkIndex.RIGHT_SHOULDER]: { x: 0.6, y: 0.4 },
    });

    mr.process(0, neutralLandmarks(), baseline, 0);
    mr.process(0, jumpFrame, baseline, 100);

    off();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({ playerIndex: 0, motion: "JUMP" });
  });

  it("لا يكرر الحدث للقفزة نفسها طالما اللاعب لم يرجع تحت عتبة الخروج", () => {
    const spy = vi.fn();
    const off = eventBus.on(GameEvents.VISION_JUMP, spy);
    const jumpFrame = makeLandmarks({
      [PoseLandmarkIndex.LEFT_HIP]: { x: 0.45, y: 0.55 },
      [PoseLandmarkIndex.RIGHT_HIP]: { x: 0.55, y: 0.55 },
      [PoseLandmarkIndex.LEFT_SHOULDER]: { x: 0.4, y: 0.4 },
      [PoseLandmarkIndex.RIGHT_SHOULDER]: { x: 0.6, y: 0.4 },
    });
    mr.process(0, jumpFrame, baseline, 0);
    mr.process(0, jumpFrame, baseline, 50);
    mr.process(0, jumpFrame, baseline, 100);
    off();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("يفصل بين لاعبين مختلفين بشكل مستقل", () => {
    const spy = vi.fn();
    const off = eventBus.on(GameEvents.VISION_JUMP, spy);
    const jumpFrame = makeLandmarks({
      [PoseLandmarkIndex.LEFT_HIP]: { x: 0.45, y: 0.55 },
      [PoseLandmarkIndex.RIGHT_HIP]: { x: 0.55, y: 0.55 },
      [PoseLandmarkIndex.LEFT_SHOULDER]: { x: 0.4, y: 0.4 },
      [PoseLandmarkIndex.RIGHT_SHOULDER]: { x: 0.6, y: 0.4 },
    });
    mr.process(0, jumpFrame, baseline, 0);
    mr.process(1, jumpFrame, baseline, 0);
    off();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls.map((c) => c[0].playerIndex).sort()).toEqual([0, 1]);
  });

  it("يصدر VISION_RAISE_HAND عند رفع اليد فوق الكتف", () => {
    const spy = vi.fn();
    const off = eventBus.on(GameEvents.VISION_RAISE_HAND, spy);
    const raiseFrame = makeLandmarks({
      [PoseLandmarkIndex.LEFT_SHOULDER]: { x: 0.4, y: 0.4 },
      [PoseLandmarkIndex.RIGHT_SHOULDER]: { x: 0.6, y: 0.4 },
      [PoseLandmarkIndex.LEFT_WRIST]: { x: 0.35, y: 0.15 }, // فوق الكتف بمسافة كافية
      [PoseLandmarkIndex.RIGHT_WRIST]: { x: 0.65, y: 0.5 },
    });
    mr.process(0, neutralLandmarks(), baseline, 0);
    mr.process(0, raiseFrame, baseline, 100);
    off();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
