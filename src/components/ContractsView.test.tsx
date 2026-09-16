import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContractsView } from "./ContractsView";
import contracts from "../data/contracts.json";
import type { ContractsData } from "../data/contracts";

describe("ContractsView", () => {
  it("renders Supply, Demand and CFD sections with real contract names", () => {
    render(<ContractsView data={contracts as ContractsData} search="" />);
    expect(screen.getByText("Supply")).toBeInTheDocument();
    expect(screen.getByText("Demand")).toBeInTheDocument();
    expect(screen.getByText("CFDs")).toBeInTheDocument();
    expect(screen.getByText("Woodside GSA")).toBeInTheDocument();
    expect(screen.getByText("Arrow GSA (ongoing)")).toBeInTheDocument();
  });

  it("filters rows by the search query", () => {
    render(<ContractsView data={contracts as ContractsData} search="woodside" />);
    expect(screen.getByText("Woodside GSA")).toBeInTheDocument();
    expect(screen.queryByText("Arrow GSA (ongoing)")).not.toBeInTheDocument();
  });
});
