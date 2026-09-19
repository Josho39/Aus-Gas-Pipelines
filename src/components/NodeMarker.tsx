import { NODE_TYPE_COLORS } from "../lib/colors";
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
  const labelWidth = label.length * 5.1 * scale + 8 * scale;
  const labelHeight = 13.5 * scale;
  const radius = markerRadius(zoom);
  // Measured out from the dot's edge, not from its centre. A fixed offset
  // from the centre leaves less and less clear air as the label grows,
  // and the name ends up crowding the dot it belongs to.
  const gap = radius + 6 * scale;
  // One rule for the dot's outline rather than its own curve: a constant
  // fraction of the radius keeps the ring visible at every zoom without it
  // ever swallowing the fill, down to a floor where it would vanish.
  const markerStroke = Math.max(0.3, radius * 0.3);
  const boxStroke = Math.max(0.12, 0.75 * scale);

  const position = node.labelPosition ?? "right";
  let rectX: number;
  let rectY: number;
  let textX: number;
  let textAnchor: "start" | "end" | "middle" = "start";
  if (position === "left") {
    rectX = x - gap - labelWidth;
    rectY = y - labelHeight / 2;
    textX = x - gap - 4.5 * scale;
    textAnchor = "end";
  } else if (position === "top") {
    rectX = x - labelWidth / 2;
    rectY = y - gap - labelHeight;
    textX = x;
    textAnchor = "middle";
  } else if (position === "bottom") {
    rectX = x - labelWidth / 2;
    rectY = y + gap;
    textX = x;
    textAnchor = "middle";
  } else {
    rectX = x + gap;
    rectY = y - labelHeight / 2;
    textX = x + gap + 4.5 * scale;
  }
  const textY = position === "top" || position === "bottom" ? rectY + labelHeight / 2 + fontSize / 3 : y + fontSize / 3;

  return (
    <g onClick={() => onClick(node.id)} style={{ cursor: "pointer" }}>
      {isSelected && (
        <circle cx={x} cy={y} r={radius + 4 * scale} fill="none" stroke="#2dd4bf" strokeWidth={2 * scale} />
      )}
      {(showLabel || isSelected) && (
        <g opacity={isSelected ? 1 : labelOpacity}>
          <rect
            x={rectX}
            y={rectY}
            width={labelWidth}
            height={labelHeight}
            rx={3 * scale}
            style={{ fill: "var(--color-panel)", stroke: color }}
            strokeWidth={boxStroke}
            opacity={0.9}
          />
          <text
            x={textX}
            y={textY}
            fontSize={fontSize}
            fontWeight={500}
            textAnchor={textAnchor}
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
        fill={color}
        style={{ stroke: "var(--color-ink)" }}
        strokeWidth={markerStroke}
      />
    </g>
  );
}
