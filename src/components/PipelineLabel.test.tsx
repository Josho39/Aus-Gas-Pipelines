import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PipelineLabel } from "./PipelineLabel";
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

describe("PipelineLabel", () => {
  it("renders the pipeline's code as text", () => {
    render(
      <svg>
        <PipelineLabel pipeline={pipeline} points={[{ x: 0, y: 0 }, { x: 100, y: 0 }]} onClick={() => {}} />
      </svg>
    );
    expect(screen.getByText("SWQP")).toBeInTheDocument();
  });

  it("calls onClick with the pipeline id when clicked", () => {
    const onClick = vi.fn();
    render(
      <svg>
        <PipelineLabel pipeline={pipeline} points={[{ x: 0, y: 0 }, { x: 100, y: 0 }]} onClick={onClick} />
      </svg>
    );
    fireEvent.click(screen.getByTestId("pipeline-label-swqp"));
    expect(onClick).toHaveBeenCalledWith("swqp");
  });

  it("pins the label to the side of the line the pipeline asks for", () => {
    // Which way the perpendicular offset points depends on the line's own
    // direction, so "below" has to be resolved against the placement rather
    // than baked into the sign of the offset. The leader line runs from the
    // anchor on the line (y1) out to the label (y2).
    const drop = (labelSide?: "above" | "below") => {
      const { container } = render(
        <svg>
          <PipelineLabel
            pipeline={{ ...pipeline, labelSide }}
            points={[{ x: 0, y: 0 }, { x: 100, y: 0 }]}
            onClick={() => {}}
          />
        </svg>
      );
      const leader = container.querySelector("line")!;
      return Number(leader.getAttribute("y2")) - Number(leader.getAttribute("y1"));
    };
    expect(drop("below")).toBeGreaterThan(0);
    expect(drop("above")).toBeLessThan(0);
  });

  it("fades when dimmed by an operator filter", () => {
    render(
      <svg>
        <PipelineLabel pipeline={pipeline} points={[{ x: 0, y: 0 }, { x: 100, y: 0 }]} onClick={() => {}} dimmed />
      </svg>
    );
    expect(screen.getByTestId("pipeline-label-swqp")).toHaveAttribute("opacity", "0.15");
  });
});
