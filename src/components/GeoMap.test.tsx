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

  it("projects west nodes against their own region bounds, spreading them across most of the canvas width", () => {
    render(
      <GeoMap
        nodes={nodes as PipelineNode[]}
        pipelines={pipelines as Pipeline[]}
        selection={null}
        onSelectNode={() => {}}
        onSelectPipeline={() => {}}
      />
    );
    const xs = (nodes as PipelineNode[]).map((n) => {
      const circle = screen.getByTestId(`node-${n.id}`);
      return Number(circle.getAttribute("cx"));
    });
    const spread = Math.max(...xs) - Math.min(...xs);
    // GeoMap's canvas is 900 wide. Projected against the whole-continent
    // AUSTRALIA_BOUNDS, the west dataset spans only ~18% of that (x roughly
    // 56-219). Projected against its own computed bounds it should span the
    // large majority of the canvas instead.
    expect(spread).toBeGreaterThan(900 * 0.6);
  });
});
