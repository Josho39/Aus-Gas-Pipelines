import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Region, Selection } from "../types";

interface AppStateValue {
  region: Region;
  selection: Selection;
  search: string;
  /** Operator name to spotlight on the map (e.g. "APA Group"), or null to
   * show every pipeline at full opacity. */
  operatorFilter: string | null;
  setRegion: (region: Region) => void;
  select: (selection: Selection) => void;
  clearSelection: () => void;
  setSearch: (query: string) => void;
  setOperatorFilter: (operator: string | null) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>("east");
  const [selection, setSelection] = useState<Selection>(null);
  const [search, setSearch] = useState("");
  const [operatorFilter, setOperatorFilter] = useState<string | null>(null);

  const value = useMemo<AppStateValue>(
    () => ({
      region,
      selection,
      search,
      operatorFilter,
      setRegion: (next) => {
        setRegionState(next);
        setSelection(null);
        setOperatorFilter(null);
      },
      select: setSelection,
      clearSelection: () => setSelection(null),
      setSearch,
      setOperatorFilter,
    }),
    [region, selection, search, operatorFilter]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
