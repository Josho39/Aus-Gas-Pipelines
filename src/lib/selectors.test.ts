import { describe, it, expect } from "vitest";
import { getNodeById, getConnectedPipelines, getConnectedNodes } from "./selectors";
import nodes from "../data/east/nodes.json";
import pipelines from "../data/east/pipelines.json";
import type { PipelineNode, Pipeline } from "../types";

const typedNodes = nodes as PipelineNode[];
const typedPipelines = pipelines as Pipeline[];

describe("selectors", () => {
  it("getNodeById finds a node by id", () => {
    const node = getNodeById(typedNodes, "wallumbilla");
    expect(node?.name).toBe("Wallumbilla Hub (WAL)");
  });

  it("getNodeById returns undefined for an unknown id", () => {
    expect(getNodeById(typedNodes, "not-a-real-id")).toBeUndefined();
  });

  it("getConnectedPipelines finds every pipeline touching a node", () => {
    const connected = getConnectedPipelines("wallumbilla", typedPipelines);
    const ids = connected.map((p) => p.id).sort();
    expect(ids).toEqual(
      ["ppl134", "ppl90", "berwyndale-lateral", "talinga-lateral", "wallumbilla-hp-link", "wallumbilla-lp-link"].sort()
    );
  });

  it("getConnectedNodes resolves a pipeline's path to node objects", () => {
    const swqp = typedPipelines.find((p) => p.id === "swqp")!;
    const connected = getConnectedNodes(swqp, typedNodes);
    expect(connected.map((n) => n.id)).toEqual(["ballera", "cheepie", "gooimbah", "wallumbilla-hp"]);
  });
});
