/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // App chrome — these flip between light/dark via CSS variables
        // (see index.css), so every component using them re-themes
        // automatically. The map canvas itself stays a fixed dark
        // "ops dashboard" surface regardless of theme (see GeoMap) —
        // a deliberate choice, not an oversight.
        ink: "var(--color-ink)",
        panel: "var(--color-panel)",
        line: "var(--color-line)",
        fg: "var(--color-fg)",
        fgmuted: "var(--color-fg-muted)",
        // Accent/data colors — identical in both themes, used both by
        // UI chrome (buttons) and the map's pipeline/node coloring.
        teal: "#2dd4bf",
        amber: "#f59e0b",
        violet: "#a78bfa",
        slateline: "#64748b",
        // Fixed dark text for content that sits on an accent-colored
        // background (e.g. the active tab), independent of theme.
        onaccent: "#0b1220",
      },
    },
  },
  plugins: [],
};
