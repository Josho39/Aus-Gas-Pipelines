import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";
import { AppStateProvider } from "./state/AppState";

function renderApp() {
  return render(
    <AppStateProvider>
      <App />
    </AppStateProvider>
  );
}

describe("App", () => {
  it("shows the whole-of-Australia map by default, with nodes from both regions", () => {
    renderApp();
    expect(screen.getByTestId("node-wallumbilla")).toBeInTheDocument();
    expect(screen.getByTestId("node-dampier")).toBeInTheDocument();
  });

  it("opens the detail panel when a node is clicked", () => {
    renderApp();
    fireEvent.click(screen.getByTestId("node-wallumbilla"));
    expect(screen.getByText(/Major Queensland gas trading hub/)).toBeInTheDocument();
  });

  it("shows operator chips and dims non-matching pipelines when one is spotlighted", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Jemena" }));
    const egpLine = screen.getByTestId("pipeline-egp");
    const swqpLine = screen.getByTestId("pipeline-swqp");
    expect(egpLine.closest("g")).toHaveAttribute("opacity", "1");
    expect(swqpLine.closest("g")).toHaveAttribute("opacity", "0.15");
  });

  it("toggles the legend/operator panel", () => {
    renderApp();
    expect(screen.getByText("Spotlight an operator")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /hide panel/i }));
    expect(screen.queryByText("Spotlight an operator")).not.toBeInTheDocument();
  });
});
