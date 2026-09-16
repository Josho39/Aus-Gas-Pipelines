import { PIPELINE_COLORS } from "../lib/colors";
import type { Pipeline } from "../types";

interface Point {
  x: number;
  y: number;
}

interface PipelineLineProps {
  pipeline: Pipeline;
  points: Point[];
  onClick: (id: string) => void;
  isSelected: boolean;
}

export function PipelineLine({ pipeline, points, onClick, isSelected }: PipelineLineProps) {
  const color = PIPELINE_COLORS[pipeline.style.color];
  const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <polyline
      data-testid={`pipeline-${pipeline.id}`}
      points={pointsAttr}
      fill="none"
      stroke={color}
      strokeWidth={isSelected ? 5 : 3}
      strokeDasharray={pipeline.style.dashed ? "8 6" : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={pipeline.style.dashed ? undefined : "pipeline-flow"}
      style={{ cursor: "pointer" }}
      onClick={() => onClick(pipeline.id)}
    />
  );
}
