import { describe, it, expect } from "vitest";
import { GameStateMachine } from "../src/core/GameState";

describe("GameStateMachine", () => {
  it("يبدأ بحالة BOOT", () => {
    const gs = new GameStateMachine();
    expect(gs.state).toBe("BOOT");
  });

  it("يسمح بانتقال صحيح BOOT -> MENU", () => {
    const gs = new GameStateMachine();
    expect(gs.transitionTo("MENU")).toBe(true);
    expect(gs.state).toBe("MENU");
  });

  it("يرفض انتقال غير منطقي BOOT -> PLAYING", () => {
    const gs = new GameStateMachine();
    expect(gs.transitionTo("PLAYING")).toBe(false);
    expect(gs.state).toBe("BOOT");
  });

  it("force=true يتجاوز قواعد الانتقال", () => {
    const gs = new GameStateMachine();
    expect(gs.transitionTo("GAME_OVER", true)).toBe(true);
    expect(gs.state).toBe("GAME_OVER");
  });

  it("يتتبع الحالة السابقة", () => {
    const gs = new GameStateMachine();
    gs.transitionTo("MENU");
    gs.transitionTo("CHARACTER_SELECT");
    expect(gs.previousState).toBe("MENU");
  });
});
