import { PIPELINE_COLORS, NODE_TYPE_COLORS, NODE_TYPE_SIZE, HOLLOW_NODE_TYPES } from "../lib/colors";
import type { NodeType } from "../types";

// Wording follows AEMO's own gas map legend where the categories line up,
// so the two read as the same map.
const NODE_TYPE_LABELS: Record<keyof typeof NODE_TYPE_COLORS, string> = {
  hub: "Key site / trading hub",
  plant: "Gas processing facility",
  lng: "Export LNG facility",
  sttm: "STTM (trading market)",
  compressor: "Compressor station",
  tradepoint: "Trade / receipt / delivery point",
  town: "Demand centre",
};

const PIPELINE_COLOR_LABELS: Record<keyof typeof PIPELINE_COLORS, string> = {
  teal: "Major pipeline",
  purple: "Produced-gas lateral / LNG",
  slate: "Minor pipeline / lateral",
};

export function Legend() {
  return (
    <div className="text-xs text-fgmuted space-y-3">
      <div>
        <p className="font-semibold text-fg mb-1">Pipelines</p>
        <div className="space-y-1">
          {Object.entries(PIPELINE_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="inline-block w-4 h-0.5"
                style={
                  key === "slate"
                    ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)` }
                    : { backgroundColor: color }
                }
              />
              <span>{PIPELINE_COLOR_LABELS[key as keyof typeof PIPELINE_COLORS]}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="font-semibold text-fg mb-1">Facilities</p>
        <div className="space-y-1">
          {(Object.keys(NODE_TYPE_LABELS) as NodeType[]).map((key) => {
            const color = NODE_TYPE_COLORS[key];
            const size = 6 + 6 * NODE_TYPE_SIZE[key];
            const hollow = HOLLOW_NODE_TYPES.has(key);
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="inline-flex w-3 justify-center">
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: hollow ? "transparent" : color,
                      border: hollow ? `1.5px solid ${color}` : undefined,
                    }}
                  />
                </span>
                <span>{NODE_TYPE_LABELS[key]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
