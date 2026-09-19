import { NODE_TYPE_COLORS, NODE_TYPE_SIZE, HOLLOW_NODE_TYPES } from "../lib/colors";
import { labelScale, markerRadius } from "../lib/zoomScale";
import type { PipelineNode } from "../types";

interface NodeMarkerProps {
  node: PipelineNode;
  x: number;
  y: number;
  onClick: (id: string) => void;
  isSelected: boolean;
  /** Show the name label. Callers hide labels for minor facility types at
   * low zoom levels so dense clusters stay legible, revealing them as the
   * viewer zooms in (or always for major hubs, or when selected). */
  showLabel?: boolean;
  /** Opacity for the name label alone (not the dot), so a label being
   * revealed by zoom can fade in instead of appearing all at once. */
  labelOpacity?: number;
  /** Current map zoom. The map keeps scaling up as the viewer zooms, so a
   * fixed size would balloon into an unreadable, overlapping mess; the dot
   * and its label shrink continuously to hold their on-screen size instead.
   * See ../lib/zoomScale. */
  zoom?: number;
}

export function NodeMarker({
  node,
  x,
  y,
  onClick,
  isSelected,
  showLabel = true,
  labelOpacity = 1,
  zoom = 1,
}: NodeMarkerProps) {
  const color = NODE_TYPE_COLORS[node.type];
  const label = node.shortLabel ?? node.name;
  const scale = labelScale(zoom);
  const fontSize = 9.5 * scale;
  const labelHeight = 13.5 * scale;
  const radius = markerRadius(zoom) * NODE_TYPE_SIZE[node.type];
  const hollow = HOLLOW_NODE_TYPES.has(node.type);
  // Measured out from the dot's edge, not from its centre. A fixed offset
  // from the centre leaves less and less clear air as the label grows,
  // and the name ends up crowding the dot it belongs to.
  const gap = radius + 6 * scale;
  // One rule for the dot's outline rather than its own curve: a constant
  // fraction of the radius keeps the ring visible at every zoom without it
  // ever swallowing the fill, down to a floor where it would vanish.
  const markerStroke = Math.max(0.3, radius * 0.3);
  // Halo behind the text instead of a box behind it. AEMO writes names
  // straight onto the map, and a box per label turns a junction into a wall
  // of rectangles; a background-coloured outline keeps the text readable
  // where it crosses a pipeline without adding another shape to look at.
  const halo = 2.6 * scale;

  const position = node.labelPosition ?? "right";
  const diagonal = position.length > 6;
  // A diagonal offset splits the gap between the two axes so the label sits
  // the same distance from the dot as a square one would.
  const step = diagonal ? gap / Math.SQRT2 : gap;
  const up = position.startsWith("top");
  const down = position.startsWith("bottom");
  const left = position.endsWith("left");
  const right = position.endsWith("right");

  let textX: number;
  let textAnchor: "start" | "end" | "middle" = "start";
  if (left) {
    textX = x - step;
    textAnchor = "end";
  } else if (right) {
    textX = x + step;
  } else {
    textX = x;
    textAnchor = "middle";
  }
  // Vertical placement is worked out as though the name still sat in a box,
  // so a label above or below the dot clears it by the same gap a label
  // beside it does.
  let boxTop: number;
  if (up) {
    boxTop = diagonal ? y - step - labelHeight / 2 : y - gap - labelHeight;
  } else if (down) {
    boxTop = diagonal ? y + step - labelHeight / 2 : y + gap;
  } else {
    boxTop = y - labelHeight / 2;
  }

  const textY = boxTop + labelHeight / 2 + fontSize / 3;

  return (
    <g onClick={() => onClick(node.id)} style={{ cursor: "pointer" }}>
      {isSelected && (
        <circle cx={x} cy={y} r={radius + 4 * scale} fill="none" stroke="#2dd4bf" strokeWidth={2 * scale} />
      )}
      {(showLabel || isSelected) && (
        <g opacity={isSelected ? 1 : labelOpacity}>
          <text
            x={textX}
            y={textY}
            fontSize={fontSize}
            fontWeight={600}
            textAnchor={textAnchor}
            paintOrder="stroke"
            stroke="var(--color-ink)"
            strokeWidth={halo}
            strokeLinejoin="round"
            style={{ fill: "var(--color-fg)" }}
          >
            {label}
          </text>
        </g>
      )}
      <circle
        data-testid={`node-${node.id}`}
        cx={x}
        cy={y}
        r={radius}
        fill={hollow ? "var(--color-ink)" : color}
        stroke={hollow ? color : undefined}
        style={hollow ? undefined : { stroke: "var(--color-ink)" }}
        strokeWidth={markerStroke}
      />
    </g>
  );
}
