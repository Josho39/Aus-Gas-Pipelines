import { describe, it, expect } from "vitest";
import { projectGeo, computeGeoBounds, AUSTRALIA_BOUNDS } from "./geoProject";

describe("projectGeo", () => {
  it("maps the north-west corner of the bounds to (0,0)", () => {
    const p = projectGeo(AUSTRALIA_BOUNDS.maxLat, AUSTRALIA_BOUNDS.minLng, 1000, 800);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it("maps the south-east corner of the bounds to (width,height)", () => {
    const p = projectGeo(AUSTRALIA_BOUNDS.minLat, AUSTRALIA_BOUNDS.maxLng, 1000, 800);
    expect(p.x).toBeCloseTo(1000);
    expect(p.y).toBeCloseTo(800);
  });

  it("maps the centre of the bounds to the centre of the canvas", () => {
    const midLat = (AUSTRALIA_BOUNDS.minLat + AUSTRALIA_BOUNDS.maxLat) / 2;
    const midLng = (AUSTRALIA_BOUNDS.minLng + AUSTRALIA_BOUNDS.maxLng) / 2;
    const p = projectGeo(midLat, midLng, 1000, 800);
    expect(p.x).toBeCloseTo(500);
    expect(p.y).toBeCloseTo(400);
  });
});

describe("computeGeoBounds", () => {
  it("pads the min/max lat/lng of the given points", () => {
    const points = [
      { lat: -20, lng: 116 },
      { lat: -32, lng: 116 },
      { lat: -26, lng: 121 },
      { lat: -26, lng: 114 },
    ];
    const bounds = computeGeoBounds(points, 1.5);
    expect(bounds.minLat).toBeCloseTo(-33.5);
    expect(bounds.maxLat).toBeCloseTo(-18.5);
    expect(bounds.minLng).toBeCloseTo(112.5);
    expect(bounds.maxLng).toBeCloseTo(122.5);
  });

  it("projecting a region's own points against its own computed bounds spans close to the full width", () => {
    // A west-coast-like cluster of points that only spans a fraction of the
    // whole-continent longitude range.
    const points = [
      { lat: -20.7, lng: 116.8 },
      { lat: -31.95, lng: 115.86 },
      { lat: -33.85, lng: 121.9 },
    ];
    const bounds = computeGeoBounds(points);
    const xs = points.map((p) => projectGeo(p.lat, p.lng, 900, 1000, bounds).x);
    const spread = Math.max(...xs) - Math.min(...xs);
    // Against AUSTRALIA_BOUNDS this cluster would span roughly 18% of the
    // canvas; against its own bounds it should span the large majority of it.
    expect(spread).toBeGreaterThan(900 * 0.6);
  });
});
