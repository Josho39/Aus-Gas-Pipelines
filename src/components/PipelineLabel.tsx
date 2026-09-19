import { PIPELINE_COLORS } from "../lib/colors";
import { computeLabelPosition, labelSide } from "../lib/lineLabel";
import { labelScale } from "../lib/zoomScale";
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
  /** Extra opacity multiplier, so a label being revealed by zoom can fade
   * in instead of appearing all at once. */
  fade?: number;
  /** Current map zoom; the label shrinks continuously to hold its
   * on-screen size as the map scales up. See ../lib/zoomScale. */
  zoom?: number;
}

export function PipelineLabel({
  pipeline,
  points,
  onClick,
  dimmed = false,
  fade = 1,
  zoom = 1,
}: PipelineLabelProps) {
  const color = PIPELINE_COLORS[pipeline.style.color];
  const scale = labelScale(zoom);
  // Which way "22 units perpendicular" actually points depends on which way
  // the line runs, so an above/below override can't just pick a sign: place
  // the label, see which side it landed on, and mirror it if it went the
  // wrong way.
  const offset = 22 * scale * labelSide(pipeline.id);
  let placement = computeLabelPosition(points, offset);
  if (pipeline.labelSide && placement.y > placement.anchor.y !== (pipeline.labelSide === "below")) {
    placement = computeLabelPosition(points, -offset);
  }
  const { x, y, anchor } = placement;
  const fontSize = 9.5 * scale;
  const labelWidth = pipeline.code.length * 5.6 * scale + 9 * scale;
  const labelHeight = 13 * scale;

  return (
    <g
      data-testid={`pipeline-label-${pipeline.id}`}
      onClick={() => onClick(pipeline.id)}
      style={{ cursor: "pointer" }}
      opacity={(dimmed ? 0.15 : 1) * fade}
    >
      {/* Leader line back to the pipeline itself, so an offset label still
       * reads as attached to its own line rather than a neighbour's. It
       * scales with the label it belongs to; at a fixed width it ends up
       * heavier than the pipeline it points at once you zoom in. */}
      <line
        x1={anchor.x}
        y1={anchor.y}
        x2={x}
        y2={y}
        stroke={color}
        strokeWidth={Math.max(0.15, scale)}
        opacity={0.6}
      />
      <circle cx={anchor.x} cy={anchor.y} r={Math.max(0.3, 2 * scale)} fill={color} />
      <rect
        x={x - labelWidth / 2}
        y={y - labelHeight / 2}
        width={labelWidth}
        height={labelHeight}
        rx={3 * scale}
        style={{ fill: "var(--color-panel)", stroke: color }}
        strokeWidth={Math.max(0.12, 0.75 * scale)}
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
