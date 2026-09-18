import { PIPELINE_COLORS } from "../lib/colors";
import { computeLabelPosition, labelSide } from "../lib/lineLabel";
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
  /** Label size step, driven by GeoMap's zoom thresholds: 0 = full size,
   * each step roughly halves it again. See NodeMarker's `tier` for why. */
  tier?: 0 | 1 | 2 | 3;
}

const SCALE_BY_TIER = [1, 0.625, 0.3125, 0.15] as const;

export function PipelineLabel({ pipeline, points, onClick, dimmed = false, tier = 0 }: PipelineLabelProps) {
  const color = PIPELINE_COLORS[pipeline.style.color];
  const scale = SCALE_BY_TIER[tier];
  const { x, y, anchor } = computeLabelPosition(points, 22 * scale * labelSide(pipeline.id));
  const fontSize = 9.5 * scale;
  const labelWidth = pipeline.code.length * 5.6 * scale + 9 * scale;
  const labelHeight = 13 * scale;

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
        y={y - labelHeight / 2}
        width={labelWidth}
        height={labelHeight}
        rx={3 * scale}
        style={{ fill: "var(--color-panel)", stroke: color }}
        strokeWidth={0.75}
        opacity={0.95}
      />
      <text
        x={x}
        y={y + fontSize / 3}
        fontSize={fontSize}
        fontWeight={600}
        style={{ fill: "var(--color-fg)" }}
        textAnchor="middle"
      >
        {pipeline.code}
      </text>
    </g>
  );
}
