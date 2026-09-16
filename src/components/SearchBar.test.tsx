import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("calls onChange with the typed value", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "moomba" } });
    expect(onChange).toHaveBeenCalledWith("moomba");
  });

  it("reflects the current value", () => {
    render(<SearchBar value="wallumbilla" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/search/i)).toHaveValue("wallumbilla");
  });
});
