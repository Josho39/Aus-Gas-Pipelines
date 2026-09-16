import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { PipelineLine } from "./PipelineLine";
import { NodeMarker } from "./NodeMarker";
import { getConnectedNodes } from "../lib/selectors";
import type { PipelineNode, Pipeline, Selection } from "../types";

interface SchematicMapProps {
  nodes: PipelineNode[];
  pipelines: Pipeline[];
  selection: Selection;
  onSelectNode: (id: string) => void;
  onSelectPipeline: (id: string) => void;
}

const VIEWBOX_PADDING = 80;

export function SchematicMap({ nodes, pipelines, selection, onSelectNode, onSelectPipeline }: SchematicMapProps) {
  const xs = nodes.map((n) => n.schematicPos.x);
  const ys = nodes.map((n) => n.schematicPos.y);
  const minX = Math.min(...xs) - VIEWBOX_PADDING;
  const minY = Math.min(...ys) - VIEWBOX_PADDING;
  const width = Math.max(...xs) - minX + VIEWBOX_PADDING;
  const height = Math.max(...ys) - minY + VIEWBOX_PADDING;

  return (
    <TransformWrapper minScale={0.3} maxScale={4} limitToBounds={false}>
      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
        <svg
          viewBox={`${minX} ${minY} ${width} ${height}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Schematic pipeline diagram"
        >
          {pipelines.map((pipeline) => (
            <PipelineLine
              key={pipeline.id}
              pipeline={pipeline}
              points={getConnectedNodes(pipeline, nodes).map((n) => n.schematicPos)}
              onClick={onSelectPipeline}
              isSelected={selection?.kind === "pipeline" && selection.id === pipeline.id}
            />
          ))}
          {nodes.map((node) => (
            <NodeMarker
              key={node.id}
              node={node}
              x={node.schematicPos.x}
              y={node.schematicPos.y}
              onClick={onSelectNode}
              isSelected={selection?.kind === "node" && selection.id === node.id}
            />
          ))}
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}
