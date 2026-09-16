import { describe, it, expect } from "vitest";
import { projectGeo, AUSTRALIA_BOUNDS } from "./geoProject";

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
