import type { PipelineNode, Pipeline } from "../types";

export function getNodeById(nodes: PipelineNode[], id: string): PipelineNode | undefined {
  return nodes.find((n) => n.id === id);
}

export function getConnectedPipelines(nodeId: string, pipelines: Pipeline[]): Pipeline[] {
  return pipelines.filter((p) => p.path.includes(nodeId));
}

export function getConnectedNodes(pipeline: Pipeline, nodes: PipelineNode[]): PipelineNode[] {
  return pipeline.path
    .map((id) => getNodeById(nodes, id))
    .filter((n): n is PipelineNode => n !== undefined);
}
