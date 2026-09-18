import { useMemo, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { PipelineLine } from "./PipelineLine";
import { PipelineLabel } from "./PipelineLabel";
import { NodeMarker } from "./NodeMarker";
import { MapZoomControls } from "./MapZoomControls";
import { getConnectedNodes } from "../lib/selectors";
import { projectGeo, computeGeoBounds } from "../lib/geoProject";
import { AUSTRALIA_OUTLINE } from "../lib/australiaOutline";
import { quantizeZoom, outlineScale, revealOpacity } from "../lib/zoomScale";
import type { PipelineNode, Pipeline, Selection, NodeType } from "../types";

// Pixels per degree of lat/lng, a fixed scale, rather than forcing every
// region into a fixed-size box. A region's own bounds vary in aspect ratio
// (the West dataset is much taller/narrower than the East one, and "All of
// Australia" is wider than either), so a fixed WIDTH/HEIGHT box would
// visibly stretch or squash whichever region didn't happen to match its
// aspect ratio, most noticeably the full-country view.
const PX_PER_DEGREE = 34;

// Hubs, trading markets and LNG plants stay labelled at any zoom level,
// they're the "main players." Everything else (fields, compressor
// stations, towns) only gets a label once the viewer has zoomed in past
// LABEL_ZOOM_THRESHOLD, so a zoomed-out view of a dense cluster doesn't
// turn into an unreadable pile of overlapping text.
const ALWAYS_LABELLED: ReadonlySet<NodeType> = new Set(["hub", "sttm", "lng"]);
// Processing plants sit right on top of the hub they feed (e.g. Moomba Gas
// Plant vs the Moomba Compression Facility) at essentially the same
// coordinates, so their label would just permanently overlap the more
// important node's. Never auto-reveal it; clicking the marker still shows
// it via the isSelected check in NodeMarker.
const NEVER_AUTO_LABELLED: ReadonlySet<NodeType> = new Set(["plant"]);
// This is the only thing zoom still switches on. How big everything is
// drawn is a continuous function of the zoom instead (see ../lib/zoomScale
// and the `zoom` prop on NodeMarker/PipelineLabel/PipelineLine), so labels,
// markers and line widths shrink a little on every scroll click rather than
// growing through a band and snapping down a step at its edge. Even this
// reveal fades in over a few clicks rather than popping.
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
  // Current zoom scale, rounded (see quantizeZoom). react-zoom-pan-pinch's
  // pan/zoom itself is a CSS transform applied directly to the DOM (smooth
  // regardless of React), but `onTransform` fires on every single frame of
  // a gesture, and storing the raw scale would re-render this whole tree
  // (and every child below) dozens of times a second while the user zooms,
  // which is what made zooming feel janky. Rounding first means React's
  // setState bails out via Object.is on every frame that doesn't actually
  // change the zoom - all of a pan, and most frames of an inertial glide -
  // while a real zoom step still re-renders once, at the size it landed on.
  const [zoom, setZoom] = useState(1);

  // Minor detail (dashed laterals, minor facility labels) fades in across
  // the threshold instead of the whole set appearing on one scroll click.
  const minorReveal = revealOpacity(zoom, LABEL_ZOOM_THRESHOLD);
  const showMinor = minorReveal > 0;

  // Project against this region's own extent, including real pipeline
  // route waypoints, not just facility positions, since a route can bow out
  // further than its endpoint nodes, so a region that only spans part of
  // Australia's lat/lng range still fills the canvas.
  //
  // All of this is memoized on [nodes, pipelines] only (never on zoom
  // state), it was previously recomputed from scratch on every single
  // zoom/pan frame, which was the other half of the "zoom feels janky"
  // problem: real main-thread work competing with the browser's transform
  // animation.
  // Includes the coastline outline itself, not just node/pipeline
  // positions, no facility sits up near Cape York or the Gulf of
  // Carpentaria, so bounds derived from data alone stopped short of the
  // real northern coastline and clipped the top of the continent off the
  // SVG viewport.
  const bounds = useMemo(
    () =>
      computeGeoBounds([
        ...nodes.map((n) => n.geoPos),
        ...pipelines.flatMap((p) => p.route ?? []),
        ...AUSTRALIA_OUTLINE.flat(),
      ]),
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

  // One "M ... Z" subpath per landmass (mainland, Tasmania, ...) so
  // separate islands render as separate shapes instead of one shape
  // connected across open water.
  const coastlinePath = useMemo(
    () =>
      AUSTRALIA_OUTLINE.map(
        (ring) =>
          "M " +
          ring
            .map(({ lat, lng }) => {
              const p = projectGeo(lat, lng, mapWidth, mapHeight, bounds);
              return `${p.x} ${p.y}`;
            })
            .join(" L ") +
          " Z"
      ).join(" "),
    [bounds, mapWidth, mapHeight]
  );

  // Real route geometry (from Geoscience Australia's pipeline dataset) when
  // we have it; otherwise fall back to straight segments through the
  // pipeline's named facility nodes. Computed once and shared by both the
  // line itself and its label, so the label always tracks its own line.
  //
  // Two corrections applied to raw route data:
  //  1. Some GA routes are stored in the opposite direction to our `path`
  //     list (e.g. SWQP's route runs Wallumbilla-to-Ballera even though
  //     `path` lists Ballera first) - reverse it when that orientation is
  //     the closer match, so it doesn't draw a nonsensical line jumping
  //     across the map to the wrong end first.
  //  2. A route's first/last point is snapped to its own endpoint node's
  //     actual position rather than trusted as-is: GA's surveyed route data
  //     doesn't always reach all the way to the facility we've placed a
  //     marker at (EGP's real route, for one, ends ~65km short of the
  //     Horsley Park node), which otherwise renders as a line that visually
  //     stops in mid-air short of its own destination dot. Snapping is a
  //     no-op when the route already ends at the node (the extra point is
  //     coincident, invisible).
  const pipelinePoints = useMemo(
    () =>
      new Map(
        pipelines.map((pipeline) => {
          const pathNodes = getConnectedNodes(pipeline, nodes);
          if (!pipeline.route) {
            return [pipeline.id, pathNodes.map((n) => projected.get(n.id)!)];
          }
          const firstNode = pathNodes[0];
          const lastNode = pathNodes[pathNodes.length - 1];
          const routeGeo = pipeline.route;
          const sqDist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
            (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2;
          let route = routeGeo;
          if (firstNode && lastNode && routeGeo.length > 1) {
            const normal = sqDist(firstNode.geoPos, routeGeo[0]) + sqDist(lastNode.geoPos, routeGeo[routeGeo.length - 1]);
            const reversed = sqDist(firstNode.geoPos, routeGeo[routeGeo.length - 1]) + sqDist(lastNode.geoPos, routeGeo[0]);
            if (reversed < normal) route = [...routeGeo].reverse();
          }
          const points = route.map((p) => projectGeo(p.lat, p.lng, mapWidth, mapHeight, bounds));
          const first = firstNode && projected.get(firstNode.id);
          const last = lastNode && projected.get(lastNode.id);
          if (first) points.unshift(first);
          if (last) points.push(last);
          return [pipeline.id, points];
        })
      ),
    [pipelines, nodes, bounds, mapWidth, mapHeight, projected]
  );

  return (
    <TransformWrapper
      minScale={0.5}
      // Deep enough to pick apart a single junction (individual laterals
      // off Wallumbilla, say). Nothing pins its own size in SVG user units
      // any more, so raising the ceiling no longer makes labels and dots
      // balloon out at the far end of the range - see ../lib/zoomScale.
      maxScale={20}
      initialScale={1}
      limitToBounds={false}
      // `smooth` (the library's default) multiplies `wheel.step` by the
      // wheel event's raw deltaY, and a standard mouse sends ~100-120 per
      // single click, not ~1. That meant one scroll click was zooming by
      // ~0.08 * 110 ≈ 8.8, an enormous jump disguised by a small-looking
      // step value. Disabling it makes `step` a fixed amount per wheel
      // event instead, which is what a "gentle zoom step" actually needs.
      smooth={false}
      wheel={{ step: 0.2 }}
      doubleClick={{ step: 0.7, animationTime: 200 }}
      panning={{ velocityDisabled: false }}
      onTransform={(_ref, state) => setZoom(quantizeZoom(state.scale))}
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
          <path
            d={coastlinePath}
            style={{ fill: "var(--color-landmass)", stroke: "var(--color-line)" }}
            fillOpacity={0.7}
            strokeWidth={1.5 * outlineScale(zoom)}
          />
          {pipelines.map((pipeline) => {
            const isSelected = selection?.kind === "pipeline" && selection.id === pipeline.id;
            // Minor dashed laterals (CSG gathering lines, interconnects)
            // stay hidden entirely, not just unlabelled, until the viewer
            // zooms in past the first threshold. Left always-on, a dense
            // cluster of them (e.g. the Surat Basin laterals) renders as an
            // unreadable pile of overlapping lines at the default zoom.
            if (pipeline.style.dashed && !showMinor && !isSelected) return null;
            return (
              <PipelineLine
                key={pipeline.id}
                pipeline={pipeline}
                points={pipelinePoints.get(pipeline.id)!}
                onClick={onSelectPipeline}
                isSelected={isSelected}
                dimmed={operatorFilter !== null && pipeline.operator !== operatorFilter}
                fade={pipeline.style.dashed && !isSelected ? minorReveal : 1}
                zoom={zoom}
              />
            );
          })}
          {nodes.map((node) => {
            const pos = projected.get(node.id)!;
            const isSelected = selection?.kind === "node" && selection.id === node.id;
            const isMajor = ALWAYS_LABELLED.has(node.type);
            return (
              <NodeMarker
                key={node.id}
                node={node}
                x={pos.x}
                y={pos.y}
                onClick={onSelectNode}
                isSelected={isSelected}
                showLabel={!NEVER_AUTO_LABELLED.has(node.type) && (isMajor || showMinor)}
                labelOpacity={isMajor ? 1 : minorReveal}
                zoom={zoom}
              />
            );
          })}
          {pipelines.map((pipeline) => {
            // Trunk lines (solid) are always named; minor dashed laterals
            // only get a name label once the viewer zooms in, same rule as
            // minor facility labels, keeps the default view uncluttered.
            const showLabel = !pipeline.hideLabel && (!pipeline.style.dashed || showMinor);
            if (!showLabel) return null;
            return (
              <PipelineLabel
                key={`label-${pipeline.id}`}
                pipeline={pipeline}
                points={pipelinePoints.get(pipeline.id)!}
                onClick={onSelectPipeline}
                dimmed={operatorFilter !== null && pipeline.operator !== operatorFilter}
                fade={pipeline.style.dashed ? minorReveal : 1}
                zoom={zoom}
              />
            );
          })}
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}
