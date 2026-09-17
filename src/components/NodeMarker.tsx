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
  /** Label size step, driven by GeoMap's zoom thresholds: 0 = full size,
   * 1 = half size, 2 = quarter size. The map itself keeps scaling up as the
   * viewer zooms, so a fixed label size would balloon into an unreadable,
   * overlapping mess; each tier keeps text legible without ever letting it
   * dominate the view. The marker dot only shrinks once, at tier 1. */
  tier?: 0 | 1 | 2;
}

export function NodeMarker({ node, x, y, onClick, isSelected, showLabel = true, tier = 0 }: NodeMarkerProps) {
  const color = NODE_TYPE_COLORS[node.type];
  const label = node.shortLabel ?? node.name;
  const scale = tier === 2 ? 0.25 : tier === 1 ? 0.5 : 1;
  const compact = tier >= 1;
  const fontSize = 9.5 * scale;
  const labelWidth = label.length * 5.1 * scale + 8 * scale;
  const labelHeight = 13.5 * scale;
  const labelOffsetX = 10 * scale;
  const radius = compact ? 3.5 : 6.5;

  return (
    <g onClick={() => onClick(node.id)} style={{ cursor: "pointer" }}>
      {isSelected && (
        <circle cx={x} cy={y} r={radius + 4} fill="none" stroke="#2dd4bf" strokeWidth={2} />
      )}
      {(showLabel || isSelected) && (
        <>
          <rect
            x={x + labelOffsetX}
            y={y - labelHeight / 2}
            width={labelWidth}
            height={labelHeight}
            rx={3 * scale}
            style={{ fill: "var(--color-panel)" }}
            opacity={0.85}
          />
          <text
            x={x + labelOffsetX + 4.5 * scale}
            y={y + fontSize / 3}
            fontSize={fontSize}
            fontWeight={500}
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
        strokeWidth={compact ? 1.25 : 2}
      />
    </g>
  );
}
