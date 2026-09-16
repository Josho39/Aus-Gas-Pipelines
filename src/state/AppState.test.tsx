import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AppStateProvider, useAppState } from "./AppState";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

describe("useAppState", () => {
  it("defaults to east region, schematic view, no selection", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    expect(result.current.region).toBe("east");
    expect(result.current.view).toBe("schematic");
    expect(result.current.selection).toBeNull();
  });

  it("setRegion switches region and clears selection", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    act(() => result.current.select({ kind: "node", id: "wallumbilla" }));
    act(() => result.current.setRegion("west"));
    expect(result.current.region).toBe("west");
    expect(result.current.selection).toBeNull();
  });

  it("select and clearSelection manage the selection", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    act(() => result.current.select({ kind: "pipeline", id: "swqp" }));
    expect(result.current.selection).toEqual({ kind: "pipeline", id: "swqp" });
    act(() => result.current.clearSelection());
    expect(result.current.selection).toBeNull();
  });

  it("setSearch updates the search query", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    act(() => result.current.setSearch("moomba"));
    expect(result.current.search).toBe("moomba");
  });
});
