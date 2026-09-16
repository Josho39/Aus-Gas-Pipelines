import { NODE_TYPE_COLORS } from "../lib/colors";
import type { PipelineNode } from "../types";

interface NodeMarkerProps {
  node: PipelineNode;
  x: number;
  y: number;
  onClick: (id: string) => void;
  isSelected: boolean;
}

export function NodeMarker({ node, x, y, onClick, isSelected }: NodeMarkerProps) {
  const color = NODE_TYPE_COLORS[node.type];

  return (
    <g onClick={() => onClick(node.id)} style={{ cursor: "pointer" }}>
      <circle
        data-testid={`node-${node.id}`}
        cx={x}
        cy={y}
        r={isSelected ? 9 : 6}
        fill={color}
        stroke="#0b1220"
        strokeWidth={2}
      />
      <text x={x + 10} y={y + 4} fontSize={11} fill="#e2e8f0">
        {node.name}
      </text>
    </g>
  );
}
