import { PIPELINE_COLORS, NODE_TYPE_COLORS } from "../lib/colors";

const NODE_TYPE_LABELS: Record<keyof typeof NODE_TYPE_COLORS, string> = {
  hub: "Hub / trading point",
  plant: "Gas plant / field",
  compressor: "Compressor station",
  sttm: "STTM (trading market)",
  lng: "LNG export facility",
  town: "Demand centre",
};

const PIPELINE_COLOR_LABELS: Record<keyof typeof PIPELINE_COLORS, string> = {
  teal: "Major trunk",
  amber: "Secondary trunk",
  purple: "LNG / interstate",
  slate: "Minor lateral",
};

export function Legend() {
  return (
    <div className="text-xs text-fgmuted space-y-3">
      <div>
        <p className="font-semibold text-fg mb-1">Pipelines</p>
        <div className="space-y-1">
          {Object.entries(PIPELINE_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="inline-block w-4 h-0.5" style={{ backgroundColor: color }} />
              <span>{PIPELINE_COLOR_LABELS[key as keyof typeof PIPELINE_COLORS]}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-0.5"
              style={{ backgroundImage: "repeating-linear-gradient(90deg, #94a3b8 0 4px, transparent 4px 7px)" }}
            />
            <span>Dashed = lateral</span>
          </div>
        </div>
      </div>
      <div>
        <p className="font-semibold text-fg mb-1">Facilities</p>
        <div className="space-y-1">
          {Object.entries(NODE_TYPE_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span>{NODE_TYPE_LABELS[key as keyof typeof NODE_TYPE_COLORS]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
