import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OperatorFilter } from "./OperatorFilter";

describe("OperatorFilter", () => {
  it("renders an All chip plus one chip per operator", () => {
    render(<OperatorFilter operators={["APA Group", "Jemena"]} active={null} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "APA Group" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jemena" })).toBeInTheDocument();
  });

  it("calls onChange with the operator name when a chip is clicked", () => {
    const onChange = vi.fn();
    render(<OperatorFilter operators={["APA Group", "Jemena"]} active={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Jemena" }));
    expect(onChange).toHaveBeenCalledWith("Jemena");
  });

  it("clicking the already-active operator clears the filter", () => {
    const onChange = vi.fn();
    render(<OperatorFilter operators={["APA Group"]} active="APA Group" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "APA Group" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("renders nothing when there are no operators", () => {
    const { container } = render(<OperatorFilter operators={[]} active={null} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
