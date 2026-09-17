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
  /** true when an operator spotlight is active and this pipeline isn't the
   * spotlighted operator — fades it back without hiding it outright. */
  dimmed?: boolean;
}

export function PipelineLine({ pipeline, points, onClick, isSelected, dimmed = false }: PipelineLineProps) {
  const color = PIPELINE_COLORS[pipeline.style.color];
  const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const dashed = Boolean(pipeline.style.dashed);
  const baseWidth = isSelected ? 6 : dashed ? 2.5 : 4.5;
  const opacity = dimmed ? 0.15 : 1;

  return (
    <g style={{ cursor: "pointer" }} onClick={() => onClick(pipeline.id)} opacity={opacity}>
      {/* wide invisible hit area, easier to click than a 2-4px line */}
      <polyline
        points={pointsAttr}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        data-testid={`pipeline-${pipeline.id}`}
        points={pointsAttr}
        fill="none"
        stroke={color}
        strokeWidth={baseWidth}
        strokeDasharray={dashed ? "8 6" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={!dashed && !dimmed ? { filter: `drop-shadow(0 0 3px ${color}99)` } : undefined}
      />
    </g>
  );
}
