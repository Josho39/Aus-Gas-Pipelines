import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GeoMap } from "./GeoMap";
import nodes from "../data/west/nodes.json";
import pipelines from "../data/west/pipelines.json";
import type { PipelineNode, Pipeline } from "../types";

describe("GeoMap", () => {
  it("renders a marker for every node and a line for every pipeline", () => {
    render(
      <GeoMap
        nodes={nodes as PipelineNode[]}
        pipelines={pipelines as Pipeline[]}
        selection={null}
        onSelectNode={() => {}}
        onSelectPipeline={() => {}}
      />
    );
    expect(screen.getByTestId("node-dampier")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-dbp")).toBeInTheDocument();
  });

  it("calls onSelectPipeline when a pipeline line is clicked", () => {
    const onSelectPipeline = vi.fn();
    render(
      <GeoMap
        nodes={nodes as PipelineNode[]}
        pipelines={pipelines as Pipeline[]}
        selection={null}
        onSelectNode={() => {}}
        onSelectPipeline={onSelectPipeline}
      />
    );
    fireEvent.click(screen.getByTestId("pipeline-dbp"));
    expect(onSelectPipeline).toHaveBeenCalledWith("dbp");
  });
});
