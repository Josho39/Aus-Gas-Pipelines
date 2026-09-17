import { useMemo, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { PipelineLine } from "./PipelineLine";
import { PipelineLabel } from "./PipelineLabel";
import { NodeMarker } from "./NodeMarker";
import { MapZoomControls } from "./MapZoomControls";
import { getConnectedNodes } from "../lib/selectors";
import { projectGeo, computeGeoBounds } from "../lib/geoProject";
import { AUSTRALIA_OUTLINE } from "../lib/australiaOutline";
import type { PipelineNode, Pipeline, Selection, NodeType } from "../types";

// Pixels per degree of lat/lng — a fixed scale, rather than forcing every
// region into a fixed-size box. A region's own bounds vary in aspect ratio
// (the West dataset is much taller/narrower than the East one, and "All of
// Australia" is wider than either), so a fixed WIDTH/HEIGHT box would
// visibly stretch or squash whichever region didn't happen to match its
// aspect ratio — most noticeably the full-country view.
const PX_PER_DEGREE = 34;

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
  // Whether minor (dashed/non-anchor) labels are currently shown. This is
  // deliberately a boolean, not the raw zoom scale: react-zoom-pan-pinch's
  // pan/zoom itself is a CSS transform applied directly to the DOM (smooth
  // regardless of React), but `onTransform` fires on every single frame of
  // a gesture — storing the raw scale would re-render this whole tree (and
  // every child below) dozens of times a second while the user zooms,
  // which is what made zooming feel janky. Storing just the
  // threshold-crossing boolean means React's setState bails out via
  // Object.is on every frame that doesn't cross the threshold, so a smooth
  // zoom triggers ~0 re-renders instead of ~60/second.
  const [labelsExpanded, setLabelsExpanded] = useState(false);

  // Project against this region's own extent — including real pipeline
  // route waypoints, not just facility positions, since a route can bow out
  // further than its endpoint nodes — so a region that only spans part of
  // Australia's lat/lng range still fills the canvas.
  //
  // All of this is memoized on [nodes, pipelines] only (never on zoom
  // state) — it was previously recomputed from scratch on every single
  // zoom/pan frame, which was the other half of the "zoom feels janky"
  // problem: real main-thread work competing with the browser's transform
  // animation.
  const bounds = useMemo(
    () => computeGeoBounds([...nodes.map((n) => n.geoPos), ...pipelines.flatMap((p) => p.route ?? [])]),
    [nodes, pipelines]
  );

  // Canvas size follows the bounds' actual aspect ratio at a fixed
  // pixels-per-degree scale, so nothing gets stretched to fit an
  // unrelated fixed box (see PX_PER_DEGREE comment above).
  const { width: mapWidth, height: mapHeight } = useMemo(
    () => ({
      width: (bounds.maxLng - bounds.minLng) * PX_PER_DEGREE,
      height: (bounds.maxLat - bounds.minLat) * PX_PER_DEGREE,
    }),
    [bounds]
  );

  const projected = useMemo(
    () => new Map(nodes.map((n) => [n.id, projectGeo(n.geoPos.lat, n.geoPos.lng, mapWidth, mapHeight, bounds)])),
    [nodes, bounds, mapWidth, mapHeight]
  );

  const coastlinePath = useMemo(
    () =>
      "M " +
      AUSTRALIA_OUTLINE.map(({ lat, lng }) => {
        const p = projectGeo(lat, lng, mapWidth, mapHeight, bounds);
        return `${p.x} ${p.y}`;
      }).join(" L ") +
      " Z",
    [bounds, mapWidth, mapHeight]
  );

  // Real route geometry (from Geoscience Australia's pipeline dataset) when
  // we have it; otherwise fall back to straight segments through the
  // pipeline's named facility nodes. Computed once and shared by both the
  // line itself and its label, so the label always tracks its own line.
  const pipelinePoints = useMemo(
    () =>
      new Map(
        pipelines.map((pipeline) => [
          pipeline.id,
          pipeline.route
            ? pipeline.route.map((p) => projectGeo(p.lat, p.lng, mapWidth, mapHeight, bounds))
            : getConnectedNodes(pipeline, nodes).map((n) => projected.get(n.id)!),
        ])
      ),
    [pipelines, nodes, bounds, mapWidth, mapHeight, projected]
  );

  return (
    <TransformWrapper
      minScale={0.5}
      maxScale={12}
      initialScale={1}
      limitToBounds={false}
      // `smooth` (the library's default) multiplies `wheel.step` by the
      // wheel event's raw deltaY — and a standard mouse sends ~100-120 per
      // single click, not ~1. That meant one scroll click was zooming by
      // ~0.08 * 110 ≈ 8.8, an enormous jump disguised by a small-looking
      // step value. Disabling it makes `step` a fixed amount per wheel
      // event instead, which is what a "gentle zoom step" actually needs.
      smooth={false}
      wheel={{ step: 0.2 }}
      doubleClick={{ step: 0.7, animationTime: 200 }}
      panning={{ velocityDisabled: false }}
      onTransform={(_ref, state) => setLabelsExpanded(state.scale >= LABEL_ZOOM_THRESHOLD)}
    >
      <MapZoomControls />
      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          style={{ width: "100%", height: "100%" }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Geographic pipeline map"
        >
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
                showLabel={ALWAYS_LABELLED.has(node.type) || labelsExpanded}
              />
            );
          })}
          {pipelines.map((pipeline) => {
            // Trunk lines (solid) are always named; minor dashed laterals
            // only get a name label once the viewer zooms in, same rule as
            // minor facility labels — keeps the default view uncluttered.
            const showLabel = !pipeline.style.dashed || labelsExpanded;
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
