import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DetailPanel } from "./DetailPanel";
import nodes from "../data/east/nodes.json";
import pipelines from "../data/east/pipelines.json";
import type { PipelineNode, Pipeline } from "../types";

const typedNodes = nodes as PipelineNode[];
const typedPipelines = pipelines as Pipeline[];

describe("DetailPanel", () => {
  it("renders nothing when there is no selection", () => {
    const { container } = render(
      <DetailPanel selection={null} nodes={typedNodes} pipelines={typedPipelines} onSelect={() => {}} onClose={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a node's name, description, and connected pipelines", () => {
    render(
      <DetailPanel
        selection={{ kind: "node", id: "wallumbilla" }}
        nodes={typedNodes}
        pipelines={typedPipelines}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByText("Wallumbilla Hub (WAL)")).toBeInTheDocument();
    expect(screen.getByText(/Major Queensland gas trading hub/)).toBeInTheDocument();
    expect(screen.getByText("South West Queensland Pipeline")).toBeInTheDocument();
  });

  it("shows a pipeline's name, description, and connected nodes", () => {
    render(
      <DetailPanel
        selection={{ kind: "pipeline", id: "swqp" }}
        nodes={typedNodes}
        pipelines={typedPipelines}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByText("South West Queensland Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Ballera")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <DetailPanel
        selection={{ kind: "node", id: "wallumbilla" }}
        nodes={typedNodes}
        pipelines={typedPipelines}
        onSelect={() => {}}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
