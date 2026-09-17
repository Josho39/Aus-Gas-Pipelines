import type { PipelineColor, NodeType } from "../types";

export const PIPELINE_COLORS: Record<PipelineColor, string> = {
  teal: "#2dd4bf",
  purple: "#a78bfa",
  slate: "#64748b",
};

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  hub: "#38bdf8",
  plant: "#a3e635",
  compressor: "#fbbf24",
  sttm: "#f472b6",
  lng: "#a78bfa",
  town: "#94a3b8",
};
