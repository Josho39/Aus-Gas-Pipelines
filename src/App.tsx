import { useState } from "react";
import { useAppState } from "./state/AppState";
import { SchematicMap } from "./components/SchematicMap";
import { GeoMap } from "./components/GeoMap";
import { DetailPanel } from "./components/DetailPanel";
import { Legend } from "./components/Legend";
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
  const { region, view, selection, search, setRegion, setView, select, clearSelection, setSearch } = useAppState();
  const [tab, setTab] = useState<Tab>("map");

  const nodes = (region === "east" ? eastNodes : westNodes) as PipelineNode[];
  const pipelines = (region === "east" ? eastPipelines : westPipelines) as Pipeline[];

  const tabButtonClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium ${active ? "bg-teal text-ink" : "bg-panel text-slate-300 hover:text-slate-100"}`;

  return (
    <div className="min-h-screen bg-ink text-slate-100 flex flex-col">
      <header className="border-b border-line p-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold mr-4">Gas Pipeline Network</h1>

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
          <div className="flex items-center gap-2 ml-auto">
            <button className={tabButtonClass(view === "schematic")} onClick={() => setView("schematic")}>Schematic</button>
            <button className={tabButtonClass(view === "geo")} onClick={() => setView("geo")}>Geographic</button>
          </div>
        )}
      </header>

      <div className="p-3 border-b border-line">
        <div className="max-w-md">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </div>

      <main className="flex-1 relative overflow-hidden">
        {tab === "map" ? (
          <>
            <div className="absolute left-3 top-3 z-10 bg-panel/90 border border-line rounded-md p-3">
              <Legend />
            </div>
            <div className="absolute inset-0">
              {view === "schematic" ? (
                <SchematicMap
                  nodes={nodes}
                  pipelines={pipelines}
                  selection={selection}
                  onSelectNode={(id) => select({ kind: "node", id })}
                  onSelectPipeline={(id) => select({ kind: "pipeline", id })}
                />
              ) : (
                <GeoMap
                  nodes={nodes}
                  pipelines={pipelines}
                  selection={selection}
                  onSelectNode={(id) => select({ kind: "node", id })}
                  onSelectPipeline={(id) => select({ kind: "pipeline", id })}
                />
              )}
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
