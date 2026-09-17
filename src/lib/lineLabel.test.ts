import { describe, it, expect } from "vitest";
import { computeLabelPosition } from "./lineLabel";

describe("computeLabelPosition", () => {
  it("offsets perpendicular to a straight horizontal line at its midpoint", () => {
    const p = computeLabelPosition([{ x: 0, y: 0 }, { x: 100, y: 0 }], 10);
    expect(p.x).toBeCloseTo(50);
    // Perpendicular to a rightward-travelling line is straight up/down.
    expect(Math.abs(p.y)).toBeCloseTo(10);
    expect(p.angle).toBeCloseTo(0);
    // The anchor is the true point on the line, unoffset.
    expect(p.anchor).toEqual({ x: 50, y: 0 });
  });

  it("finds the true arc-length midpoint on a multi-segment route, not the middle index", () => {
    // One long segment then one short one, the arc-length midpoint should
    // land inside the long first segment, not at the shared vertex.
    const p = computeLabelPosition(
      [{ x: 0, y: 0 }, { x: 90, y: 0 }, { x: 100, y: 0 }],
      0
    );
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo(0);
  });

  it("stays offset from the line for a vertical segment", () => {
    const p = computeLabelPosition([{ x: 5, y: 0 }, { x: 5, y: 40 }], 8);
    expect(p.y).toBeCloseTo(20);
    expect(Math.abs(p.x - 5)).toBeCloseTo(8);
  });

  it("handles a single point without throwing", () => {
    const p = computeLabelPosition([{ x: 3, y: 4 }]);
    expect(p).toEqual({ x: 3, y: 4, angle: 0, anchor: { x: 3, y: 4 } });
  });

  it("handles an empty array without throwing", () => {
    const p = computeLabelPosition([]);
    expect(p).toEqual({ x: 0, y: 0, angle: 0, anchor: { x: 0, y: 0 } });
  });
});
