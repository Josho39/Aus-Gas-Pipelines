import { useMemo, useState } from "react";
import { useAppState } from "./state/AppState";
import { useTheme } from "./hooks/useTheme";
import { GeoMap } from "./components/GeoMap";
import { DetailPanel } from "./components/DetailPanel";
import { Legend } from "./components/Legend";
import { OperatorFilter } from "./components/OperatorFilter";
import { SearchBar } from "./components/SearchBar";
import { ContractsView } from "./components/ContractsView";
import { ThemeToggle } from "./components/ThemeToggle";

import eastNodes from "./data/east/nodes.json";
import eastPipelines from "./data/east/pipelines.json";
import westNodes from "./data/west/nodes.json";
import westPipelines from "./data/west/pipelines.json";
import contracts from "./data/contracts.json";

import type { PipelineNode, Pipeline } from "./types";
import type { ContractsData } from "./data/contracts";

type Tab = "map" | "contracts";

// Node/pipeline ids are unique across both regions (verified, no id
// appears in both east and west), so a plain concat is a safe merge into
// one combined, whole-of-Australia map.
const ALL_NODES = [...(eastNodes as PipelineNode[]), ...(westNodes as PipelineNode[])];
const ALL_PIPELINES = [...(eastPipelines as Pipeline[]), ...(westPipelines as Pipeline[])];

export default function App() {
  const { selection, search, operatorFilter, select, clearSelection, setSearch, setOperatorFilter } = useAppState();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("map");
  const [panelOpen, setPanelOpen] = useState(true);

  const nodes = ALL_NODES;
  const pipelines = ALL_PIPELINES;

  const operators = useMemo(() => {
    const set = new Set(pipelines.map((p) => p.operator).filter((op): op is string => Boolean(op)));
    return Array.from(set).sort();
  }, [pipelines]);

  const segmentClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      active ? "bg-teal text-onaccent shadow-sm" : "text-fgmuted hover:text-fg"
    }`;

  const ghostButtonClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
      active
        ? "bg-panel border-teal text-fg"
        : "bg-panel border-line text-fgmuted hover:text-fg hover:border-slateline"
    }`;

  return (
    <div className="h-screen bg-ink text-fg flex flex-col overflow-hidden">
      <header className="border-b border-line px-4 py-2.5 flex flex-wrap items-center gap-3 shrink-0 bg-panel/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 mr-2">
          <svg width="24" height="24" viewBox="0 0 64 64" className="shrink-0">
            <rect x="14" y="24" width="36" height="34" rx="2" fill="#3ABB3A" stroke="#0D4B0D" strokeWidth="3" />
            <rect x="18" y="24" width="7" height="34" fill="#7EE05C" />
            <rect x="41" y="24" width="7" height="34" fill="#1F7A1F" />
            <rect x="7" y="8" width="50" height="19" rx="3" fill="#3ABB3A" stroke="#0D4B0D" strokeWidth="3" />
            <rect x="11" y="8" width="8" height="19" fill="#7EE05C" />
            <rect x="46" y="8" width="8" height="19" fill="#1F7A1F" />
            <ellipse cx="32" cy="17.5" rx="21" ry="7.5" fill="#0D4B0D" />
            <ellipse cx="32" cy="16.5" rx="16" ry="5.5" fill="#0A3A0A" />
          </svg>
          <div className="leading-tight">
            <h1 className="text-base font-bold tracking-tight whitespace-nowrap">Gas Pipeline Network</h1>
            <p className="text-[10px] text-fgmuted whitespace-nowrap">Built by Josh and Luc, inspired by Doug</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-ink/60 border border-line rounded-lg p-1 flex-wrap">
          <button className={segmentClass(tab === "map")} onClick={() => setTab("map")}>
            Pipeline Map
          </button>
          <button className={segmentClass(tab === "contracts")} onClick={() => setTab("contracts")}>
            FY26 Contracts
          </button>
        </div>

        {tab === "map" && (
          <button className={ghostButtonClass(panelOpen)} onClick={() => setPanelOpen((v) => !v)}>
            {panelOpen ? "Hide panel" : "Legend & operators"}
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {tab === "contracts" && (
            <div className="w-64">
              <SearchBar value={search} onChange={setSearch} />
            </div>
          )}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {tab === "map" ? (
          <>
            {panelOpen && (
              <div className="absolute left-3 top-3 z-10 bg-panel/95 border border-line rounded-lg shadow-lg p-3 space-y-4 max-h-[calc(100%-1.5rem)] overflow-y-auto">
                <Legend />
                <OperatorFilter operators={operators} active={operatorFilter} onChange={setOperatorFilter} />
              </div>
            )}
            <div className="absolute inset-0 bg-ink">
              <GeoMap
                nodes={nodes}
                pipelines={pipelines}
                selection={selection}
                onSelectNode={(id) => select({ kind: "node", id })}
                onSelectPipeline={(id) => select({ kind: "pipeline", id })}
                operatorFilter={operatorFilter}
              />
            </div>
            <DetailPanel selection={selection} nodes={nodes} pipelines={pipelines} onSelect={select} onClose={clearSelection} />
          </>
        ) : (
          <div className="absolute inset-0 overflow-y-auto">
            <ContractsView data={contracts as ContractsData} search={search} />
          </div>
        )}
      </main>
    </div>
  );
}
