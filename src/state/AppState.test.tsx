import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AppStateProvider, useAppState } from "./AppState";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

describe("useAppState", () => {
  it("defaults to no selection and no operator filter", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    expect(result.current.selection).toBeNull();
    expect(result.current.operatorFilter).toBeNull();
  });

  it("setOperatorFilter sets and clears the spotlighted operator", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    act(() => result.current.setOperatorFilter("Jemena"));
    expect(result.current.operatorFilter).toBe("Jemena");
    act(() => result.current.setOperatorFilter(null));
    expect(result.current.operatorFilter).toBeNull();
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
