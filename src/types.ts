export type Region = "east" | "west";

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
}

export type PipelineColor = "teal" | "amber" | "purple" | "slate";

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
}

export type Selection = { kind: "node" | "pipeline"; id: string } | null;
