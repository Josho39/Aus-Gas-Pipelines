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
  it("defaults to the East Coast map and shows an east node", () => {
    renderApp();
    expect(screen.getByTestId("node-wallumbilla")).toBeInTheDocument();
  });

  it("switches to the West Coast map and shows a west node", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: /west coast/i }));
    expect(screen.getByTestId("node-dampier")).toBeInTheDocument();
  });

  it("opens the detail panel when a node is clicked", () => {
    renderApp();
    fireEvent.click(screen.getByTestId("node-wallumbilla"));
    expect(screen.getByText(/Major Queensland gas trading hub/)).toBeInTheDocument();
  });

  it("switches to the FY26 Contracts tab", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: /fy26 contracts/i }));
    expect(screen.getByText("Woodside GSA")).toBeInTheDocument();
  });
});
