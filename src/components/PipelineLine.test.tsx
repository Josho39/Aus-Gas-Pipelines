import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PipelineLine } from "./PipelineLine";
import { PIPELINE_COLORS } from "../lib/colors";
import type { Pipeline } from "../types";

const pipeline: Pipeline = {
  id: "swqp",
  code: "SWQP",
  name: "South West Queensland Pipeline",
  region: "east",
  path: ["ballera", "wallumbilla"],
  description: "test",
  style: { color: "teal" },
};

describe("PipelineLine", () => {
  it("renders an svg polyline with the pipeline's color", () => {
    render(
      <svg>
        <PipelineLine pipeline={pipeline} points={[{ x: 0, y: 0 }, { x: 10, y: 10 }]} onClick={() => {}} isSelected={false} />
      </svg>
    );
    const line = screen.getByTestId("pipeline-swqp");
    expect(line).toHaveAttribute("stroke", PIPELINE_COLORS.teal);
  });

  it("calls onClick with the pipeline id when clicked", () => {
    const onClick = vi.fn();
    render(
      <svg>
        <PipelineLine pipeline={pipeline} points={[{ x: 0, y: 0 }, { x: 10, y: 10 }]} onClick={onClick} isSelected={false} />
      </svg>
    );
    fireEvent.click(screen.getByTestId("pipeline-swqp"));
    expect(onClick).toHaveBeenCalledWith("swqp");
  });
});
