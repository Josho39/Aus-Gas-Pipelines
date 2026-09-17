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
  /** True once the viewer has zoomed in far enough to reveal every label at
   * once (see GeoMap's LABEL_ZOOM_THRESHOLD) — at that density, full-size
   * labels are too bulky, so shrink them by half. */
  compact?: boolean;
}

export function PipelineLabel({ pipeline, points, onClick, dimmed = false, compact = false }: PipelineLabelProps) {
  const color = PIPELINE_COLORS[pipeline.style.color];
  const { x, y, anchor } = computeLabelPosition(points, (compact ? 11 : 22) * labelSide(pipeline.id));
  const fontSize = compact ? 4.75 : 9.5;
  const labelWidth = pipeline.code.length * (compact ? 2.8 : 5.6) + (compact ? 4.5 : 9);
  const labelHeight = compact ? 6.5 : 13;

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
        rx={compact ? 1.5 : 3}
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
