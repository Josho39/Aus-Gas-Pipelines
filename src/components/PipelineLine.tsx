import { PIPELINE_COLORS } from "../lib/colors";
import { lineScale } from "../lib/zoomScale";
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
  /** Extra opacity multiplier, so a line being revealed by zoom can fade in
   * instead of appearing all at once. */
  fade?: number;
  /** Current map zoom. A fixed stroke width gets visually thicker as the
   * map scales up under zoom, turning a dense cluster of lines into a solid
   * smear; the width shrinks continuously to counter that. See
   * ../lib/zoomScale. */
  zoom?: number;
}

export function PipelineLine({
  pipeline,
  points,
  onClick,
  isSelected,
  dimmed = false,
  fade = 1,
  zoom = 1,
}: PipelineLineProps) {
  const color = PIPELINE_COLORS[pipeline.style.color];
  const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const dashed = Boolean(pipeline.style.dashed);
  const widthScale = lineScale(zoom);
  const baseWidth = (isSelected ? 6 : dashed ? 2.5 : 4.5) * widthScale;
  const opacity = (dimmed ? 0.15 : 1) * fade;

  return (
    <g style={{ cursor: "pointer" }} onClick={() => onClick(pipeline.id)} opacity={opacity}>
      {/* wide invisible hit area, easier to click than a 2-4px line. Scales
          with the zoom like everything else: left fixed, at high zoom these
          grow into overlapping slabs and clicking one line of a dense
          cluster picks whichever neighbour happens to be drawn last. */}
      <polyline
        points={pointsAttr}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(2.5, 18 * widthScale)}
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
