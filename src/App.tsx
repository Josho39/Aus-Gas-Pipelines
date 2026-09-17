import { useMemo, useState } from "react";
import { useAppState } from "./state/AppState";
import { GeoMap } from "./components/GeoMap";
import { DetailPanel } from "./components/DetailPanel";
import { Legend } from "./components/Legend";
import { OperatorFilter } from "./components/OperatorFilter";
import { SearchBar } from "./components/SearchBar";
import { ContractsView } from "./components/ContractsView";

import eastNodes from "./data/east/nodes.json";
import eastPipelines from "./data/east/pipelines.json";
import westNodes from "./data/west/nodes.json";
import westPipelines from "./data/west/pipelines.json";
import contracts from "./data/contracts.json";

import type { PipelineNode, Pipeline } from "./types";
import type { ContractsData } from "./data/contracts";

type Tab = "map" | "contracts";

export default function App() {
  const { region, selection, search, operatorFilter, setRegion, select, clearSelection, setSearch, setOperatorFilter } =
    useAppState();
  const [tab, setTab] = useState<Tab>("map");
  const [panelOpen, setPanelOpen] = useState(true);

  const nodes = (region === "east" ? eastNodes : westNodes) as PipelineNode[];
  const pipelines = (region === "east" ? eastPipelines : westPipelines) as Pipeline[];

  const operators = useMemo(() => {
    const set = new Set(pipelines.map((p) => p.operator).filter((op): op is string => Boolean(op)));
    return Array.from(set).sort();
  }, [pipelines]);

  const tabButtonClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium ${active ? "bg-teal text-ink" : "bg-panel text-slate-300 hover:text-slate-100"}`;

  return (
    <div className="h-screen bg-ink text-slate-100 flex flex-col overflow-hidden">
      <header className="border-b border-line px-4 py-2.5 flex flex-wrap items-center gap-3 shrink-0">
        <h1 className="text-lg font-semibold mr-4">Gas Pipeline Network</h1>

        <button className={tabButtonClass(tab === "map" && region === "east")} onClick={() => { setTab("map"); setRegion("east"); }}>
          East Coast
        </button>
        <button className={tabButtonClass(tab === "map" && region === "west")} onClick={() => { setTab("map"); setRegion("west"); }}>
          West Coast
        </button>
        <button className={tabButtonClass(tab === "contracts")} onClick={() => setTab("contracts")}>
          FY26 Contracts
        </button>

        {tab === "map" && (
          <button className={tabButtonClass(panelOpen)} onClick={() => setPanelOpen((v) => !v)}>
            {panelOpen ? "Hide panel" : "Legend & operators"}
          </button>
        )}

        {tab === "contracts" && (
          <div className="max-w-md ml-auto">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        )}
      </header>

      <main className="flex-1 relative overflow-hidden">
        {tab === "map" ? (
          <>
            {panelOpen && (
              <div className="absolute left-3 top-3 z-10 bg-panel/90 border border-line rounded-md p-3 space-y-4 max-h-[calc(100%-1.5rem)] overflow-y-auto">
                <Legend />
                <OperatorFilter operators={operators} active={operatorFilter} onChange={setOperatorFilter} />
              </div>
            )}
            <div className="absolute inset-0">
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
