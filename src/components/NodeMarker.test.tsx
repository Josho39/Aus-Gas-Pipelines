import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NodeMarker } from "./NodeMarker";
import { NODE_TYPE_COLORS } from "../lib/colors";
import type { PipelineNode } from "../types";

const node: PipelineNode = {
  id: "wallumbilla",
  name: "Wallumbilla Hub (WAL)",
  type: "hub",
  region: "east",
  schematicPos: { x: 829, y: 744 },
  geoPos: { lat: -26.57, lng: 149.15 },
  description: "test",
  shortLabel: "WAL",
};

describe("NodeMarker", () => {
  it("renders a circle with the node type's color", () => {
    render(
      <svg>
        <NodeMarker node={node} x={100} y={200} onClick={() => {}} isSelected={false} />
      </svg>
    );
    const marker = screen.getByTestId("node-wallumbilla");
    expect(marker).toHaveAttribute("fill", NODE_TYPE_COLORS.hub);
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

  it("labels the marker with shortLabel instead of the full name when present", () => {
    render(
      <svg>
        <NodeMarker node={node} x={100} y={200} onClick={() => {}} isSelected={false} />
      </svg>
    );
    expect(screen.getByText("WAL")).toBeInTheDocument();
    expect(screen.queryByText("Wallumbilla Hub (WAL)")).not.toBeInTheDocument();
  });

  it("falls back to the full name when shortLabel is absent", () => {
    const { shortLabel, ...noShortLabel } = node;
    void shortLabel;
    render(
      <svg>
        <NodeMarker node={noShortLabel} x={100} y={200} onClick={() => {}} isSelected={false} />
      </svg>
    );
    expect(screen.getByText("Wallumbilla Hub (WAL)")).toBeInTheDocument();
  });
});
