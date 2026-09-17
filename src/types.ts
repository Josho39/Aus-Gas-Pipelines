export type Region = "east" | "west" | "nt";

export type NodeType =
  | "hub"
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
  /** Never show this pipeline's name label, at any zoom level. For a
   * cluster of short laterals feeding into the same hub (e.g. the CSG
   * gathering laterals around Wallumbilla) where even at full zoom there
   * isn't room for every one of their names without them piling on top of
   * each other. The line itself still renders and is still clickable. */
  hideLabel?: boolean;
}

export type Selection = { kind: "node" | "pipeline"; id: string } | null;
