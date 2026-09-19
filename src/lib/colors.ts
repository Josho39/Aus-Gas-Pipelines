import type { PipelineColor, NodeType } from "../types";

/**
 * Palette taken from AEMO's Natural Gas Services Bulletin Board gas map
 * (gas-map-v2021-v16.pdf), the reference this map is styled after. The exact
 * values are the ones in that PDF's own content stream, not eyeballed from a
 * screenshot, so a reader who knows the AEMO map reads the same colours here.
 */

/**
 * Line colours go through CSS variables rather than straight hex, because
 * AEMO's palette is built for ink on white: their major-pipeline green and
 * minor-pipeline red are dark enough to disappear against this map's dark
 * theme. The variables carry AEMO's own values in light mode and lightened
 * ones in dark (see index.css), so both themes read as the same map.
 */
export const PIPELINE_COLORS: Record<PipelineColor, string> = {
  /** AEMO "major pipeline", #156734. */
  teal: "var(--pipe-major)",
  /** AEMO "produced-gas lateral", #B156BD - the colour their LNG feed lines
   * use (Bayu Undan to Darwin, Barossa). Ours carries the LNG and
   * interstate lines for the same reason. */
  purple: "var(--pipe-lateral)",
  /** AEMO "minor pipeline", #A82041. Ours are drawn dashed on top of that,
   * to keep the gathering laterals separable from trunk lines. */
  slate: "var(--pipe-minor)",
};

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  /** AEMO "key sites". Hubs, compressors and trade points are all key sites
   * to AEMO; here they share the colour and are told apart by size and by
   * the trade points being drawn hollow (see NodeMarker). */
  hub: "#F2AA2D",
  tradepoint: "#F2AA2D",
  compressor: "#F2AA2D",
  /** AEMO "gas processing facilities". */
  plant: "#EC008C",
  /** AEMO "export LNG facilities". */
  lng: "#04A9D3",
  /** No AEMO equivalent - their map has no trading markets - so this takes
   * the one remaining colour in their palette. */
  sttm: "#B156BD",
  /** Demand centres. AEMO draws cities as a plain dark dot with the name
   * beside it. */
  town: "#6E7080",
};

/**
 * Relative dot size per type, which is how the key-site colour splits back
 * out into a hierarchy: a trading hub should read louder than a compressor
 * station sitting on the line between two of them.
 */
export const NODE_TYPE_SIZE: Record<NodeType, number> = {
  hub: 1,
  lng: 0.9,
  plant: 0.8,
  sttm: 0.8,
  compressor: 0.62,
  tradepoint: 0.62,
  town: 0.55,
};

/** Drawn as a ring rather than a filled dot: these are notional points, not
 * plant on the ground. */
export const HOLLOW_NODE_TYPES: ReadonlySet<NodeType> = new Set(["tradepoint"]);
