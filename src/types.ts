export type Region = "east" | "west" | "nt";

export type NodeType =
  | "hub"
  /** A notional service point rather than a physical facility: the points
   * gas is actually bid, received and delivered at (trade points, hub runs,
   * IPTs). Several of these sit at one site, so they are drawn small and
   * only named once the map is zoomed in on them. */
  | "tradepoint"
  | "plant"
  | "compressor"
  | "sttm"
  | "lng"
  | "town";

export interface PipelineNode {
  id: string;
  name: string;
  type: NodeType;
  region: Region;
  /** Unused since the schematic view was dropped in favour of a single
   * geographic map; kept optional for backward compatibility with older
   * data entries rather than stripping the field from all of them. */
  schematicPos?: { x: number; y: number };
  geoPos: { lat: number; lng: number };
  description: string;
  /** Compact label for the map marker (e.g. "MCF" for "Moomba Compression
   * Facility (MCF)"). Falls back to `name` when absent. The detail panel
   * always shows the full `name`. */
  shortLabel?: string;
  /** Which side of the marker its label sits on. Defaults to "right". Used
   * to pull a label away from a neighbouring node or line it would
   * otherwise sit on top of. */
  labelPosition?: "right" | "left" | "top" | "bottom";
  /** Hold this node's name back until the map is zoomed past this scale,
   * then fade it in. For points that really do sit on top of one another -
   * the Wallumbilla trade points and numbered runs are all within a few km
   * of the hub - where the honest fix is to wait until the viewer is close
   * enough for the names to have somewhere to go, rather than to shove the
   * dots apart and draw a lie. */
  labelMinZoom?: number;
}

export type PipelineColor = "teal" | "purple" | "slate";

export interface Pipeline {
  id: string;
  code: string;
  name: string;
  region: Region;
  path: string[];
  description: string;
  operator?: string;
  lengthKm?: number;
  capacity?: string;
  style: { color: PipelineColor; dashed?: boolean };
  /** Real-world route waypoints (lat/lng), from Geoscience Australia's Oil
   * and Gas Pipelines dataset, for pipelines where a match was found. When
   * absent, the geographic view falls back to straight segments through
   * `path`'s named facility nodes. */
  route?: { lat: number; lng: number }[];
  /** Hold this pipeline's name back until past this zoom, as with a node's
   * labelMinZoom. */
  labelMinZoom?: number;
  /** Treat this pipeline's name as minor detail: no label at the default
   * zoom, fading in past the same threshold that reveals minor laterals.
   * The line itself is drawn at every zoom - this is only about the name.
   * For a short trunk line into an already dense junction (the four that
   * meet Wallumbilla), where a label at full-country zoom lands on top of
   * its neighbours and reads as noise. */
  minorLabel?: boolean;
  /** Pin this pipeline's label above or below its own line, overriding the
   * side that would otherwise be picked from a hash of its id. For a label
   * the hash happens to throw onto the crowded side of a junction. */
  labelSide?: "above" | "below";
  /** Never show this pipeline's name label, at any zoom level. For a
   * cluster of short laterals feeding into the same hub (e.g. the CSG
   * gathering laterals around Wallumbilla) where even at full zoom there
   * isn't room for every one of their names without them piling on top of
   * each other. The line itself still renders and is still clickable. */
  hideLabel?: boolean;
}

export type Selection = { kind: "node" | "pipeline"; id: string } | null;
