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
}

export function NodeMarker({ node, x, y, onClick, isSelected, showLabel = true }: NodeMarkerProps) {
  const color = NODE_TYPE_COLORS[node.type];
  const label = node.shortLabel ?? node.name;
  const labelWidth = label.length * 5.8 + 10;

  return (
    <g onClick={() => onClick(node.id)} style={{ cursor: "pointer" }}>
      {(showLabel || isSelected) && (
        <>
          <rect
            x={x + 11}
            y={y - 9}
            width={labelWidth}
            height={16}
            rx={3}
            style={{ fill: "var(--color-panel)" }}
            opacity={0.85}
          />
          <text x={x + 16} y={y + 3.5} fontSize={10.5} fontWeight={500} style={{ fill: "var(--color-fg)" }}>
            {label}
          </text>
        </>
      )}
      <circle
        data-testid={`node-${node.id}`}
        cx={x}
        cy={y}
        r={isSelected ? 9 : 6.5}
        fill={color}
        style={{ stroke: "var(--color-ink)" }}
        strokeWidth={2}
      />
    </g>
  );
}
