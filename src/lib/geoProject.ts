export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const AUSTRALIA_BOUNDS: GeoBounds = {
  minLat: -44,
  maxLat: -10,
  minLng: 112,
  maxLng: 154,
};

export function projectGeo(
  lat: number,
  lng: number,
  width: number,
  height: number,
  bounds: GeoBounds = AUSTRALIA_BOUNDS
): { x: number; y: number } {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height;
  return { x, y };
}

/**
 * Computes a padded bounding box from a set of lat/lng points, so a region's
 * nodes can be projected against their own extent rather than the whole
 * continent's (which squeezes any region that doesn't span the full
 * continent into a corner of the canvas).
 */
export function computeGeoBounds(
  points: { lat: number; lng: number }[],
  paddingDegrees = 1.5
): GeoBounds {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return {
    minLat: Math.min(...lats) - paddingDegrees,
    maxLat: Math.max(...lats) + paddingDegrees,
    minLng: Math.min(...lngs) - paddingDegrees,
    maxLng: Math.max(...lngs) + paddingDegrees,
  };
}
