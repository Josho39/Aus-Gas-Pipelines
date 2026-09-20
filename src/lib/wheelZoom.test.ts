import { describe, it, expect } from "vitest";
import { scaleAfterWheel, wheelDelta, BUTTON_ZOOM_STEP } from "./wheelZoom";

const MIN = 0.35;
const MAX = 40;
const detent = (dir: number) => ({ deltaY: dir * 100, deltaMode: 0 });

describe("wheelDelta", () => {
  it("scales Firefox's line-mode deltas up to pixels", () => {
    expect(wheelDelta({ deltaY: 3, deltaMode: 1 })).toBeGreaterThan(wheelDelta({ deltaY: 3, deltaMode: 0 }));
  });

  it("clamps a flick so one event can't cross most of the range", () => {
    expect(wheelDelta({ deltaY: 2000, deltaMode: 0 })).toBe(wheelDelta({ deltaY: 500, deltaMode: 0 }));
  });

  it("keeps the direction of the scroll", () => {
    expect(wheelDelta({ deltaY: -100, deltaMode: 0 })).toBeLessThan(0);
  });
});

describe("scaleAfterWheel", () => {
  it("zooms by the same proportion wherever you already are", () => {
    // The additive zoom this replaced added a fixed amount, so a click was a
    // 20% jump at 1x and a 0.5% nudge at 40x.
    const low = scaleAfterWheel(1, detent(-1), MIN, MAX) / 1;
    const high = scaleAfterWheel(8, detent(-1), MIN, MAX) / 8;
    expect(low).toBeCloseTo(high, 6);
  });

  it("crosses the whole range in a sane number of clicks", () => {
    let scale = MIN;
    let clicks = 0;
    while (scale < MAX - 0.001 && clicks < 500) {
      scale = scaleAfterWheel(scale, detent(-1), MIN, MAX);
      clicks++;
    }
    expect(scale).toBe(MAX);
    expect(clicks).toBeLessThan(25);
  });

  it("stops at the floor and the ceiling", () => {
    expect(scaleAfterWheel(MIN, detent(1), MIN, MAX)).toBe(MIN);
    expect(scaleAfterWheel(MAX, detent(-1), MIN, MAX)).toBe(MAX);
  });

  it("comes back off the floor on the very next click in", () => {
    // The reported symptom of the old zoom: scroll out a lot, then scrolling
    // back in barely moved, so it read as stuck.
    expect(scaleAfterWheel(MIN, detent(-1), MIN, MAX)).toBeGreaterThan(MIN * 1.2);
  });

  it("gives the buttons a bigger step than the wheel", () => {
    expect(BUTTON_ZOOM_STEP).toBeGreaterThan(scaleAfterWheel(1, detent(-1), MIN, MAX));
  });
});
