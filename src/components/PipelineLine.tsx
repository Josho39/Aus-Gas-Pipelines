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
   * spotlighted operator, fades it back without hiding it outright. */
  dimmed?: boolean;
  /** Line-width step, driven by GeoMap's zoom thresholds (see NodeMarker's
   * `tier` for why): 0 = full width, each step progressively thinner.
   * Without this, a fixed stroke width gets visually thicker as the map
   * scales up under zoom, turning a dense cluster of lines into a solid
   * smear. */
  tier?: 0 | 1 | 2 | 3;
}

const WIDTH_SCALE_BY_TIER = [1, 0.7, 0.45, 0.3] as const;

export function PipelineLine({ pipeline, points, onClick, isSelected, dimmed = false, tier = 0 }: PipelineLineProps) {
  const color = PIPELINE_COLORS[pipeline.style.color];
  const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const dashed = Boolean(pipeline.style.dashed);
  const widthScale = WIDTH_SCALE_BY_TIER[tier];
  const baseWidth = (isSelected ? 6 : dashed ? 2.5 : 4.5) * widthScale;
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
        strokeDasharray={dashed ? `${8 * widthScale} ${6 * widthScale}` : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={!dashed && !dimmed ? { filter: `drop-shadow(0 0 3px ${color}99)` } : undefined}
      />
    </g>
  );
}
