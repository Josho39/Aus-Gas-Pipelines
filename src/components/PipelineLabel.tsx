import { PIPELINE_COLORS } from "../lib/colors";
import { computeLabelPosition } from "../lib/lineLabel";
import type { Pipeline } from "../types";

interface Point {
  x: number;
  y: number;
}

interface PipelineLabelProps {
  pipeline: Pipeline;
  points: Point[];
  onClick: (id: string) => void;
  dimmed?: boolean;
}

export function PipelineLabel({ pipeline, points, onClick, dimmed = false }: PipelineLabelProps) {
  const color = PIPELINE_COLORS[pipeline.style.color];
  const { x, y, anchor } = computeLabelPosition(points, 26);
  const labelWidth = pipeline.code.length * 6.2 + 12;

  return (
    <g
      data-testid={`pipeline-label-${pipeline.id}`}
      onClick={() => onClick(pipeline.id)}
      style={{ cursor: "pointer" }}
      opacity={dimmed ? 0.15 : 1}
    >
      {/* Leader line back to the pipeline itself, so an offset label still
       * reads as attached to its own line rather than a neighbour's. */}
      <line x1={anchor.x} y1={anchor.y} x2={x} y2={y} stroke={color} strokeWidth={1} opacity={0.6} />
      <circle cx={anchor.x} cy={anchor.y} r={2} fill={color} />
      <rect
        x={x - labelWidth / 2}
        y={y - 8}
        width={labelWidth}
        height={15}
        rx={3}
        fill="#0b1220"
        stroke={color}
        strokeWidth={0.75}
        opacity={0.92}
      />
      <text x={x} y={y + 3.5} fontSize={10.5} fontWeight={600} fill="#f1f5f9" textAnchor="middle">
        {pipeline.code}
      </text>
    </g>
  );
}
