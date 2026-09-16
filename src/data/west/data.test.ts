import { describe, it, expect } from "vitest";
import nodes from "./nodes.json";
import pipelines from "./pipelines.json";

describe("west region data integrity", () => {
  const nodeIds = new Set(nodes.map((n: { id: string }) => n.id));

  it("has nodes and pipelines", () => {
    expect(nodes.length).toBeGreaterThan(0);
    expect(pipelines.length).toBeGreaterThan(0);
  });

  it("has no duplicate node ids", () => {
    expect(nodeIds.size).toBe(nodes.length);
  });

  it("every pipeline path id resolves to a real node id", () => {
    for (const pipeline of pipelines as { id: string; path: string[] }[]) {
      for (const nodeId of pipeline.path) {
        expect(nodeIds.has(nodeId)).toBe(true);
      }
    }
  });

  it("has no duplicate pipeline ids", () => {
    const ids = new Set(pipelines.map((p: { id: string }) => p.id));
    expect(ids.size).toBe(pipelines.length);
  });
});
