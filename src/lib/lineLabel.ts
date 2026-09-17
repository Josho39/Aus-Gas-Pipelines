interface Point {
  x: number;
  y: number;
}

export interface LabelPlacement extends Point {
  /** Tangent angle of the line at the label point, in degrees. */
  angle: number;
  /** The point on the line itself the label is anchored to — draw a leader
   * line from here to {x, y} so the offset label still reads as attached
   * to its own pipeline. */
  anchor: Point;
}

/**
 * Finds the point at the midpoint (by arc length, not just by index) of a
 * polyline, offset perpendicular to the line's local direction there. This
 * keeps a label near its own line without sitting directly on top of it —
 * and, since it's offset to one side rather than centred on the stroke,
 * it's far less likely to land on top of a *different* pipeline's line
 * than a naive "put it at the midpoint" placement would be.
 */
/**
 * Deterministic left/right side for a pipeline's label offset, derived from
 * its id. Every label used to offset to the same side of its line — fine in
 * isolation, but at a junction where several pipelines converge (e.g. MSF,
 * where DBP/MWP/PGP all meet, or Wallumbilla/RBP on the east coast) they'd
 * all land on the same side and pile on top of each other and the node's
 * own label. Alternating sides by id spreads them out instead.
 */
export function labelSide(id: string): 1 | -1 {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) | 0;
  return hash % 2 === 0 ? 1 : -1;
}

export function computeLabelPosition(points: Point[], offset = 14): LabelPlacement {
  if (points.length === 0) return { x: 0, y: 0, angle: 0, anchor: { x: 0, y: 0 } };
  if (points.length === 1) {
    return { x: points[0].x, y: points[0].y, angle: 0, anchor: { ...points[0] } };
  }

  const segmentLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.hypot(dx, dy);
    segmentLengths.push(len);
    total += len;
  }

  const halfway = total / 2;
  let travelled = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    const isLastSegment = i === segmentLengths.length - 1;
    if (travelled + segLen >= halfway || isLastSegment) {
      const start = points[i];
      const end = points[i + 1];
      const t = segLen === 0 ? 0 : Math.min(1, (halfway - travelled) / segLen);
      const midX = start.x + (end.x - start.x) * t;
      const midY = start.y + (end.y - start.y) * t;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.hypot(dx, dy) || 1;
      // Perpendicular unit vector (rotate the tangent 90°).
      const perpX = -dy / len;
      const perpY = dx / len;

      return {
        x: midX + perpX * offset,
        y: midY + perpY * offset,
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
        anchor: { x: midX, y: midY },
      };
    }
    travelled += segLen;
  }

  return { x: points[0].x, y: points[0].y, angle: 0, anchor: { ...points[0] } };
}
