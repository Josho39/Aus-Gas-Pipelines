import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Region, Selection } from "../types";

export type ViewMode = "schematic" | "geo";

interface AppStateValue {
  region: Region;
  view: ViewMode;
  selection: Selection;
  search: string;
  setRegion: (region: Region) => void;
  setView: (view: ViewMode) => void;
  select: (selection: Selection) => void;
  clearSelection: () => void;
  setSearch: (query: string) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>("east");
  const [view, setView] = useState<ViewMode>("schematic");
  const [selection, setSelection] = useState<Selection>(null);
  const [search, setSearch] = useState("");

  const value = useMemo<AppStateValue>(
    () => ({
      region,
      view,
      selection,
      search,
      setRegion: (next) => {
        setRegionState(next);
        setSelection(null);
      },
      setView,
      select: setSelection,
      clearSelection: () => setSelection(null),
      setSearch,
    }),
    [region, view, selection, search]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
