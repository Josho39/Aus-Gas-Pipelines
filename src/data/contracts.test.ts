import { describe, it, expect } from "vitest";
import contracts from "./contracts.json";

describe("contracts data shape", () => {
  it("has supply, demand, cfds and quarterlyCapacity", () => {
    expect(Array.isArray(contracts.supply)).toBe(true);
    expect(Array.isArray(contracts.demand)).toBe(true);
    expect(Array.isArray(contracts.cfds.sell)).toBe(true);
    expect(Array.isArray(contracts.cfds.buy)).toBe(true);
    expect(Array.isArray(contracts.quarterlyCapacity)).toBe(true);
  });

  it("has no duplicate ids across supply and demand", () => {
    const ids = [...contracts.supply, ...contracts.demand].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every monthly schedule has 12 entries", () => {
    for (const row of [...contracts.supply, ...contracts.demand]) {
      if (row.monthly) {
        expect(row.monthly.length).toBe(12);
      }
    }
  });
});
