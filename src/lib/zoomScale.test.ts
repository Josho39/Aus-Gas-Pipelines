import { describe, it, expect } from "vitest";
import {
  quantizeZoom,
  labelScale,
  lineScale,
  markerRadius,
  outlineScale,
  revealOpacity,
  DETAIL_SCALE,
} from "./zoomScale";

// GeoMap's TransformWrapper ceiling. The sizing curves have to still hold
// up at the far end of whatever range the map allows.
const MAX_ZOOM = 20;

describe("quantizeZoom", () => {
  it("returns the same value for an unchanged scale, so setState can bail out", () => {
    expect(quantizeZoom(2.731)).toBe(quantizeZoom(2.731));
  });

  it("rounds away sub-step jitter from a pan gesture", () => {
    expect(quantizeZoom(2.0001)).toBe(quantizeZoom(2));
  });

  it("still resolves a single wheel step (0.2) to a different value", () => {
    expect(quantizeZoom(1.2)).not.toBe(quantizeZoom(1));
  });
});

describe("labelScale / lineScale / markerRadius", () => {
  it("draws everything at its full, unreduced size at the default zoom", () => {
    expect(labelScale(1)).toBe(DETAIL_SCALE);
    expect(lineScale(1)).toBe(DETAIL_SCALE);
    expect(markerRadius(1)).toBeCloseTo(6.5 * DETAIL_SCALE);
  });

  it("does not inflate anything when zoomed out past the initial fit", () => {
    expect(labelScale(0.5)).toBe(DETAIL_SCALE);
    expect(lineScale(0.5)).toBe(DETAIL_SCALE);
    expect(markerRadius(0.6)).toBeCloseTo(6.5 * DETAIL_SCALE);
  });

  it("shrinks on every step in, with no flat stretch in between", () => {
    // The tiered version this replaced returned one constant across each
    // whole band (1.0-1.8, 1.8-3.2, ...), so these would have compared equal.
    for (const [a, b] of [[1, 1.2], [1.8, 2], [3.2, 3.4], [6, 6.2]]) {
      expect(labelScale(b)).toBeLessThan(labelScale(a));
      expect(lineScale(b)).toBeLessThan(lineScale(a));
    }
  });

  it("keeps pace with the map, so on-screen size never increases", () => {
    // size on screen = size in user units * zoom. Holding that flat (text)
    // or letting it fall (lines) is the whole point: nothing balloons as
    // you zoom in, which is what the old tiers did between thresholds.
    for (const zoom of [1.5, 2, 4, 8, MAX_ZOOM]) {
      expect(labelScale(zoom) * zoom).toBeLessThanOrEqual(labelScale(1));
      expect(lineScale(zoom) * zoom).toBeLessThanOrEqual(lineScale(1));
    }
  });

  it("still draws everything at a usable on-screen size at maximum zoom", () => {
    // In screen pixels: font size, stroke width, dot diameter. None of
    // these should have thinned away to something you'd squint at.
    expect(9.5 * labelScale(MAX_ZOOM) * MAX_ZOOM).toBeGreaterThan(9);
    expect(4.5 * lineScale(MAX_ZOOM) * MAX_ZOOM).toBeGreaterThan(2.5);
    expect(2 * markerRadius(MAX_ZOOM) * MAX_ZOOM).toBeGreaterThan(6);
  });

  it("keeps shrinking all the way to maximum zoom, never bottoming out", () => {
    // A floor that engaged inside the usable range would pin a size in user
    // units, which the zoom then multiplies: the thing would start growing
    // on screen again past that point.
    expect(labelScale(MAX_ZOOM) * MAX_ZOOM).toBeLessThanOrEqual(labelScale(8) * 8);
    expect(lineScale(MAX_ZOOM) * MAX_ZOOM).toBeLessThanOrEqual(lineScale(8) * 8);
    expect(markerRadius(MAX_ZOOM) * MAX_ZOOM).toBeLessThanOrEqual(markerRadius(8) * 8);
  });

  it("holds the coastline at a constant on-screen width", () => {
    for (const zoom of [2, 5, MAX_ZOOM]) {
      expect(outlineScale(zoom) * zoom).toBeCloseTo(1);
    }
  });
});

describe("revealOpacity", () => {
  it("hides detail below the threshold", () => {
    expect(revealOpacity(1, 1.8)).toBe(0);
    expect(revealOpacity(1.8, 1.8)).toBe(0);
  });

  it("fades in over the ramp rather than popping in at once", () => {
    expect(revealOpacity(1.9, 1.8)).toBeGreaterThan(0);
    expect(revealOpacity(1.9, 1.8)).toBeLessThan(1);
    expect(revealOpacity(2.1, 1.8)).toBeGreaterThan(revealOpacity(1.9, 1.8));
  });

  it("reaches full opacity past the ramp and stays there", () => {
    expect(revealOpacity(2.4, 1.8)).toBeCloseTo(1);
    expect(revealOpacity(9, 1.8)).toBe(1);
  });
});
