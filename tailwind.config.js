/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        panel: "#111a2e",
        line: "#1c2a45",
        teal: "#2dd4bf",
        amber: "#f59e0b",
        violet: "#a78bfa",
        slateline: "#64748b",
      },
    },
  },
  plugins: [],
};
