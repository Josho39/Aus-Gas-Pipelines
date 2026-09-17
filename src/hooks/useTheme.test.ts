import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useTheme } from "./useTheme";

// This test environment's jsdom doesn't provide a working Storage backend
// for window.localStorage (getItem/setItem aren't real functions here),
// which is exactly the kind of "storage unavailable" case useTheme is
// written to tolerate in production too (private browsing, quota, etc.).
// Stub in a real in-memory Storage so these tests exercise the hook's
// actual read/write behavior rather than just its fallback path.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: createMemoryStorage(),
    configurable: true,
  });
  document.documentElement.removeAttribute("data-theme");
});

describe("useTheme", () => {
  it("defaults to dark when nothing is stored and no light preference", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggleTheme flips between dark and light and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("pipeline-map-theme")).toBe("light");

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("reads a previously stored theme on mount", () => {
    window.localStorage.setItem("pipeline-map-theme", "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });
});
