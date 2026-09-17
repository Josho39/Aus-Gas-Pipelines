import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { PipelineLine } from "./PipelineLine";
import { PipelineLabel } from "./PipelineLabel";
import { NodeMarker } from "./NodeMarker";
import { MapZoomControls } from "./MapZoomControls";
import { getConnectedNodes } from "../lib/selectors";
import { projectGeo, computeGeoBounds } from "../lib/geoProject";
import { AUSTRALIA_OUTLINE } from "../lib/australiaOutline";
import type { PipelineNode, Pipeline, Selection, NodeType } from "../types";

const WIDTH = 1400;
const HEIGHT = 1500;

// Hubs, trading markets and LNG plants stay labelled at any zoom level —
// they're the "main players." Everything else (fields, compressor
// stations, towns) only gets a label once the viewer has zoomed in past
// LABEL_ZOOM_THRESHOLD, so a zoomed-out view of a dense cluster doesn't
// turn into an unreadable pile of overlapping text.
const ALWAYS_LABELLED: ReadonlySet<NodeType> = new Set(["hub", "sttm", "lng"]);
const LABEL_ZOOM_THRESHOLD = 1.8;

interface GeoMapProps {
  nodes: PipelineNode[];
  pipelines: Pipeline[];
  selection: Selection;
  onSelectNode: (id: string) => void;
  onSelectPipeline: (id: string) => void;
  /** Operator name to spotlight (dims every other pipeline), or null/undefined
   * to show all pipelines at full opacity. */
  operatorFilter?: string | null;
}

export function GeoMap({
  nodes,
  pipelines,
  selection,
  onSelectNode,
  onSelectPipeline,
  operatorFilter = null,
}: GeoMapProps) {
  const [scale, setScale] = useState(1);

  // Project against this region's own extent — including real pipeline
  // route waypoints, not just facility positions, since a route can bow out
  // further than its endpoint nodes — so a region that only spans part of
  // Australia's lat/lng range still fills the canvas.
  const bounds = computeGeoBounds([
    ...nodes.map((n) => n.geoPos),
    ...pipelines.flatMap((p) => p.route ?? []),
  ]);

  const projected = new Map(
    nodes.map((n) => [n.id, projectGeo(n.geoPos.lat, n.geoPos.lng, WIDTH, HEIGHT, bounds)])
  );

  const coastlinePath =
    "M " +
    AUSTRALIA_OUTLINE.map(({ lat, lng }) => {
      const p = projectGeo(lat, lng, WIDTH, HEIGHT, bounds);
      return `${p.x} ${p.y}`;
    }).join(" L ") +
    " Z";

  // Real route geometry (from Geoscience Australia's pipeline dataset) when
  // we have it; otherwise fall back to straight segments through the
  // pipeline's named facility nodes. Computed once and shared by both the
  // line itself and its label, so the label always tracks its own line.
  const pipelinePoints = new Map(
    pipelines.map((pipeline) => [
      pipeline.id,
      pipeline.route
        ? pipeline.route.map((p) => projectGeo(p.lat, p.lng, WIDTH, HEIGHT, bounds))
        : getConnectedNodes(pipeline, nodes).map((n) => projected.get(n.id)!),
    ])
  );

  return (
    <TransformWrapper
      minScale={0.5}
      maxScale={12}
      initialScale={1}
      limitToBounds={false}
      wheel={{ step: 0.15 }}
      doubleClick={{ step: 0.7, animationTime: 200 }}
      panning={{ velocityDisabled: false }}
      onTransform={(_ref, state) => setScale(state.scale)}
    >
      <MapZoomControls />
      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: "100%", height: "100%" }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Geographic pipeline map"
        >
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#0e1830" stroke="#1c2a45" strokeDasharray="4 6" />
          <path d={coastlinePath} fill="#1c2a45" fillOpacity={0.35} stroke="#324566" strokeWidth={1.5} />
          {pipelines.map((pipeline) => (
            <PipelineLine
              key={pipeline.id}
              pipeline={pipeline}
              points={pipelinePoints.get(pipeline.id)!}
              onClick={onSelectPipeline}
              isSelected={selection?.kind === "pipeline" && selection.id === pipeline.id}
              dimmed={operatorFilter !== null && pipeline.operator !== operatorFilter}
            />
          ))}
          {nodes.map((node) => {
            const pos = projected.get(node.id)!;
            const isSelected = selection?.kind === "node" && selection.id === node.id;
            return (
              <NodeMarker
                key={node.id}
                node={node}
                x={pos.x}
                y={pos.y}
                onClick={onSelectNode}
                isSelected={isSelected}
                showLabel={ALWAYS_LABELLED.has(node.type) || scale >= LABEL_ZOOM_THRESHOLD}
              />
            );
          })}
          {pipelines.map((pipeline) => {
            // Trunk lines (solid) are always named; minor dashed laterals
            // only get a name label once the viewer zooms in, same rule as
            // minor facility labels — keeps the default view uncluttered.
            const showLabel = !pipeline.style.dashed || scale >= LABEL_ZOOM_THRESHOLD;
            if (!showLabel) return null;
            return (
              <PipelineLabel
                key={`label-${pipeline.id}`}
                pipeline={pipeline}
                points={pipelinePoints.get(pipeline.id)!}
                onClick={onSelectPipeline}
                dimmed={operatorFilter !== null && pipeline.operator !== operatorFilter}
              />
            );
          })}
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}
