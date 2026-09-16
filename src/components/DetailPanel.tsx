import { motion, AnimatePresence } from "framer-motion";
import { getNodeById, getConnectedPipelines, getConnectedNodes } from "../lib/selectors";
import type { PipelineNode, Pipeline, Selection } from "../types";

interface DetailPanelProps {
  selection: Selection;
  nodes: PipelineNode[];
  pipelines: Pipeline[];
  onSelect: (selection: Selection) => void;
  onClose: () => void;
}

export function DetailPanel({ selection, nodes, pipelines, onSelect, onClose }: DetailPanelProps) {
  const node = selection?.kind === "node" ? getNodeById(nodes, selection.id) : undefined;
  const pipeline = selection?.kind === "pipeline" ? pipelines.find((p) => p.id === selection.id) : undefined;

  return (
    <AnimatePresence>
      {selection && (node || pipeline) && (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed right-0 top-0 h-full w-[360px] bg-panel border-l border-line p-5 overflow-y-auto"
        >
          <button
            aria-label="Close panel"
            onClick={onClose}
            className="mb-4 text-slate-400 hover:text-slate-100"
          >
            Close
          </button>

          {node && (
            <>
              <h2 className="text-lg font-semibold">{node.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{node.type}</p>
              <p className="mt-3 text-sm text-slate-300">{node.description}</p>
              <h3 className="mt-5 text-sm font-semibold text-slate-200">Connected pipelines</h3>
              <ul className="mt-2 space-y-1">
                {getConnectedPipelines(node.id, pipelines).map((p) => (
                  <li key={p.id}>
                    <button
                      className="text-teal hover:underline text-sm"
                      onClick={() => onSelect({ kind: "pipeline", id: p.id })}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {pipeline && (
            <>
              <h2 className="text-lg font-semibold">{pipeline.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{pipeline.code}</p>
              <p className="mt-3 text-sm text-slate-300">{pipeline.description}</p>
              <dl className="mt-3 text-sm text-slate-300 space-y-1">
                {pipeline.operator && (
                  <div><dt className="inline text-slate-400">Operator: </dt><dd className="inline">{pipeline.operator}</dd></div>
                )}
                {pipeline.lengthKm && (
                  <div><dt className="inline text-slate-400">Length: </dt><dd className="inline">{pipeline.lengthKm} km</dd></div>
                )}
                {pipeline.capacity && (
                  <div><dt className="inline text-slate-400">Capacity: </dt><dd className="inline">{pipeline.capacity}</dd></div>
                )}
              </dl>
              <h3 className="mt-5 text-sm font-semibold text-slate-200">Route</h3>
              <ul className="mt-2 space-y-1">
                {getConnectedNodes(pipeline, nodes).map((n) => (
                  <li key={n.id}>
                    <button
                      className="text-teal hover:underline text-sm"
                      onClick={() => onSelect({ kind: "node", id: n.id })}
                    >
                      {n.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
