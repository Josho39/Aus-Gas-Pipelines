import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "pipeline-map-theme";

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    // localStorage can be unavailable (private browsing, quota, disabled
    // storage, or a test environment without a real Storage backend), fall
    // through to the system-preference default rather than crashing.
    return null;
  }
}

function writeStoredTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Non-fatal, the toggle still works for the rest of the session, it
    // just won't be remembered on the next visit.
  }
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = readStoredTheme();
  if (stored) return stored;
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches ?? false;
  return prefersLight ? "light" : "dark";
}

/** Reads/writes the `data-theme` attribute on <html> and persists the
 * choice, so CSS variables in index.css (and every component built on
 * the ink/panel/line/fg tokens) repaint automatically. */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStoredTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
