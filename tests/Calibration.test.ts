import { describe, it, expect } from "vitest";
import { CalibrationSession } from "../src/vision/Calibration";
import { PoseLandmarkIndex, type BodyLandmark } from "../src/core/Types";

function frame(hipY: number, shoulderY: number): BodyLandmark[] {
  const arr: BodyLandmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  arr[PoseLandmarkIndex.LEFT_HIP] = { x: 0.45, y: hipY, z: 0, visibility: 1 };
  arr[PoseLandmarkIndex.RIGHT_HIP] = { x: 0.55, y: hipY, z: 0, visibility: 1 };
  arr[PoseLandmarkIndex.LEFT_SHOULDER] = { x: 0.4, y: shoulderY, z: 0, visibility: 1 };
  arr[PoseLandmarkIndex.RIGHT_SHOULDER] = { x: 0.6, y: shoulderY, z: 0, visibility: 1 };
  arr[PoseLandmarkIndex.LEFT_ANKLE] = { x: 0.45, y: 0.9, z: 0, visibility: 1 };
  arr[PoseLandmarkIndex.RIGHT_ANKLE] = { x: 0.55, y: 0.9, z: 0, visibility: 1 };
  return arr;
}

describe("CalibrationSession — بند 6: جمع خط أساس حقيقي قبل اللعب", () => {
  it("لا تكتمل قبل جمع عدد كافٍ من الإطارات المستقرة", () => {
    const session = new CalibrationSession();
    for (let i = 0; i < 10; i++) {
      const result = session.addFrame(frame(0.6, 0.4));
      expect(result).toBeNull();
    }
    expect(session.isComplete).toBe(false);
    expect(session.progress).toBeLessThan(1);
  });

  it("تكتمل بعد 30 إطاراً وترجع متوسط القيم", () => {
    const session = new CalibrationSession();
    let result = null;
    for (let i = 0; i < 30; i++) {
      result = session.addFrame(frame(0.6, 0.4));
    }
    expect(session.isComplete).toBe(true);
    expect(result).not.toBeNull();
    expect(result!.hipY).toBeCloseTo(0.6, 5);
    expect(result!.shoulderY).toBeCloseTo(0.4, 5);
  });

  it("reset يمسح التقدّم ويسمح بمعايرة جديدة", () => {
    const session = new CalibrationSession();
    for (let i = 0; i < 30; i++) session.addFrame(frame(0.6, 0.4));
    expect(session.isComplete).toBe(true);
    session.reset();
    expect(session.isComplete).toBe(false);
    expect(session.progress).toBe(0);
  });

  it("إطار بلا نقاط ورك واضحة لا يُحتسب (يرجع null ولا يزيد التقدّم)", () => {
    const session = new CalibrationSession();
    const incomplete: BodyLandmark[] = [];
    const result = session.addFrame(incomplete);
    expect(result).toBeNull();
    expect(session.progress).toBe(0);
  });
});
