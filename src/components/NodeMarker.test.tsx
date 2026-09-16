import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NodeMarker } from "./NodeMarker";
import type { PipelineNode } from "../types";

const node: PipelineNode = {
  id: "wallumbilla",
  name: "Wallumbilla Hub (WAL)",
  type: "hub",
  region: "east",
  schematicPos: { x: 829, y: 744 },
  geoPos: { lat: -26.57, lng: 149.15 },
  description: "test",
};

describe("NodeMarker", () => {
  it("renders a circle with the node type's color", () => {
    render(
      <svg>
        <NodeMarker node={node} x={100} y={200} onClick={() => {}} isSelected={false} />
      </svg>
    );
    const marker = screen.getByTestId("node-wallumbilla");
    expect(marker).toHaveAttribute("fill", "#38bdf8");
  });

  it("calls onClick with the node id when clicked", () => {
    const onClick = vi.fn();
    render(
      <svg>
        <NodeMarker node={node} x={100} y={200} onClick={onClick} isSelected={false} />
      </svg>
    );
    fireEvent.click(screen.getByTestId("node-wallumbilla"));
    expect(onClick).toHaveBeenCalledWith("wallumbilla");
  });
});
