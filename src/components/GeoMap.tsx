import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { PipelineLine } from "./PipelineLine";
import { NodeMarker } from "./NodeMarker";
import { getConnectedNodes } from "../lib/selectors";
import { projectGeo } from "../lib/geoProject";
import type { PipelineNode, Pipeline, Selection } from "../types";

const WIDTH = 900;
const HEIGHT = 1000;

interface GeoMapProps {
  nodes: PipelineNode[];
  pipelines: Pipeline[];
  selection: Selection;
  onSelectNode: (id: string) => void;
  onSelectPipeline: (id: string) => void;
}

export function GeoMap({ nodes, pipelines, selection, onSelectNode, onSelectPipeline }: GeoMapProps) {
  const projected = new Map(
    nodes.map((n) => [n.id, projectGeo(n.geoPos.lat, n.geoPos.lng, WIDTH, HEIGHT)])
  );

  return (
    <TransformWrapper minScale={0.3} maxScale={4} limitToBounds={false}>
      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} role="img" aria-label="Geographic pipeline map">
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#0e1830" stroke="#1c2a45" strokeDasharray="4 6" />
          {pipelines.map((pipeline) => (
            <PipelineLine
              key={pipeline.id}
              pipeline={pipeline}
              points={getConnectedNodes(pipeline, nodes).map((n) => projected.get(n.id)!)}
              onClick={onSelectPipeline}
              isSelected={selection?.kind === "pipeline" && selection.id === pipeline.id}
            />
          ))}
          {nodes.map((node) => {
            const pos = projected.get(node.id)!;
            return (
              <NodeMarker
                key={node.id}
                node={node}
                x={pos.x}
                y={pos.y}
                onClick={onSelectNode}
                isSelected={selection?.kind === "node" && selection.id === node.id}
              />
            );
          })}
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}
