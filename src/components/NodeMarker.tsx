import { NODE_TYPE_COLORS } from "../lib/colors";
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
  /** Label/marker size step, driven by GeoMap's zoom thresholds: 0 = full
   * size, each step roughly halves it again. The map itself keeps scaling
   * up as the viewer zooms, so a fixed size would balloon into an
   * unreadable, overlapping mess; each tier keeps everything legible
   * without ever letting it dominate the view. */
  tier?: 0 | 1 | 2 | 3;
}

const SCALE_BY_TIER = [1, 0.5, 0.25, 0.12] as const;
const RADIUS_BY_TIER = [6.5, 4, 2.75, 1.8] as const;
const NODE_STROKE_BY_TIER = [2, 1.25, 0.9, 0.6] as const;

export function NodeMarker({ node, x, y, onClick, isSelected, showLabel = true, tier = 0 }: NodeMarkerProps) {
  const color = NODE_TYPE_COLORS[node.type];
  const label = node.shortLabel ?? node.name;
  const scale = SCALE_BY_TIER[tier];
  const fontSize = 9.5 * scale;
  const labelWidth = label.length * 5.1 * scale + 8 * scale;
  const labelHeight = 13.5 * scale;
  const gap = 10 * scale;
  const radius = RADIUS_BY_TIER[tier];

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
        <>
          <rect
            x={rectX}
            y={rectY}
            width={labelWidth}
            height={labelHeight}
            rx={3 * scale}
            style={{ fill: "var(--color-panel)", stroke: color }}
            strokeWidth={0.75}
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
        </>
      )}
      <circle
        data-testid={`node-${node.id}`}
        cx={x}
        cy={y}
        r={radius}
        fill={color}
        style={{ stroke: "var(--color-ink)" }}
        strokeWidth={NODE_STROKE_BY_TIER[tier]}
      />
    </g>
  );
}
