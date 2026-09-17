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
          className="absolute right-0 top-0 h-full w-[360px] bg-panel border-l border-line p-5 overflow-y-auto z-20 shadow-2xl"
        >
          <button
            aria-label="Close panel"
            onClick={onClose}
            className="absolute right-4 top-4 flex items-center justify-center w-7 h-7 rounded-md text-fgmuted hover:text-fg hover:bg-ink transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {node && (
            <>
              <h2 className="text-lg font-bold pr-8">{node.name}</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-teal">{node.type}</p>
              <p className="mt-3 text-sm text-fgmuted leading-relaxed">{node.description}</p>
              <h3 className="mt-5 text-sm font-semibold text-fg">Connected pipelines</h3>
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
              <h2 className="text-lg font-bold pr-8">{pipeline.name}</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-teal">{pipeline.code}</p>
              <p className="mt-3 text-sm text-fgmuted leading-relaxed">{pipeline.description}</p>
              <dl className="mt-3 text-sm text-fg space-y-1">
                {pipeline.operator && (
                  <div><dt className="inline text-fgmuted">Operator: </dt><dd className="inline">{pipeline.operator}</dd></div>
                )}
                {pipeline.lengthKm && (
                  <div><dt className="inline text-fgmuted">Length: </dt><dd className="inline">{pipeline.lengthKm} km</dd></div>
                )}
                {pipeline.capacity && (
                  <div><dt className="inline text-fgmuted">Capacity: </dt><dd className="inline">{pipeline.capacity}</dd></div>
                )}
              </dl>
              <h3 className="mt-5 text-sm font-semibold text-fg">Route</h3>
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
