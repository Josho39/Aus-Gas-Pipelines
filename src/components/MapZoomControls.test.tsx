import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TransformWrapper } from "react-zoom-pan-pinch";
import { MapZoomControls } from "./MapZoomControls";

function renderControls() {
  return render(
    <TransformWrapper>
      <MapZoomControls />
    </TransformWrapper>
  );
}

describe("MapZoomControls", () => {
  it("renders zoom in, zoom out and reset buttons", () => {
    renderControls();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset view" })).toBeInTheDocument();
  });

  it("does not throw when each control is clicked", () => {
    renderControls();
    expect(() => fireEvent.click(screen.getByRole("button", { name: "Zoom in" }))).not.toThrow();
    expect(() => fireEvent.click(screen.getByRole("button", { name: "Zoom out" }))).not.toThrow();
    expect(() => fireEvent.click(screen.getByRole("button", { name: "Reset view" }))).not.toThrow();
  });
});
