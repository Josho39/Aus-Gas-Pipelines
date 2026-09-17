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
  /** True once the viewer has zoomed in far enough to reveal every label at
   * once (see GeoMap's LABEL_ZOOM_THRESHOLD), at that density, full-size
   * labels and markers are too bulky, so shrink them. */
  compact?: boolean;
}

export function NodeMarker({ node, x, y, onClick, isSelected, showLabel = true, compact = false }: NodeMarkerProps) {
  const color = NODE_TYPE_COLORS[node.type];
  const label = node.shortLabel ?? node.name;
  const fontSize = compact ? 4.75 : 9.5;
  const labelWidth = label.length * (compact ? 2.55 : 5.1) + (compact ? 4 : 8);
  const labelHeight = compact ? 6.75 : 13.5;
  const labelOffsetX = compact ? 5 : 10;
  const radius = isSelected ? (compact ? 6 : 9) : compact ? 3.5 : 6.5;

  return (
    <g onClick={() => onClick(node.id)} style={{ cursor: "pointer" }}>
      {(showLabel || isSelected) && (
        <>
          <rect
            x={x + labelOffsetX}
            y={y - labelHeight / 2}
            width={labelWidth}
            height={labelHeight}
            rx={compact ? 1.5 : 3}
            style={{ fill: "var(--color-panel)" }}
            opacity={0.85}
          />
          <text
            x={x + labelOffsetX + (compact ? 2.25 : 4.5)}
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
