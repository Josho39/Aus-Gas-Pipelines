import { PIPELINE_COLORS, NODE_TYPE_COLORS } from "../lib/colors";

const NODE_TYPE_LABELS: Record<keyof typeof NODE_TYPE_COLORS, string> = {
  hub: "Hub / trading point",
  plant: "Gas plant / field",
  compressor: "Compressor station",
  sttm: "STTM (trading market)",
  lng: "LNG export facility",
  town: "Demand centre",
};

export function Legend() {
  return (
    <div className="text-xs text-slate-300 space-y-3">
      <div>
        <p className="font-semibold text-slate-200 mb-1">Pipelines</p>
        <div className="space-y-1">
          {Object.entries(PIPELINE_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="inline-block w-4 h-0.5" style={{ backgroundColor: color }} />
              <span className="capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="font-semibold text-slate-200 mb-1">Facilities</p>
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
