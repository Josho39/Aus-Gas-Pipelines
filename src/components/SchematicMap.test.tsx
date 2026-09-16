import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SchematicMap } from "./SchematicMap";
import nodes from "../data/east/nodes.json";
import pipelines from "../data/east/pipelines.json";
import type { PipelineNode, Pipeline } from "../types";

describe("SchematicMap", () => {
  it("renders a marker for every node and a line for every pipeline", () => {
    render(
      <SchematicMap
        nodes={nodes as PipelineNode[]}
        pipelines={pipelines as Pipeline[]}
        selection={null}
        onSelectNode={() => {}}
        onSelectPipeline={() => {}}
      />
    );
    expect(screen.getByTestId("node-wallumbilla")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-swqp")).toBeInTheDocument();
  });

  it("calls onSelectNode when a node marker is clicked", () => {
    const onSelectNode = vi.fn();
    render(
      <SchematicMap
        nodes={nodes as PipelineNode[]}
        pipelines={pipelines as Pipeline[]}
        selection={null}
        onSelectNode={onSelectNode}
        onSelectPipeline={() => {}}
      />
    );
    fireEvent.click(screen.getByTestId("node-wallumbilla"));
    expect(onSelectNode).toHaveBeenCalledWith("wallumbilla");
  });
});
