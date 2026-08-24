import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../src/core/EventBus";

describe("EventBus", () => {
  it("يستدعي المستمع عند إصدار حدث", () => {
    const bus = new EventBus();
    const listener = vi.fn();
    bus.on("X", listener);
    bus.emit("X", { a: 1 });
    expect(listener).toHaveBeenCalledWith({ a: 1 });
  });

  it("لا يستدعي المستمع بعد إلغاء الاشتراك", () => {
    const bus = new EventBus();
    const listener = vi.fn();
    const off = bus.on("X", listener);
    off();
    bus.emit("X");
    expect(listener).not.toHaveBeenCalled();
  });

  it("once يستدعى مرة واحدة فقط", () => {
    const bus = new EventBus();
    const listener = vi.fn();
    bus.once("X", listener);
    bus.emit("X");
    bus.emit("X");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("لا يكسر الحلقة لو ألغى مستمع اشتراكه أثناء التنفيذ", () => {
    const bus = new EventBus();
    const second = vi.fn();
    const first = vi.fn(() => off());
    const off = bus.on("X", first);
    bus.on("X", second);
    bus.emit("X");
    expect(second).toHaveBeenCalledTimes(1);
  });
});
