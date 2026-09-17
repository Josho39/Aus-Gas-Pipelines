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
  schematicPos: { x: number; y: number };
  geoPos: { lat: number; lng: number };
  description: string;
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
