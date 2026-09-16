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
