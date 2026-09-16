# East/West Coast Gas Pipeline Interactive Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive React site visualising the NEM (east coast) and WEM (west coast) gas pipeline networks as clickable schematic/geographic diagrams, plus a FY26 Contracts reference view, from `Gas1.xlsx`.

**Architecture:** Static Vite + React + TypeScript single-page app. Region/pipeline/node data ships as bundled JSON (hand-authored from the rendered Excel blueprints). Two toggleable map renderers (Schematic SVG using hand-placed coordinates, Geographic SVG using an equirectangular lat/lng projection) share the same data and the same `PipelineLine`/`NodeMarker` components. Click-to-read-more via a slide-in detail panel. A separate Contracts tab renders the FY26 Contracts data (extracted from pasted screenshot images in the sheet) as grouped tables.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Vitest + @testing-library/react + jsdom.

**Spec:** `docs/superpowers/specs/2026-09-16-pipeline-map-site-design.md`

## Global Constraints

- Static site only, no backend — all data ships as bundled JSON (spec: Architecture).
- Deploys as a Vite static build with no config changes needed for Vercel/Railway (spec: Architecture, Deployment).
- Node/pipeline data is hand-authored against the rendered blueprint (not parsed from raw Excel XML) (spec: Source Material Notes).
- Every `pipelines.json` entry's `path` ids must resolve to real `nodes.json` ids — verified by a test, not by inspection (spec: Testing).
- Dark, energy-ops-dashboard visual theme (spec: Visual Style).
- No user accounts, no live data feeds, no in-UI data editing (spec: Out of Scope v1).
- Contract figures below are transcribed directly from the source images in `xl/media/image2.png`–`image10.png` (read at full resolution) — do not "correct" or round them; they are real commercial data.

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/setupTests.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: a working `npm run dev` / `npm run build` / `npm run test` toolchain every later task relies on.

- [ ] **Step 1: Scaffold Vite React-TS project**

Run: `npm create vite@latest . -- --template react-ts` in the repo root (accept overwrite prompts only for files Vite generates; keep `Gas1.xlsx`, `docs/`, `reference/`, `.gitignore`, `.git`).

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
npm install -D tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui
npm install framer-motion react-zoom-pan-pinch
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

`tailwind.config.js`:
```js
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
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
}

body {
  background-color: #0b1220;
  color: #e2e8f0;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
```

- [ ] **Step 4: Configure Vitest**

Add to `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
  },
});
```

`src/setupTests.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 5: Write minimal App and failing test**

`src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <h1 className="p-4 text-xl font-semibold">Gas Pipeline Network</h1>
    </div>
  );
}
```

`src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the page title", () => {
    render(<App />);
    expect(screen.getByText("Gas Pipeline Network")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test`
Expected: PASS (1 test)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite/React/TS/Tailwind/Vitest project"
```

---

## Task 2: Shared Types and Geo Projection Utility

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/geoProject.ts`
- Test: `src/lib/geoProject.test.ts`

**Interfaces:**
- Produces: `PipelineNode`, `Pipeline`, `Region`, `NodeType`, `PipelineColor` types (used by every data/component task); `projectGeo(lat, lng, width, height, bounds?)` (used by the Geographic map task).

- [ ] **Step 1: Write types**

`src/types.ts`:
```ts
export type Region = "east" | "west";

export type NodeType =
  | "hub"
  | "plant"
  | "compressor"
  | "sttm"
  | "lng"
  | "town";

export interface PipelineNode {
  id: string;
  name: string;
  type: NodeType;
  region: Region;
  schematicPos: { x: number; y: number };
  geoPos: { lat: number; lng: number };
  description: string;
}

export type PipelineColor = "teal" | "amber" | "purple" | "slate";

export interface Pipeline {
  id: string;
  code: string;
  name: string;
  region: Region;
  path: string[];
  description: string;
  operator?: string;
  lengthKm?: number;
  capacity?: string;
  style: { color: PipelineColor; dashed?: boolean };
}

export type Selection = { kind: "node" | "pipeline"; id: string } | null;
```

- [ ] **Step 2: Write failing test for geo projection**

`src/lib/geoProject.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { projectGeo, AUSTRALIA_BOUNDS } from "./geoProject";

describe("projectGeo", () => {
  it("maps the north-west corner of the bounds to (0,0)", () => {
    const p = projectGeo(AUSTRALIA_BOUNDS.maxLat, AUSTRALIA_BOUNDS.minLng, 1000, 800);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it("maps the south-east corner of the bounds to (width,height)", () => {
    const p = projectGeo(AUSTRALIA_BOUNDS.minLat, AUSTRALIA_BOUNDS.maxLng, 1000, 800);
    expect(p.x).toBeCloseTo(1000);
    expect(p.y).toBeCloseTo(800);
  });

  it("maps the centre of the bounds to the centre of the canvas", () => {
    const midLat = (AUSTRALIA_BOUNDS.minLat + AUSTRALIA_BOUNDS.maxLat) / 2;
    const midLng = (AUSTRALIA_BOUNDS.minLng + AUSTRALIA_BOUNDS.maxLng) / 2;
    const p = projectGeo(midLat, midLng, 1000, 800);
    expect(p.x).toBeCloseTo(500);
    expect(p.y).toBeCloseTo(400);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- geoProject`
Expected: FAIL with "Cannot find module './geoProject'"

- [ ] **Step 4: Implement geoProject**

`src/lib/geoProject.ts`:
```ts
export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const AUSTRALIA_BOUNDS: GeoBounds = {
  minLat: -44,
  maxLat: -10,
  minLng: 112,
  maxLng: 154,
};

export function projectGeo(
  lat: number,
  lng: number,
  width: number,
  height: number,
  bounds: GeoBounds = AUSTRALIA_BOUNDS
): { x: number; y: number } {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height;
  return { x, y };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- geoProject`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/lib/geoProject.ts src/lib/geoProject.test.ts
git commit -m "feat: add shared types and geo projection utility"
```

---

## Task 3: East Coast (NEM) Region Data

**Files:**
- Create: `src/data/east/nodes.json`
- Create: `src/data/east/pipelines.json`
- Test: `src/data/east/data.test.ts`

**Interfaces:**
- Consumes: `PipelineNode`, `Pipeline` shapes from Task 2 (informal — JSON, not imported as TS types, but must satisfy them).
- Produces: `nodes.json` (46 nodes) and `pipelines.json` (13 pipelines) for `region: "east"`, consumed by the map/detail-panel tasks.

Data hand-authored from `reference/blueprint/east-map.pdf` (rendered from the `East MAP` sheet of `Gas1.xlsx`). Schematic coordinates follow the source diagram's layout; geographic coordinates are approximate real-world locations. Pipeline descriptions are general/public-domain context (route, operator, purpose) — no commercial figures.

- [ ] **Step 1: Write `src/data/east/nodes.json`**

```json
[
  { "id": "moomba-plant", "name": "Moomba Gas Plant", "type": "plant", "region": "east", "schematicPos": { "x": 40, "y": 1195 }, "geoPos": { "lat": -28.096, "lng": 140.194 }, "description": "Santos-operated gas processing plant in the Cooper Basin, South Australia — the primary source of gas feeding the Moomba hub and the SWQP, MSP and MAP pipelines." },
  { "id": "moomba-hub", "name": "Moomba Compression Facility (MCF)", "type": "hub", "region": "east", "schematicPos": { "x": 287, "y": 1150 }, "geoPos": { "lat": -28.10, "lng": 140.20 }, "description": "Central compression and metering facility at Moomba linking Cooper Basin gas fields to the South West Queensland (SWQP), Moomba-Sydney (MSP) and Moomba-Adelaide (MAP) pipelines via its Low Pressure (MLP) and High Pressure (MHP) points." },
  { "id": "ballera", "name": "Ballera", "type": "plant", "region": "east", "schematicPos": { "x": 289, "y": 854 }, "geoPos": { "lat": -27.40, "lng": 141.78 }, "description": "Ballera processing and compressor facility in the Cooper Basin, Queensland — the western origin point of the South West Queensland Pipeline (SWQP)." },
  { "id": "gooimbah", "name": "Gooimbah", "type": "hub", "region": "east", "schematicPos": { "x": 740, "y": 461 }, "geoPos": { "lat": -26.60, "lng": 149.90 }, "description": "Junction point on the South West Queensland Pipeline corridor, connecting through to the Queensland Gas Pipeline (QGP) and the Wallumbilla hub." },
  { "id": "rolleston", "name": "Rolleston", "type": "hub", "region": "east", "schematicPos": { "x": 744, "y": 302 }, "geoPos": { "lat": -24.48, "lng": 148.60 }, "description": "Compression/valve point on the Queensland Gas Pipeline north of Wallumbilla, near gas fields including Fairview and Yellowbank." },
  { "id": "yellowbank", "name": "Yellowbank", "type": "plant", "region": "east", "schematicPos": { "x": 595, "y": 365 }, "geoPos": { "lat": -24.50, "lng": 148.50 }, "description": "Upstream gas field supplying into the Rolleston junction on the Queensland Gas Pipeline." },
  { "id": "fairview", "name": "Fairview", "type": "plant", "region": "east", "schematicPos": { "x": 595, "y": 396 }, "geoPos": { "lat": -25.05, "lng": 150.28 }, "description": "Upstream coal seam gas field supplying into the Rolleston junction on the Queensland Gas Pipeline." },
  { "id": "banana", "name": "Banana", "type": "hub", "region": "east", "schematicPos": { "x": 798, "y": 197 }, "geoPos": { "lat": -24.48, "lng": 150.13 }, "description": "Junction on the Queensland Gas Pipeline connecting toward Rockhampton, Gladstone and Wide Bay, and on to the Curtis Island LNG projects." },
  { "id": "rockhampton", "name": "Rockhampton", "type": "town", "region": "east", "schematicPos": { "x": 1050, "y": 160 }, "geoPos": { "lat": -23.38, "lng": 150.51 }, "description": "Regional Queensland demand centre served off the Queensland Gas Pipeline via the Banana junction." },
  { "id": "gladstone", "name": "Gladstone", "type": "town", "region": "east", "schematicPos": { "x": 1050, "y": 190 }, "geoPos": { "lat": -23.84, "lng": 151.26 }, "description": "Industrial port city and home to the Curtis Island LNG export precinct, served off the Queensland Gas Pipeline." },
  { "id": "widebay", "name": "Wide Bay", "type": "town", "region": "east", "schematicPos": { "x": 1050, "y": 222 }, "geoPos": { "lat": -25.90, "lng": 152.50 }, "description": "Regional demand centre served off the Queensland Gas Pipeline via the Banana junction." },
  { "id": "glng", "name": "GLNG (Curtis Island)", "type": "lng", "region": "east", "schematicPos": { "x": 985, "y": 30 }, "geoPos": { "lat": -23.82, "lng": 151.28 }, "description": "Santos-operated LNG export facility on Curtis Island, sourcing coal seam gas from the Roma/Fairview fields via the Queensland Gas Pipeline network." },
  { "id": "wallumbilla", "name": "Wallumbilla Hub (WAL)", "type": "hub", "region": "east", "schematicPos": { "x": 829, "y": 744 }, "geoPos": { "lat": -26.57, "lng": 149.15 }, "description": "Major Queensland gas trading hub where the SWQP, QGP and RBP pipelines meet, with High Pressure (HP) and Low Pressure (LP) trading points." },
  { "id": "aplng", "name": "APLNG (Curtis Island)", "type": "lng", "region": "east", "schematicPos": { "x": 1414, "y": 362 }, "geoPos": { "lat": -23.82, "lng": 151.29 }, "description": "Origin/ConocoPhillips-operated LNG export facility on Curtis Island, connected into the Wallumbilla network via the PPL 134 lateral." },
  { "id": "qgc", "name": "QGC (Curtis Island)", "type": "lng", "region": "east", "schematicPos": { "x": 1637, "y": 130 }, "geoPos": { "lat": -23.82, "lng": 151.30 }, "description": "Shell-operated (QGC) LNG export facility on Curtis Island, connected into the Wallumbilla/Ellengrove network via the PPL 133 lateral." },
  { "id": "condamine", "name": "Condamine", "type": "plant", "region": "east", "schematicPos": { "x": 1305, "y": 828 }, "geoPos": { "lat": -26.85, "lng": 150.10 }, "description": "Coal seam gas field feeding into the Windibri junction on the Roma Brisbane Pipeline (RBP)." },
  { "id": "windibri", "name": "Windibri", "type": "hub", "region": "east", "schematicPos": { "x": 1305, "y": 858 }, "geoPos": { "lat": -27.00, "lng": 150.50 }, "description": "Junction on the Roma Brisbane Pipeline (RBP) linking QGC-owned gathering infrastructure and the Braemar power station laterals into the main RBP corridor." },
  { "id": "scotia", "name": "Scotia", "type": "plant", "region": "east", "schematicPos": { "x": 1266, "y": 704 }, "geoPos": { "lat": -26.70, "lng": 150.20 }, "description": "Upstream gas field in the Surat Basin feeding the Wallumbilla hub area." },
  { "id": "berwyndale", "name": "Berwyndale", "type": "plant", "region": "east", "schematicPos": { "x": 1355, "y": 698 }, "geoPos": { "lat": -26.60, "lng": 150.40 }, "description": "Upstream coal seam gas field in the Surat Basin feeding the Wallumbilla hub area." },
  { "id": "talinga", "name": "Talinga", "type": "plant", "region": "east", "schematicPos": { "x": 1440, "y": 697 }, "geoPos": { "lat": -26.90, "lng": 150.60 }, "description": "Upstream coal seam gas field in the Surat Basin feeding the Wallumbilla hub area." },
  { "id": "argyle", "name": "Argyle", "type": "hub", "region": "east", "schematicPos": { "x": 1432, "y": 858 }, "geoPos": { "lat": -27.00, "lng": 150.80 }, "description": "Compression point on the Roma Brisbane Pipeline between Windibri and Dalby." },
  { "id": "dalby", "name": "Dalby", "type": "town", "region": "east", "schematicPos": { "x": 1487, "y": 858 }, "geoPos": { "lat": -27.18, "lng": 151.26 }, "description": "Regional Queensland demand centre on the Roma Brisbane Pipeline." },
  { "id": "oakey", "name": "Oakey", "type": "town", "region": "east", "schematicPos": { "x": 1552, "y": 858 }, "geoPos": { "lat": -27.43, "lng": 151.72 }, "description": "Regional Queensland demand centre on the Roma Brisbane Pipeline, near the Oakey compressor station." },
  { "id": "braemar", "name": "Braemar Power Station Laterals", "type": "plant", "region": "east", "schematicPos": { "x": 1382, "y": 912 }, "geoPos": { "lat": -27.35, "lng": 151.40 }, "description": "Laterals off the Windibri junction supplying the Braemar 1 and Braemar 2 gas-fired power stations, and the Tipton delivery point." },
  { "id": "ellengrove", "name": "Ellengrove", "type": "hub", "region": "east", "schematicPos": { "x": 1697, "y": 858 }, "geoPos": { "lat": -27.50, "lng": 152.50 }, "description": "Junction near Brisbane connecting the Roma Brisbane Pipeline and the QGC lateral (PPL 133) into the Brisbane STTM." },
  { "id": "bri-sttm", "name": "Brisbane STTM", "type": "sttm", "region": "east", "schematicPos": { "x": 1742, "y": 858 }, "geoPos": { "lat": -27.47, "lng": 153.03 }, "description": "Short Term Trading Market hub for Brisbane, the eastern terminus of the Roma Brisbane Pipeline (RBP)." },
  { "id": "toowoomba", "name": "Toowoomba", "type": "town", "region": "east", "schematicPos": { "x": 1645, "y": 995 }, "geoPos": { "lat": -27.56, "lng": 151.95 }, "description": "Regional demand centre served off the Roma Brisbane Pipeline network (non-hub delivery point)." },
  { "id": "bella-park", "name": "Bella Park CS", "type": "compressor", "region": "east", "schematicPos": { "x": 440, "y": 1178 }, "geoPos": { "lat": -27.90, "lng": 151.90 }, "description": "Compressor station on the Moomba Sydney Pipeline (MSP) shortly after the Moomba MSP inlet." },
  { "id": "wilton", "name": "Wilton", "type": "compressor", "region": "east", "schematicPos": { "x": 1343, "y": 1178 }, "geoPos": { "lat": -34.24, "lng": 150.65 }, "description": "Compressor station on the Moomba Sydney Pipeline (MSP) near its Sydney end, also a delivery point referenced in gas trading contracts." },
  { "id": "young", "name": "Young", "type": "hub", "region": "east", "schematicPos": { "x": 1209, "y": 1182 }, "geoPos": { "lat": -34.31, "lng": 148.30 }, "description": "Junction on the Moomba Sydney Pipeline (MSP) in central NSW." },
  { "id": "syd-sttm", "name": "Sydney STTM", "type": "sttm", "region": "east", "schematicPos": { "x": 1404, "y": 1200 }, "geoPos": { "lat": -33.87, "lng": 151.21 }, "description": "Short Term Trading Market hub for Sydney, fed by both the Moomba Sydney Pipeline (MSP) and the Eastern Gas Pipeline (EGP)." },
  { "id": "horsley-park", "name": "Horsley Park", "type": "hub", "region": "east", "schematicPos": { "x": 1465, "y": 1234 }, "geoPos": { "lat": -33.83, "lng": 150.90 }, "description": "Sydney-area distribution hub connected to the Eastern Gas Pipeline (EGP)." },
  { "id": "act", "name": "ACT (Canberra)", "type": "town", "region": "east", "schematicPos": { "x": 1297, "y": 1354 }, "geoPos": { "lat": -35.28, "lng": 149.13 }, "description": "Canberra-area demand centre served off the Eastern Gas Pipeline network via Hoskinstown." },
  { "id": "hoskinstown", "name": "Hoskinstown", "type": "hub", "region": "east", "schematicPos": { "x": 1447, "y": 1354 }, "geoPos": { "lat": -35.47, "lng": 149.42 }, "description": "Junction on the Eastern Gas Pipeline (EGP) serving the Canberra (ACT) lateral." },
  { "id": "culcairn", "name": "Culcairn", "type": "compressor", "region": "east", "schematicPos": { "x": 1168, "y": 1424 }, "geoPos": { "lat": -35.66, "lng": 147.04 }, "description": "Compressor station at the Victoria-NSW interconnect, linking the Victorian gas network to the NSW network." },
  { "id": "cooma", "name": "Cooma", "type": "town", "region": "east", "schematicPos": { "x": 1443, "y": 1451 }, "geoPos": { "lat": -36.24, "lng": 149.13 }, "description": "Southern NSW town on the Eastern Gas Pipeline (EGP) route between Victoria and Sydney." },
  { "id": "bombala", "name": "Bombala", "type": "town", "region": "east", "schematicPos": { "x": 1443, "y": 1543 }, "geoPos": { "lat": -36.91, "lng": 149.23 }, "description": "Southern NSW town on the Eastern Gas Pipeline (EGP) route, close to the Victorian border." },
  { "id": "orbost", "name": "Orbost", "type": "hub", "region": "east", "schematicPos": { "x": 1436, "y": 1611 }, "geoPos": { "lat": -37.70, "lng": 148.45 }, "description": "East Gippsland junction where the Eastern Gas Pipeline (EGP) begins its run from Longford toward NSW." },
  { "id": "wollert-cs", "name": "Wollert CS", "type": "compressor", "region": "east", "schematicPos": { "x": 1166, "y": 1667 }, "geoPos": { "lat": -37.55, "lng": 145.02 }, "description": "Compressor station north of Melbourne on the Victoria-NSW interconnect corridor." },
  { "id": "eurora-cs", "name": "Eurora CS", "type": "compressor", "region": "east", "schematicPos": { "x": 1163, "y": 1611 }, "geoPos": { "lat": -36.40, "lng": 146.00 }, "description": "Compressor station on the Victoria-NSW interconnect corridor between Wollert and Culcairn." },
  { "id": "springhurst-cs", "name": "Springhurst CS", "type": "compressor", "region": "east", "schematicPos": { "x": 1157, "y": 1554 }, "geoPos": { "lat": -36.40, "lng": 146.55 }, "description": "Compressor station on the Victoria-NSW interconnect corridor near the NSW border." },
  { "id": "melbourne", "name": "Melbourne Hub", "type": "hub", "region": "east", "schematicPos": { "x": 1206, "y": 1852 }, "geoPos": { "lat": -37.81, "lng": 144.96 }, "description": "Melbourne demand and distribution hub, fed by the Longford gas plant and the SEA Gas/Iona system." },
  { "id": "longford", "name": "Longford Gas Plant", "type": "plant", "region": "east", "schematicPos": { "x": 1408, "y": 1852 }, "geoPos": { "lat": -38.20, "lng": 147.09 }, "description": "ExxonMobil/Esso-Woodside operated gas processing plant in the Gippsland Basin, Victoria — the principal source for the Eastern Gas Pipeline (EGP), Tasmanian Gas Pipeline (TGP) and the Melbourne network (GNP)." },
  { "id": "iona", "name": "Iona Underground Storage", "type": "plant", "region": "east", "schematicPos": { "x": 864, "y": 1930 }, "geoPos": { "lat": -38.62, "lng": 142.87 }, "description": "Underground gas storage facility near Port Campbell, western Victoria, and connection point for Otway Basin production feeding the SEA Gas Pipeline (PCA) and Melbourne." },
  { "id": "adl-sttm", "name": "Adelaide STTM", "type": "sttm", "region": "east", "schematicPos": { "x": 289, "y": 1953 }, "geoPos": { "lat": -34.93, "lng": 138.60 }, "description": "Short Term Trading Market hub for Adelaide, fed by the Moomba Adelaide Pipeline (MAP) and the SEA Gas Pipeline (PCA) from Victoria." },
  { "id": "bell-bay", "name": "Bell Bay (Tasmania)", "type": "town", "region": "east", "schematicPos": { "x": 1500, "y": 1980 }, "geoPos": { "lat": -41.15, "lng": 146.87 }, "description": "Tasmanian receiving point for the Tasmanian Gas Pipeline (TGP), which runs under Bass Strait from Longford." }
]
```

- [ ] **Step 2: Write `src/data/east/pipelines.json`**

```json
[
  { "id": "swqp", "code": "SWQP", "name": "South West Queensland Pipeline", "region": "east", "path": ["ballera", "gooimbah", "wallumbilla"], "description": "Carries Cooper Basin gas from Ballera east to the Wallumbilla hub — historically the main link between Cooper Basin (SA/QLD) supply and the Queensland east coast market.", "operator": "APA Group", "lengthKm": 813, "capacity": "~130 TJ/day", "style": { "color": "teal" } },
  { "id": "qgp", "code": "QGP", "name": "Queensland Gas Pipeline", "region": "east", "path": ["gooimbah", "rolleston", "banana", "glng"], "description": "Runs north from the Wallumbilla area through Rolleston and Banana to the Gladstone/Curtis Island LNG precinct.", "operator": "APA Group", "lengthKm": 627, "style": { "color": "teal" } },
  { "id": "rbp", "code": "RBP", "name": "Roma Brisbane Pipeline", "region": "east", "path": ["wallumbilla", "condamine", "windibri", "argyle", "dalby", "oakey", "ellengrove", "bri-sttm"], "description": "Delivers gas from the Wallumbilla hub east to Brisbane, passing through Dalby and Oakey — the primary supply route for South East Queensland.", "operator": "APA Group", "lengthKm": 438, "style": { "color": "teal" } },
  { "id": "msp", "code": "MSP", "name": "Moomba Sydney Pipeline", "region": "east", "path": ["moomba-hub", "bella-park", "young", "wilton", "syd-sttm"], "description": "Carries Cooper Basin gas from Moomba to the Sydney market — one of the two original NEM east coast trunk lines.", "operator": "APA Group", "lengthKm": 1300, "style": { "color": "amber" } },
  { "id": "map", "code": "MAP", "name": "Moomba Adelaide Pipeline", "region": "east", "path": ["moomba-hub", "adl-sttm"], "description": "Carries Cooper Basin gas from Moomba south to Adelaide.", "operator": "APA Group", "lengthKm": 1176, "style": { "color": "amber" } },
  { "id": "egp", "code": "EGP", "name": "Eastern Gas Pipeline", "region": "east", "path": ["longford", "orbost", "bombala", "cooma", "hoskinstown", "act", "horsley-park", "syd-sttm"], "description": "Connects Gippsland Basin gas from Longford, Victoria, to Sydney, providing a second supply route into NSW independent of the Cooper Basin.", "operator": "APA Group", "lengthKm": 797, "style": { "color": "teal" } },
  { "id": "tgp", "code": "TGP", "name": "Tasmanian Gas Pipeline", "region": "east", "path": ["longford", "bell-bay"], "description": "Subsea pipeline carrying Gippsland Basin gas under Bass Strait from Longford to Bell Bay, Tasmania — Tasmania's only mainland gas connection.", "operator": "Tasmanian Gas Pipeline Pty Ltd", "lengthKm": 290, "style": { "color": "purple" } },
  { "id": "ppl90", "code": "PPL 90", "name": "Wallumbilla Lateral (PPL 90)", "region": "east", "path": ["wallumbilla", "gooimbah"], "description": "Pipeline licence lateral linking the Wallumbilla hub trading points into the SWQP/QGP corridor.", "style": { "color": "slate", "dashed": true } },
  { "id": "ppl133", "code": "PPL 133", "name": "QGC Lateral (PPL 133)", "region": "east", "path": ["ellengrove", "qgc"], "description": "Pipeline licence lateral connecting the QGC-operated Curtis Island LNG project into the Brisbane-area network.", "style": { "color": "purple", "dashed": true } },
  { "id": "ppl134", "code": "PPL 134", "name": "APLNG Lateral (PPL 134)", "region": "east", "path": ["wallumbilla", "aplng"], "description": "Pipeline licence lateral connecting the APLNG Curtis Island project into the Wallumbilla hub.", "style": { "color": "purple", "dashed": true } },
  { "id": "pca", "code": "PCA", "name": "SEA Gas Pipeline", "region": "east", "path": ["iona", "adl-sttm"], "description": "Carries gas from the Otway Basin (via Iona) in Victoria west to Adelaide, giving South Australia an alternative supply source to the Moomba Adelaide Pipeline.", "operator": "SEA Gas Pty Ltd", "lengthKm": 680, "style": { "color": "teal" } },
  { "id": "vic-nsw-interconnect", "code": "Vic-NSW", "name": "Victoria-NSW Interconnect", "region": "east", "path": ["wollert-cs", "eurora-cs", "springhurst-cs", "culcairn", "young"], "description": "Interconnects the Victorian and NSW/Sydney gas networks via a chain of compressor stations, allowing gas to flow either direction between the two markets.", "style": { "color": "amber", "dashed": true } },
  { "id": "swp", "code": "SWP", "name": "South West Pipeline (Otway–Melbourne)", "region": "east", "path": ["iona", "melbourne"], "description": "Delivers Otway Basin gas from the Iona storage/processing hub to the Melbourne network.", "style": { "color": "teal" } }
]
```

- [ ] **Step 3: Write failing data-integrity test**

`src/data/east/data.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import nodes from "./nodes.json";
import pipelines from "./pipelines.json";

describe("east region data integrity", () => {
  const nodeIds = new Set(nodes.map((n: { id: string }) => n.id));

  it("has nodes and pipelines", () => {
    expect(nodes.length).toBeGreaterThan(0);
    expect(pipelines.length).toBeGreaterThan(0);
  });

  it("has no duplicate node ids", () => {
    expect(nodeIds.size).toBe(nodes.length);
  });

  it("every pipeline path id resolves to a real node id", () => {
    for (const pipeline of pipelines as { id: string; path: string[] }[]) {
      for (const nodeId of pipeline.path) {
        expect(nodeIds.has(nodeId)).toBe(true);
      }
    }
  });

  it("has no duplicate pipeline ids", () => {
    const ids = new Set(pipelines.map((p: { id: string }) => p.id));
    expect(ids.size).toBe(pipelines.length);
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- data.test`
Expected: PASS (4 tests). If it fails on a missing node id, fix the typo in `pipelines.json` or `nodes.json` (not the test).

- [ ] **Step 5: Commit**

```bash
git add src/data/east
git commit -m "feat: add east coast (NEM) pipeline network data"
```

---

## Task 4: West Coast (WEM) Region Data

**Files:**
- Create: `src/data/west/nodes.json`
- Create: `src/data/west/pipelines.json`
- Test: `src/data/west/data.test.ts`

**Interfaces:**
- Consumes: `PipelineNode`, `Pipeline` shapes from Task 2.
- Produces: `nodes.json` (15 nodes) and `pipelines.json` (10 pipelines) for `region: "west"`.

Data hand-authored from `reference/blueprint/wa-map.pdf` (rendered from the `WA Map` sheet of `Gas1.xlsx`).

- [ ] **Step 1: Write `src/data/west/nodes.json`**

```json
[
  { "id": "tubridgi-wheatstone", "name": "Tubridgi / Wheatstone", "type": "plant", "region": "west", "schematicPos": { "x": 400, "y": 180 }, "geoPos": { "lat": -21.64, "lng": 115.12 }, "description": "Chevron-operated Wheatstone LNG and domestic gas plant near Onslow, WA — a supply point into the Dampier to Bunbury (DBP) and Pilbara pipeline network." },
  { "id": "gorgon", "name": "Gorgon (Barrow Island)", "type": "plant", "region": "west", "schematicPos": { "x": 430, "y": 120 }, "geoPos": { "lat": -20.83, "lng": 115.45 }, "description": "Chevron-operated Gorgon LNG and domestic gas plant on Barrow Island, connected into the Dampier hub area." },
  { "id": "dampier", "name": "Dampier Hub", "type": "hub", "region": "west", "schematicPos": { "x": 500, "y": 150 }, "geoPos": { "lat": -20.66, "lng": 116.71 }, "description": "Pilbara coastal hub where Woodside's North West Shelf gas processing connects into the Dampier to Bunbury Pipeline (DBP) and the Goldfields Gas Pipeline (GGP)." },
  { "id": "port-hedland", "name": "Port Hedland", "type": "town", "region": "west", "schematicPos": { "x": 550, "y": 150 }, "geoPos": { "lat": -20.31, "lng": 118.57 }, "description": "Pilbara port town served by the regional Pilbara Pipeline System, and the start of the Telfer Gas Pipeline." },
  { "id": "telfer", "name": "Telfer", "type": "plant", "region": "west", "schematicPos": { "x": 650, "y": 180 }, "geoPos": { "lat": -21.71, "lng": 122.22 }, "description": "Remote Pilbara gold/copper mine supplied by the Telfer Gas Pipeline from Port Hedland." },
  { "id": "newman", "name": "Newman", "type": "town", "region": "west", "schematicPos": { "x": 780, "y": 270 }, "geoPos": { "lat": -23.36, "lng": 119.73 }, "description": "Pilbara mining town and junction point on the Goldfields Gas Pipeline (GGP), also linked toward Kalgoorlie via the Northern Goldfields Interconnect." },
  { "id": "kalgoorlie", "name": "Kalgoorlie", "type": "town", "region": "west", "schematicPos": { "x": 780, "y": 480 }, "geoPos": { "lat": -30.75, "lng": 121.47 }, "description": "Goldfields mining hub, the southern terminus of the Goldfields Gas Pipeline (GGP) and origin of the Eastern Goldfields Pipeline System." },
  { "id": "kambalda", "name": "Kambalda", "type": "town", "region": "west", "schematicPos": { "x": 780, "y": 520 }, "geoPos": { "lat": -31.19, "lng": 121.65 }, "description": "Goldfields mining town south of Kalgoorlie, connected via the Kalgoorlie-Kambalda Pipeline and onward to Esperance." },
  { "id": "esperance", "name": "Esperance", "type": "town", "region": "west", "schematicPos": { "x": 780, "y": 620 }, "geoPos": { "lat": -33.86, "lng": 121.89 }, "description": "South coast WA port town, the terminus of the Eastern Goldfields Pipeline System and the Kambalda Esperance Gas Pipeline." },
  { "id": "windimurra", "name": "Windimurra", "type": "plant", "region": "west", "schematicPos": { "x": 590, "y": 470 }, "geoPos": { "lat": -27.80, "lng": 118.60 }, "description": "Mid West WA vanadium mine served by the Mid West Pipeline." },
  { "id": "geraldton", "name": "Geraldton", "type": "town", "region": "west", "schematicPos": { "x": 340, "y": 480 }, "geoPos": { "lat": -28.78, "lng": 114.61 }, "description": "Mid West WA coastal city, the western end of the Mid West Pipeline." },
  { "id": "msf", "name": "MSF", "type": "hub", "region": "west", "schematicPos": { "x": 430, "y": 530 }, "geoPos": { "lat": -28.00, "lng": 116.00 }, "description": "Metering/supply facility on the Dampier to Bunbury Pipeline (DBP) where the Mid West Pipeline and Parmelia Gas Pipeline (PGP) connect into the main trunk line." },
  { "id": "perth", "name": "Perth Hub", "type": "hub", "region": "west", "schematicPos": { "x": 400, "y": 650 }, "geoPos": { "lat": -31.95, "lng": 115.86 }, "description": "Perth metropolitan gas distribution hub (Metro North and Metro South zones), the largest demand centre on the WA gas network." },
  { "id": "waggerup-pinjarra", "name": "Waggerup & Pinjarra (DBP Connect)", "type": "plant", "region": "west", "schematicPos": { "x": 400, "y": 730 }, "geoPos": { "lat": -33.00, "lng": 115.85 }, "description": "Alcoa alumina refineries south of Perth connected directly into the Dampier to Bunbury Pipeline (DBP)." },
  { "id": "bunbury", "name": "Bunbury", "type": "town", "region": "west", "schematicPos": { "x": 400, "y": 760 }, "geoPos": { "lat": -33.33, "lng": 115.64 }, "description": "South-west WA port city, the southern terminus of the Dampier to Bunbury Pipeline (DBP)." }
]
```

- [ ] **Step 2: Write `src/data/west/pipelines.json`**

```json
[
  { "id": "dbp", "code": "DBP", "name": "Dampier to Bunbury Pipeline", "region": "west", "path": ["dampier", "msf", "perth", "waggerup-pinjarra", "bunbury"], "description": "WA's principal gas transmission trunk line, running from the North West Shelf at Dampier south through Perth to Bunbury.", "operator": "DBP (Brookfield Infrastructure)", "lengthKm": 1600, "style": { "color": "teal" } },
  { "id": "pgp", "code": "PGP", "name": "Parmelia Gas Pipeline", "region": "west", "path": ["msf", "perth"], "description": "Parallel trunk line into the Perth/Kwinana metro area, historically a separate line from the DBP, now operating as part of the integrated WA network.", "operator": "APA Group", "lengthKm": 401, "style": { "color": "amber" } },
  { "id": "ggp", "code": "GGP", "name": "Goldfields Gas Pipeline", "region": "west", "path": ["dampier", "newman", "kalgoorlie"], "description": "Carries Pilbara gas from Dampier south-east to the Goldfields mining region at Kalgoorlie.", "operator": "Goldfields Gas Transmission", "lengthKm": 1380, "style": { "color": "teal" } },
  { "id": "pilbara-pipeline-system", "code": "PPS", "name": "Pilbara Pipeline System", "region": "west", "path": ["dampier", "port-hedland"], "description": "Regional pipeline network distributing Pilbara gas between Dampier and Port Hedland.", "style": { "color": "slate", "dashed": true } },
  { "id": "telfer-gas-pipeline", "code": "TGP-WA", "name": "Telfer Gas Pipeline", "region": "west", "path": ["port-hedland", "telfer"], "description": "Lateral pipeline supplying the remote Telfer mine from the Pilbara network at Port Hedland.", "style": { "color": "slate", "dashed": true } },
  { "id": "mid-west-pipeline", "code": "MWP", "name": "Mid West Pipeline", "region": "west", "path": ["geraldton", "msf", "windimurra"], "description": "Connects Geraldton and the Windimurra vanadium mine into the Dampier to Bunbury Pipeline network.", "style": { "color": "amber" } },
  { "id": "eastern-goldfields-pipeline-system", "code": "EGPS", "name": "Eastern Goldfields Pipeline System", "region": "west", "path": ["kalgoorlie", "kambalda", "esperance"], "description": "Extends gas supply beyond the Goldfields Gas Pipeline terminus at Kalgoorlie south to Kambalda and Esperance.", "style": { "color": "teal" } },
  { "id": "northern-goldfields-interconnect", "code": "NGIP", "name": "Northern Goldfields Interconnect Pipeline", "region": "west", "path": ["newman", "kalgoorlie"], "description": "Interconnect linking the Goldfields Gas Pipeline near Newman directly through to Kalgoorlie.", "style": { "color": "purple", "dashed": true } },
  { "id": "kalgoorlie-kambalda-pipeline", "code": "KKP", "name": "Kalgoorlie-Kambalda Pipeline", "region": "west", "path": ["kalgoorlie", "kambalda"], "description": "Short lateral linking Kalgoorlie to the Kambalda mining area.", "style": { "color": "slate", "dashed": true } },
  { "id": "kambalda-esperance-gas-pipeline", "code": "KEGP", "name": "Kambalda Esperance Gas Pipeline", "region": "west", "path": ["kambalda", "esperance"], "description": "Extends supply from Kambalda south to the port of Esperance.", "style": { "color": "teal" } }
]
```

- [ ] **Step 3: Write failing data-integrity test**

`src/data/west/data.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import nodes from "./nodes.json";
import pipelines from "./pipelines.json";

describe("west region data integrity", () => {
  const nodeIds = new Set(nodes.map((n: { id: string }) => n.id));

  it("has nodes and pipelines", () => {
    expect(nodes.length).toBeGreaterThan(0);
    expect(pipelines.length).toBeGreaterThan(0);
  });

  it("has no duplicate node ids", () => {
    expect(nodeIds.size).toBe(nodes.length);
  });

  it("every pipeline path id resolves to a real node id", () => {
    for (const pipeline of pipelines as { id: string; path: string[] }[]) {
      for (const nodeId of pipeline.path) {
        expect(nodeIds.has(nodeId)).toBe(true);
      }
    }
  });

  it("has no duplicate pipeline ids", () => {
    const ids = new Set(pipelines.map((p: { id: string }) => p.id));
    expect(ids.size).toBe(pipelines.length);
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- data.test`
Expected: PASS (8 tests total across east + west)

- [ ] **Step 5: Commit**

```bash
git add src/data/west
git commit -m "feat: add west coast (WEM) pipeline network data"
```

---

## Task 5: FY26 Contracts Data

**Files:**
- Create: `src/data/contracts.ts` (types) and `src/data/contracts.json`
- Test: `src/data/contracts.test.ts`

**Interfaces:**
- Produces: `ContractRow`, `CfdRow`, `QuarterlyCapacity` types and `contracts.json` (`{ supply: ContractRow[], demand: ContractRow[], cfds: { sell: CfdRow[], buy: CfdRow[] }, quarterlyCapacity: QuarterlyCapacity[] }`), consumed by the Contracts view task.

Data transcribed directly from the 9 screenshot images embedded in the `FY26 Contracts` sheet (`xl/media/image2.png`–`image10.png` inside `Gas1.xlsx`, read at full resolution — the sheet has no real cells, only pasted images). Figures are real commercial data; do not alter them.

- [ ] **Step 1: Write `src/data/contracts.ts`**

```ts
export interface MonthlyValue {
  month: string;
  value: number;
}

export interface ContractRow {
  id: string;
  section: "VIC New" | "VIC Sales New" | "QLD" | "NSW/SA";
  kind: "supply" | "demand";
  contractName: string;
  startDate: string;
  endDate: string;
  acq?: string;
  mdq?: string;
  minDQ?: string;
  dcq?: string;
  topPercent?: string;
  deliveryPoints: string;
  nominations?: string;
  price: string;
  other?: string;
  monthly?: MonthlyValue[];
  totalAcq?: string;
}

export interface CfdRow {
  startDate: string;
  endDate: string;
  buySell: 1 | -1;
  strike: string;
  volumeGJ: number;
  tradeType: string;
  counterparty: string;
  status: string;
  marketRegion: string;
  productComponent: string;
  tradeDate: string;
  comments?: string;
}

export interface QuarterlyCapacity {
  period: string;
  sydBuyTJDay: number;
  vicSellTJDay: number;
}

export interface ContractsData {
  supply: ContractRow[];
  demand: ContractRow[];
  cfds: { sell: CfdRow[]; buy: CfdRow[] };
  quarterlyCapacity: QuarterlyCapacity[];
}
```

- [ ] **Step 2: Write `src/data/contracts.json`**

```json
{
  "supply": [
    { "id": "vic-supply-woodside-gsa", "section": "VIC New", "kind": "supply", "contractName": "Woodside GSA", "startDate": "2026-01-01", "endDate": "2026-12-31", "acq": "5.00 PJ", "mdq": "13.7 TJ", "minDQ": "50% MDQ", "dcq": "13.7 TJ", "topPercent": "95%", "deliveryPoints": "Longford (GNP); Longford (EGP)", "price": "$14.35 (2026$)", "other": "Firm (with PI)" },
    { "id": "vic-supply-kipper-mitsui", "section": "VIC New", "kind": "supply", "contractName": "Kipper (Mitsui)", "startDate": "2025-01-01", "endDate": "2026-02-28", "acq": "2.120 PJ", "mdq": "5 TJ", "minDQ": "5 TJ", "dcq": "5 TJ", "topPercent": "100%", "deliveryPoints": "Longford (GNP); Longford (EGP)", "price": "$14.9 (2025$) No CPI", "other": "Firm (with PI)" },
    { "id": "vic-supply-ea-tn18a", "section": "VIC New", "kind": "supply", "contractName": "EA TN18A (leg of time swap)", "startDate": "2026-01-01", "endDate": "2026-12-31", "acq": "1.095 PJ", "mdq": "3.0 TJ", "minDQ": "100% MDQ", "dcq": "1.095 TJ", "topPercent": "100%", "deliveryPoints": "Longford (EGP)", "price": "$14.00 (2026$)", "other": "Firm (PI with Gas Bank for 18B)" },
    { "id": "vic-supply-engie-tn1", "section": "VIC New", "kind": "supply", "contractName": "Engie TN1", "startDate": "2026-01-01", "endDate": "2026-12-31", "acq": "0.730 PJ", "mdq": "2.0 TJ", "minDQ": "100% MDQ", "dcq": "0.730 TJ", "topPercent": "100%", "deliveryPoints": "Longford (EGP); Longford GNP", "price": "$13.75 (2026$)", "other": "Firm (with PI)" },
    { "id": "vic-supply-esso-tn2026-01", "section": "VIC New", "kind": "supply", "contractName": "Esso transactions under MGSA — TN 2026-01", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "100.00%", "deliveryPoints": "EGP/GNP", "price": "$13.80 (2026$)", "totalAcq": "547.5 TJ", "monthly": [
      { "month": "Jan-26", "value": 1.5 }, { "month": "Feb-26", "value": 1.5 }, { "month": "Mar-26", "value": 1.5 }, { "month": "Apr-26", "value": 1.5 },
      { "month": "May-26", "value": 1.5 }, { "month": "Jun-26", "value": 1.5 }, { "month": "Jul-26", "value": 1.5 }, { "month": "Aug-26", "value": 1.5 },
      { "month": "Sep-26", "value": 1.5 }, { "month": "Oct-26", "value": 1.5 }, { "month": "Nov-26", "value": 1.5 }, { "month": "Dec-26", "value": 1.5 }
    ] },
    { "id": "vic-supply-esso-tn2026-02", "section": "VIC New", "kind": "supply", "contractName": "Esso transactions under MGSA — TN 2026-02", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "100%", "deliveryPoints": "EGP/GNP", "price": "$13.55 (2026$)", "totalAcq": "6,884.0 TJ", "monthly": [
      { "month": "Jan-26", "value": 14.5 }, { "month": "Feb-26", "value": 14.5 }, { "month": "Mar-26", "value": 14.5 }, { "month": "Apr-26", "value": 14.5 },
      { "month": "May-26", "value": 24 }, { "month": "Jun-26", "value": 25.5 }, { "month": "Jul-26", "value": 25.5 }, { "month": "Aug-26", "value": 25.5 },
      { "month": "Sep-26", "value": 24 }, { "month": "Oct-26", "value": 14.5 }, { "month": "Nov-26", "value": 14.5 }, { "month": "Dec-26", "value": 14.5 }
    ] },
    { "id": "vic-supply-esso-tn2026-03", "section": "VIC New", "kind": "supply", "contractName": "Esso transactions under MGSA — TN 2026-03", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "100%", "deliveryPoints": "EGP/GNP", "price": "$14.20 (2026$)", "totalAcq": "1,001.9 TJ", "monthly": [
      { "month": "Jan-26", "value": 0 }, { "month": "Feb-26", "value": 3.67 }, { "month": "Mar-26", "value": 3.67 }, { "month": "Apr-26", "value": 3.67 },
      { "month": "May-26", "value": 3.67 }, { "month": "Jun-26", "value": 3.67 }, { "month": "Jul-26", "value": 3.67 }, { "month": "Aug-26", "value": 3.67 },
      { "month": "Sep-26", "value": 3.67 }, { "month": "Oct-26", "value": 3.67 }, { "month": "Nov-26", "value": 0 }, { "month": "Dec-26", "value": 0 }
    ] },
    { "id": "vic-supply-esso-tn2026-04", "section": "VIC New", "kind": "supply", "contractName": "Esso transactions under MGSA — TN 2026-04", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "100%", "deliveryPoints": "EGP/GNP", "price": "$12.90 (2026$)", "totalAcq": "3,000.3 TJ", "monthly": [
      { "month": "Jan-26", "value": 8.22 }, { "month": "Feb-26", "value": 8.22 }, { "month": "Mar-26", "value": 8.22 }, { "month": "Apr-26", "value": 8.22 },
      { "month": "May-26", "value": 8.22 }, { "month": "Jun-26", "value": 8.22 }, { "month": "Jul-26", "value": 8.22 }, { "month": "Aug-26", "value": 8.22 },
      { "month": "Sep-26", "value": 8.22 }, { "month": "Oct-26", "value": 8.22 }, { "month": "Nov-26", "value": 8.22 }, { "month": "Dec-26", "value": 8.22 }
    ] },
    { "id": "vic-supply-woodside-tn2", "section": "VIC New", "kind": "supply", "contractName": "Woodside transactions under MGSA — TN2", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "90%", "minDQ": "50%", "deliveryPoints": "EGP/GNP", "price": "$13.00 (2026$)", "totalAcq": "2,444.0 TJ", "monthly": [
      { "month": "Jan-26", "value": 4.00 }, { "month": "Feb-26", "value": 4.00 }, { "month": "Mar-26", "value": 0.00 }, { "month": "Apr-26", "value": 0.00 },
      { "month": "May-26", "value": 9.00 }, { "month": "Jun-26", "value": 9.00 }, { "month": "Jul-26", "value": 12.00 }, { "month": "Aug-26", "value": 12.00 },
      { "month": "Sep-26", "value": 9.00 }, { "month": "Oct-26", "value": 9.00 }, { "month": "Nov-26", "value": 6.00 }, { "month": "Dec-26", "value": 6.00 }
    ] },
    { "id": "vic-supply-woodside-tn3", "section": "VIC New", "kind": "supply", "contractName": "Woodside transactions under MGSA — TN3 (NOT COUNTERSIGNED)", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "90%", "minDQ": "50%", "deliveryPoints": "EGP/GNP", "price": "$13.00 (2026$)", "totalAcq": "1,844.3 TJ", "monthly": [
      { "month": "Jan-26", "value": 3.00 }, { "month": "Feb-26", "value": 3.00 }, { "month": "Mar-26", "value": 0.00 }, { "month": "Apr-26", "value": 0.00 },
      { "month": "May-26", "value": 6.75 }, { "month": "Jun-26", "value": 0.00 }, { "month": "Jul-26", "value": 15.75 }, { "month": "Aug-26", "value": 9.00 },
      { "month": "Sep-26", "value": 6.75 }, { "month": "Oct-26", "value": 11.25 }, { "month": "Nov-26", "value": 0.00 }, { "month": "Dec-26", "value": 4.50 }
    ] },
    { "id": "qld-supply-arrow-gsa", "section": "QLD", "kind": "supply", "contractName": "Arrow GSA (ongoing)", "startDate": "2025-01-01", "endDate": "2027-12-31", "acq": "6.00 PJ", "mdq": "17.048 TJ", "minDQ": "14.796 TJ (90% DCQ)", "dcq": "16.44 TJ", "topPercent": "100%", "deliveryPoints": "Tipton or Daandine", "nominations": "24 hours before start of day", "price": "$10.35 / $10.95 / $11.10", "other": "Note 2021-2 Arrow Put also continues" },
    { "id": "qld-supply-orora", "section": "QLD", "kind": "supply", "contractName": "Orora", "startDate": "2026-01-01", "endDate": "2026-12-31", "acq": "0.959 PJ", "mdq": "2.63 TJ", "minDQ": "2.63 TJ", "topPercent": "100%", "deliveryPoints": "WalHP", "nominations": "To CQ, although flat 100% ToP", "price": "$13.3 (2026$)", "other": "Firm" },
    { "id": "nswsa-supply-santos-tn166b", "section": "NSW/SA", "kind": "supply", "contractName": "Santos TN166B (Buy at Moomba) — WAL to Moomba swap", "startDate": "2025-01-01", "endDate": "2027-12-31", "acq": "Cal26-27: 1.825 PJs", "mdq": "Cal26-27: 5.0 TJ/d", "minDQ": "100% MDQ", "topPercent": "100%", "deliveryPoints": "MAPS / MSP Moomba", "nominations": "D-1 10:00am AEST", "price": "$12.00 (2026$)", "other": "Firm" },
    { "id": "nswsa-supply-agl-tn59", "section": "NSW/SA", "kind": "supply", "contractName": "AGL TN59", "startDate": "2026-01-01", "endDate": "2026-12-31", "acq": "1.095 PJ", "mdq": "3.0 TJ", "minDQ": "3.0 TJ", "topPercent": "100%", "deliveryPoints": "Moomba LPTP", "nominations": "D-1 10am AEST", "price": "$13.40 (2026$)", "other": "Firm; buy leg of swap, CFD sale in Vic at $12.80 in 3TJ a day" }
  ],
  "demand": [
    { "id": "vic-sales-solstice-tn3", "section": "VIC New", "kind": "demand", "contractName": "Solstice transactions under MGSA — TN3 (2026-1)", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "90.00%", "minDQ": "50%", "deliveryPoints": "EGP/GNP", "price": "$16.50 (2026$)", "other": "PI 15 Days", "totalAcq": "1,000 TJ", "monthly": [
      { "month": "Jan-26", "value": 3.4 }, { "month": "Feb-26", "value": 3.4 }, { "month": "Mar-26", "value": 3.4 }, { "month": "Apr-26", "value": 3.4 },
      { "month": "May-26", "value": 3.4 }, { "month": "Jun-26", "value": 3.4 }, { "month": "Jul-26", "value": 3.4 }, { "month": "Aug-26", "value": 3.4 },
      { "month": "Sep-26", "value": 3.4 }, { "month": "Oct-26", "value": 3.4 }, { "month": "Nov-26", "value": 3.4 }, { "month": "Dec-26", "value": 3.4 }
    ] },
    { "id": "vic-sales-solstice-tn5", "section": "VIC New", "kind": "demand", "contractName": "Solstice transactions under MGSA — TN5 (2026-2)", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "95%", "minDQ": "50%", "deliveryPoints": "EGP/GNP", "price": "$15.75 (2026$)", "other": "PI 15 Days", "totalAcq": "500 TJ", "monthly": [
      { "month": "Jan-26", "value": 1.65 }, { "month": "Feb-26", "value": 1.65 }, { "month": "Mar-26", "value": 1.65 }, { "month": "Apr-26", "value": 1.65 },
      { "month": "May-26", "value": 1.65 }, { "month": "Jun-26", "value": 1.65 }, { "month": "Jul-26", "value": 1.65 }, { "month": "Aug-26", "value": 1.65 },
      { "month": "Sep-26", "value": 1.65 }, { "month": "Oct-26", "value": 1.65 }, { "month": "Nov-26", "value": 1.65 }, { "month": "Dec-26", "value": 1.65 }
    ] },
    { "id": "vic-sales-solstice-tn7", "section": "VIC New", "kind": "demand", "contractName": "Solstice transactions under MGSA — TN7 (2026-3)", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "90%", "minDQ": "50%", "deliveryPoints": "EGP/GNP", "price": "$13.60 (2026$)", "other": "PI 15 Days", "totalAcq": "350 TJ", "monthly": [
      { "month": "Jan-26", "value": 1 }, { "month": "Feb-26", "value": 1 }, { "month": "Mar-26", "value": 1 }, { "month": "Apr-26", "value": 1 },
      { "month": "May-26", "value": 1 }, { "month": "Jun-26", "value": 1 }, { "month": "Jul-26", "value": 1 }, { "month": "Aug-26", "value": 1 },
      { "month": "Sep-26", "value": 1 }, { "month": "Oct-26", "value": 1 }, { "month": "Nov-26", "value": 1 }, { "month": "Dec-26", "value": 1 }
    ] },
    { "id": "vic-sales-solstice-tn8", "section": "VIC New", "kind": "demand", "contractName": "Solstice transactions under MGSA — TN8 (2026-4)", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "90%", "minDQ": "70%", "deliveryPoints": "EGP/GNP", "price": "$13.50 (2026$)", "other": "PI 15 Days", "totalAcq": "350 TJ", "monthly": [
      { "month": "Jan-26", "value": 1.2 }, { "month": "Feb-26", "value": 1.2 }, { "month": "Mar-26", "value": 1.2 }, { "month": "Apr-26", "value": 1.2 },
      { "month": "May-26", "value": 1.2 }, { "month": "Jun-26", "value": 1.2 }, { "month": "Jul-26", "value": 1.2 }, { "month": "Aug-26", "value": 1.2 },
      { "month": "Sep-26", "value": 1.2 }, { "month": "Oct-26", "value": 1.2 }, { "month": "Nov-26", "value": 1.2 }, { "month": "Dec-26", "value": 1.2 }
    ] },
    { "id": "vic-sales-solstice-tn10", "section": "VIC New", "kind": "demand", "contractName": "Solstice transactions under MGSA — TN10 (2026-5)", "startDate": "2026-01-01", "endDate": "2026-12-31", "topPercent": "90%", "minDQ": "52%", "deliveryPoints": "EGP/GNP", "price": "$13.20 (2026$)", "other": "PI 15 Days", "totalAcq": "480 TJ", "monthly": [
      { "month": "Jan-26", "value": 1.45 }, { "month": "Feb-26", "value": 1.45 }, { "month": "Mar-26", "value": 1.45 }, { "month": "Apr-26", "value": 1.45 },
      { "month": "May-26", "value": 1.45 }, { "month": "Jun-26", "value": 1.45 }, { "month": "Jul-26", "value": 1.45 }, { "month": "Aug-26", "value": 1.45 },
      { "month": "Sep-26", "value": 1.45 }, { "month": "Oct-26", "value": 1.45 }, { "month": "Nov-26", "value": 1.45 }, { "month": "Dec-26", "value": 1.45 }
    ] },
    { "id": "vic-sales-m2-energy", "section": "VIC Sales New", "kind": "demand", "contractName": "M2 Energy 2026-01", "startDate": "2026-05-01", "endDate": "2026-10-28", "acq": "TCQ 0.50 PJ", "mdq": "May: 2 TJ/Day; Jun–Aug: 3.5 TJ/Day; Sep–Oct: 2 TJ/Day", "minDQ": "100%", "topPercent": "100%", "deliveryPoints": "Longford (GNP) Suballocations/EGP", "nominations": "D-1 9:15am", "price": "$14.50 (2026$)", "other": "Firm (6 days PI)" },
    { "id": "vic-sales-etex-tn2", "section": "VIC Sales New", "kind": "demand", "contractName": "ETEX TN2", "startDate": "2026-01-01", "endDate": "2026-12-31", "acq": "0.230 PJ", "mdq": "0.693 TJ", "minDQ": "30%", "topPercent": "100%", "deliveryPoints": "Longford (GNP) Suballocations or EGP", "nominations": "D-1 8:30am (CQ will be nominating)", "price": "$13.80 (2026$)", "other": "Firm (PI 10 Days)" },
    { "id": "vic-sales-shell-tn142", "section": "VIC Sales New", "kind": "demand", "contractName": "Shell TN142", "startDate": "2026-04-01", "endDate": "2026-09-30", "acq": "0.365 PJ", "mdq": "Q2: 3 TJ; Q3: 1 TJ", "minDQ": "100%", "topPercent": "100%", "deliveryPoints": "EGP", "nominations": "Deemed", "price": "$13.65 (2026$)", "other": "Firm (PI 10 Days)" },
    { "id": "vic-sales-aurora-tn4", "section": "VIC Sales New", "kind": "demand", "contractName": "Aurora TN4", "startDate": "2026-01-01", "endDate": "2027-12-31", "acq": "0.155 PJ", "minDQ": "Jan–Feb 50%; Mar–Oct 60%; Nov–Dec 50%", "topPercent": "80%", "deliveryPoints": "EGP", "nominations": "D-1 9:30am", "price": "$13.85 (2026$) / $14.30 (2027$)", "other": "Firm (PI 20 Days)", "monthly": [
      { "month": "Jan", "value": 0.25 }, { "month": "Feb", "value": 0.25 }, { "month": "Mar", "value": 0.35 }, { "month": "Apr", "value": 0.5 },
      { "month": "May", "value": 0.65 }, { "month": "Jun", "value": 0.77 }, { "month": "Jul", "value": 0.77 }, { "month": "Aug", "value": 0.73 },
      { "month": "Sep", "value": 0.65 }, { "month": "Oct", "value": 0.6 }, { "month": "Nov", "value": 0.55 }, { "month": "Dec", "value": 0.45 }
    ] },
    { "id": "qld-sales-south32-tn4", "section": "QLD", "kind": "demand", "contractName": "South 32 TN4", "startDate": "2026-01-01", "endDate": "2026-12-31", "acq": "2.117 PJ", "mdq": "6.380 TJ", "minDQ": "0.0 TJ", "topPercent": "90%", "deliveryPoints": "WAL HP Trade Point", "nominations": "D-1 10am AEST", "price": "$14.25 (2026$)", "other": "Firm" },
    { "id": "qld-sales-shell-tn127", "section": "QLD", "kind": "demand", "contractName": "Shell TN127", "startDate": "2026-01-01", "endDate": "2026-12-31", "acq": "0.547 PJ", "mdq": "1.5 TJ", "minDQ": "1.5 TJ", "topPercent": "100%", "deliveryPoints": "WAL HP Trade Point", "nominations": "Deemed", "price": "$13.25 (2026$)", "other": "Firm" },
    { "id": "qld-sales-santos-tn166a", "section": "QLD", "kind": "demand", "contractName": "Santos TN166A (Sell at WAL) — WAL to Moomba swap", "startDate": "2025-01-01", "endDate": "2027-12-31", "acq": "Cal25: 2.55 PJs; Cal26-27: 1.825 PJs", "mdq": "Cal25: 7.0 TJ/d; Cal26-27: 5.0 TJ/d", "minDQ": "N/A, 100% MDQ", "topPercent": "100%", "deliveryPoints": "WAL HP", "nominations": "D-1 9:15am (AEST)", "price": "$11.20 (2026$)", "other": "Firm" },
    { "id": "nswsa-sales-heathgate-tn3", "section": "NSW/SA", "kind": "demand", "contractName": "Heathgate TN3", "startDate": "2026-01-01", "endDate": "2026-12-31", "acq": "0.248 PJ", "mdq": "1.00 TJ", "minDQ": "0.50 TJ", "topPercent": "80%", "deliveryPoints": "Moomba Delivery Point (point at which gas first enters the MAPs at the outlet point of the meter station at Moomba)", "nominations": "See confluence", "price": "$16.0 (2026$)", "other": "Firm; note ongoing issues at site, will follow up later in year" },
    { "id": "nswsa-sales-delta-tn2", "section": "NSW/SA", "kind": "demand", "contractName": "Delta TN2", "startDate": "2026-01-01", "endDate": "2026-12-31", "acq": "36.5 PJ", "mdq": "0.10 TJ", "minDQ": "0.10 TJ", "topPercent": "100%", "deliveryPoints": "Wilton STTM (through TRN)", "nominations": "Deemed (nom already received)", "price": "$13.50 (2026$)", "other": "Firm; potential for additional delivery points, reasonable endeavours, see summary email (marked New)" }
  ],
  "cfds": {
    "sell": [
      { "startDate": "2026-01-01", "endDate": "2026-12-31", "buySell": -1, "strike": "$14.00", "volumeGJ": 1000, "tradeType": "Swap", "counterparty": "Shell Energy Retail Pty Ltd", "status": "Contract", "marketRegion": "VICDWGM6AM", "productComponent": "Gas Commodity", "tradeDate": "2024-11-14", "comments": "Time swap to 27" },
      { "startDate": "2026-04-01", "endDate": "2026-09-30", "buySell": -1, "strike": "$14.00", "volumeGJ": 2000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "VICDWGM6AM", "productComponent": "Gas Commodity", "tradeDate": "2024-12-13" },
      { "startDate": "2026-04-01", "endDate": "2026-09-30", "buySell": -1, "strike": "$15.30", "volumeGJ": 1000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "VICDWGM6AM", "productComponent": "Gas Commodity", "tradeDate": "2025-01-30" },
      { "startDate": "2026-01-01", "endDate": "2026-03-31", "buySell": -1, "strike": "$13.00", "volumeGJ": 2000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "VICDWGM6AM", "productComponent": "Gas Commodity", "tradeDate": "2025-06-12", "comments": "IR to Sydney" },
      { "startDate": "2026-04-01", "endDate": "2026-09-30", "buySell": -1, "strike": "$13.00", "volumeGJ": 3000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "VICDWGM6AM", "productComponent": "Gas Commodity", "tradeDate": "2025-06-12" },
      { "startDate": "2026-10-01", "endDate": "2026-12-31", "buySell": -1, "strike": "$13.00", "volumeGJ": 2000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "VICDWGM6AM", "productComponent": "Gas Commodity", "tradeDate": "2025-06-12" },
      { "startDate": "2026-01-01", "endDate": "2026-12-31", "buySell": -1, "strike": "$12.80", "volumeGJ": 3000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "VICDWGM6AM", "productComponent": "Gas Commodity", "tradeDate": "2025-11-14", "comments": "Sell leg of AGL TN59 at Moomba" },
      { "startDate": "2026-04-01", "endDate": "2026-09-30", "buySell": -1, "strike": "$13.50", "volumeGJ": 500, "tradeType": "Swap", "counterparty": "M2 Energy Pty Ltd", "status": "Contract", "marketRegion": "VICDWGM6AM", "productComponent": "Gas Commodity", "tradeDate": "2025-11-26", "comments": "Sell outright" }
    ],
    "buy": [
      { "startDate": "2026-04-01", "endDate": "2026-09-30", "buySell": 1, "strike": "$14.90", "volumeGJ": 2000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "STTM_NSW", "productComponent": "Gas Commodity", "tradeDate": "2024-12-13" },
      { "startDate": "2026-04-01", "endDate": "2026-09-30", "buySell": 1, "strike": "$16.20", "volumeGJ": 1000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "STTM_NSW", "productComponent": "Gas Commodity", "tradeDate": "2025-01-30" },
      { "startDate": "2026-01-01", "endDate": "2026-03-31", "buySell": 1, "strike": "$14.00", "volumeGJ": 2000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "STTM_NSW", "productComponent": "Gas Commodity", "tradeDate": "2025-06-12", "comments": "IR from Vic" },
      { "startDate": "2026-04-01", "endDate": "2026-09-30", "buySell": 1, "strike": "$14.00", "volumeGJ": 3000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "STTM_NSW", "productComponent": "Gas Commodity", "tradeDate": "2025-06-12" },
      { "startDate": "2026-10-01", "endDate": "2026-12-31", "buySell": 1, "strike": "$14.00", "volumeGJ": 2000, "tradeType": "Swap", "counterparty": "AGL Hydro Partnership", "status": "Contract", "marketRegion": "STTM_NSW", "productComponent": "Gas Commodity", "tradeDate": "2025-06-12" }
    ]
  },
  "quarterlyCapacity": [
    { "period": "Q1 26", "sydBuyTJDay": 2000, "vicSellTJDay": 6000 },
    { "period": "Q2 26", "sydBuyTJDay": 6000, "vicSellTJDay": 10500 },
    { "period": "Q3 26", "sydBuyTJDay": 6000, "vicSellTJDay": 10500 },
    { "period": "Q4 26", "sydBuyTJDay": 2000, "vicSellTJDay": 6000 }
  ]
}
```

- [ ] **Step 3: Write failing shape test**

`src/data/contracts.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import contracts from "./contracts.json";

describe("contracts data shape", () => {
  it("has supply, demand, cfds and quarterlyCapacity", () => {
    expect(Array.isArray(contracts.supply)).toBe(true);
    expect(Array.isArray(contracts.demand)).toBe(true);
    expect(Array.isArray(contracts.cfds.sell)).toBe(true);
    expect(Array.isArray(contracts.cfds.buy)).toBe(true);
    expect(Array.isArray(contracts.quarterlyCapacity)).toBe(true);
  });

  it("has no duplicate ids across supply and demand", () => {
    const ids = [...contracts.supply, ...contracts.demand].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every monthly schedule has 12 entries", () => {
    for (const row of [...contracts.supply, ...contracts.demand]) {
      if (row.monthly) {
        expect(row.monthly.length).toBe(12);
      }
    }
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- contracts.test`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/data/contracts.ts src/data/contracts.json src/data/contracts.test.ts
git commit -m "feat: add FY26 contracts data (supply/demand/CFDs)"
```

---

## Task 6: App State Context

**Files:**
- Create: `src/state/AppState.tsx`
- Test: `src/state/AppState.test.tsx`

**Interfaces:**
- Consumes: `Region`, `Selection` from `src/types.ts` (Task 2).
- Produces: `AppStateProvider`, `useAppState()` returning `{ region, view, selection, search, setRegion, setView, select, clearSelection, setSearch }`, consumed by every component task (7–13).

- [ ] **Step 1: Write failing test**

`src/state/AppState.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- AppState`
Expected: FAIL with "Cannot find module './AppState'"

- [ ] **Step 3: Implement AppState**

`src/state/AppState.tsx`:
```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- AppState`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/state/AppState.tsx src/state/AppState.test.tsx
git commit -m "feat: add app state context (region/view/selection/search)"
```

---

## Task 7: Shared `PipelineLine` and `NodeMarker` SVG Components

**Files:**
- Create: `src/lib/colors.ts`
- Create: `src/components/PipelineLine.tsx`
- Create: `src/components/NodeMarker.tsx`
- Test: `src/components/PipelineLine.test.tsx`
- Test: `src/components/NodeMarker.test.tsx`

**Interfaces:**
- Consumes: `Pipeline`, `PipelineNode`, `PipelineColor`, `NodeType` from `src/types.ts`.
- Produces: `PIPELINE_COLORS`, `NODE_TYPE_COLORS` maps; `<PipelineLine pipeline points onClick isSelected />`; `<NodeMarker node x y onClick isSelected />`. Consumed by `SchematicMap` (Task 8) and `GeoMap` (Task 9).

- [ ] **Step 1: Write `src/lib/colors.ts`**

```ts
import type { PipelineColor, NodeType } from "../types";

export const PIPELINE_COLORS: Record<PipelineColor, string> = {
  teal: "#2dd4bf",
  amber: "#f59e0b",
  purple: "#a78bfa",
  slate: "#64748b",
};

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  hub: "#38bdf8",
  plant: "#34d399",
  compressor: "#fbbf24",
  sttm: "#f472b6",
  lng: "#a78bfa",
  town: "#94a3b8",
};
```

- [ ] **Step 2: Write failing tests**

`src/components/PipelineLine.test.tsx`:
```tsx
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PipelineLine } from "./PipelineLine";
import type { Pipeline } from "../types";

const pipeline: Pipeline = {
  id: "swqp",
  code: "SWQP",
  name: "South West Queensland Pipeline",
  region: "east",
  path: ["ballera", "wallumbilla"],
  description: "test",
  style: { color: "teal" },
};

describe("PipelineLine", () => {
  it("renders an svg polyline with the pipeline's color", () => {
    render(
      <svg>
        <PipelineLine pipeline={pipeline} points={[{ x: 0, y: 0 }, { x: 10, y: 10 }]} onClick={() => {}} isSelected={false} />
      </svg>
    );
    const line = screen.getByTestId("pipeline-swqp");
    expect(line).toHaveAttribute("stroke", "#2dd4bf");
  });

  it("calls onClick with the pipeline id when clicked", () => {
    const onClick = vi.fn();
    render(
      <svg>
        <PipelineLine pipeline={pipeline} points={[{ x: 0, y: 0 }, { x: 10, y: 10 }]} onClick={onClick} isSelected={false} />
      </svg>
    );
    fireEvent.click(screen.getByTestId("pipeline-swqp"));
    expect(onClick).toHaveBeenCalledWith("swqp");
  });
});
```

`src/components/NodeMarker.test.tsx`:
```tsx
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NodeMarker } from "./NodeMarker";
import type { PipelineNode } from "../types";

const node: PipelineNode = {
  id: "wallumbilla",
  name: "Wallumbilla Hub (WAL)",
  type: "hub",
  region: "east",
  schematicPos: { x: 829, y: 744 },
  geoPos: { lat: -26.57, lng: 149.15 },
  description: "test",
};

describe("NodeMarker", () => {
  it("renders a circle with the node type's color", () => {
    render(
      <svg>
        <NodeMarker node={node} x={100} y={200} onClick={() => {}} isSelected={false} />
      </svg>
    );
    const marker = screen.getByTestId("node-wallumbilla");
    expect(marker).toHaveAttribute("fill", "#38bdf8");
  });

  it("calls onClick with the node id when clicked", () => {
    const onClick = vi.fn();
    render(
      <svg>
        <NodeMarker node={node} x={100} y={200} onClick={onClick} isSelected={false} />
      </svg>
    );
    fireEvent.click(screen.getByTestId("node-wallumbilla"));
    expect(onClick).toHaveBeenCalledWith("wallumbilla");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test -- PipelineLine NodeMarker`
Expected: FAIL (modules don't exist yet)

- [ ] **Step 4: Implement `PipelineLine`**

`src/components/PipelineLine.tsx`:
```tsx
import { PIPELINE_COLORS } from "../lib/colors";
import type { Pipeline } from "../types";

interface Point {
  x: number;
  y: number;
}

interface PipelineLineProps {
  pipeline: Pipeline;
  points: Point[];
  onClick: (id: string) => void;
  isSelected: boolean;
}

export function PipelineLine({ pipeline, points, onClick, isSelected }: PipelineLineProps) {
  const color = PIPELINE_COLORS[pipeline.style.color];
  const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <polyline
      data-testid={`pipeline-${pipeline.id}`}
      points={pointsAttr}
      fill="none"
      stroke={color}
      strokeWidth={isSelected ? 5 : 3}
      strokeDasharray={pipeline.style.dashed ? "8 6" : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={pipeline.style.dashed ? undefined : "pipeline-flow"}
      style={{ cursor: "pointer" }}
      onClick={() => onClick(pipeline.id)}
    />
  );
}
```

- [ ] **Step 5: Implement `NodeMarker`**

`src/components/NodeMarker.tsx`:
```tsx
import { NODE_TYPE_COLORS } from "../lib/colors";
import type { PipelineNode } from "../types";

interface NodeMarkerProps {
  node: PipelineNode;
  x: number;
  y: number;
  onClick: (id: string) => void;
  isSelected: boolean;
}

export function NodeMarker({ node, x, y, onClick, isSelected }: NodeMarkerProps) {
  const color = NODE_TYPE_COLORS[node.type];

  return (
    <g onClick={() => onClick(node.id)} style={{ cursor: "pointer" }}>
      <circle
        data-testid={`node-${node.id}`}
        cx={x}
        cy={y}
        r={isSelected ? 9 : 6}
        fill={color}
        stroke="#0b1220"
        strokeWidth={2}
      />
      <text x={x + 10} y={y + 4} fontSize={11} fill="#e2e8f0">
        {node.name}
      </text>
    </g>
  );
}
```

- [ ] **Step 6: Add flow animation CSS**

Append to `src/index.css`:
```css
.pipeline-flow {
  stroke-dasharray: 6 10;
  animation: flow 1.4s linear infinite;
}

@keyframes flow {
  to {
    stroke-dashoffset: -16;
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm run test -- PipelineLine NodeMarker`
Expected: PASS (4 tests)

- [ ] **Step 8: Commit**

```bash
git add src/lib/colors.ts src/components/PipelineLine.tsx src/components/NodeMarker.tsx src/components/PipelineLine.test.tsx src/components/NodeMarker.test.tsx src/index.css
git commit -m "feat: add shared PipelineLine and NodeMarker SVG components"
```

---

## Task 8: Data Selectors and `SchematicMap`

**Files:**
- Create: `src/lib/selectors.ts`
- Create: `src/components/SchematicMap.tsx`
- Test: `src/lib/selectors.test.ts`
- Test: `src/components/SchematicMap.test.tsx`

**Interfaces:**
- Consumes: `PipelineNode`, `Pipeline` (Task 2); `PipelineLine`, `NodeMarker` (Task 7); region data from `src/data/east|west/*.json` (Tasks 3–4).
- Produces: `getNodeById(nodes, id)`, `getConnectedPipelines(nodeId, pipelines)`, `getConnectedNodes(pipeline, nodes)` (consumed by `DetailPanel`, Task 10); `<SchematicMap nodes pipelines selection onSelectNode onSelectPipeline />` (consumed by `App.tsx`, Task 13); `<GeoMap>` (Task 9) reuses the same selectors.

- [ ] **Step 1: Write failing selector tests**

`src/lib/selectors.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getNodeById, getConnectedPipelines, getConnectedNodes } from "./selectors";
import nodes from "../data/east/nodes.json";
import pipelines from "../data/east/pipelines.json";
import type { PipelineNode, Pipeline } from "../types";

const typedNodes = nodes as PipelineNode[];
const typedPipelines = pipelines as Pipeline[];

describe("selectors", () => {
  it("getNodeById finds a node by id", () => {
    const node = getNodeById(typedNodes, "wallumbilla");
    expect(node?.name).toBe("Wallumbilla Hub (WAL)");
  });

  it("getNodeById returns undefined for an unknown id", () => {
    expect(getNodeById(typedNodes, "not-a-real-id")).toBeUndefined();
  });

  it("getConnectedPipelines finds every pipeline touching a node", () => {
    const connected = getConnectedPipelines("wallumbilla", typedPipelines);
    const ids = connected.map((p) => p.id).sort();
    expect(ids).toEqual(["ppl134", "ppl90", "rbp", "swqp"].sort());
  });

  it("getConnectedNodes resolves a pipeline's path to node objects", () => {
    const swqp = typedPipelines.find((p) => p.id === "swqp")!;
    const connected = getConnectedNodes(swqp, typedNodes);
    expect(connected.map((n) => n.id)).toEqual(["ballera", "gooimbah", "wallumbilla"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- selectors`
Expected: FAIL with "Cannot find module './selectors'"

- [ ] **Step 3: Implement selectors**

`src/lib/selectors.ts`:
```ts
import type { PipelineNode, Pipeline } from "../types";

export function getNodeById(nodes: PipelineNode[], id: string): PipelineNode | undefined {
  return nodes.find((n) => n.id === id);
}

export function getConnectedPipelines(nodeId: string, pipelines: Pipeline[]): Pipeline[] {
  return pipelines.filter((p) => p.path.includes(nodeId));
}

export function getConnectedNodes(pipeline: Pipeline, nodes: PipelineNode[]): PipelineNode[] {
  return pipeline.path
    .map((id) => getNodeById(nodes, id))
    .filter((n): n is PipelineNode => n !== undefined);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- selectors`
Expected: PASS (4 tests)

- [ ] **Step 5: Write failing `SchematicMap` test**

`src/components/SchematicMap.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SchematicMap } from "./SchematicMap";
import nodes from "../data/east/nodes.json";
import pipelines from "../data/east/pipelines.json";
import type { PipelineNode, Pipeline } from "../types";

describe("SchematicMap", () => {
  it("renders a marker for every node and a line for every pipeline", () => {
    render(
      <SchematicMap
        nodes={nodes as PipelineNode[]}
        pipelines={pipelines as Pipeline[]}
        selection={null}
        onSelectNode={() => {}}
        onSelectPipeline={() => {}}
      />
    );
    expect(screen.getByTestId("node-wallumbilla")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-swqp")).toBeInTheDocument();
  });

  it("calls onSelectNode when a node marker is clicked", () => {
    const onSelectNode = vi.fn();
    render(
      <SchematicMap
        nodes={nodes as PipelineNode[]}
        pipelines={pipelines as Pipeline[]}
        selection={null}
        onSelectNode={onSelectNode}
        onSelectPipeline={() => {}}
      />
    );
    fireEvent.click(screen.getByTestId("node-wallumbilla"));
    expect(onSelectNode).toHaveBeenCalledWith("wallumbilla");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test -- SchematicMap`
Expected: FAIL with "Cannot find module './SchematicMap'"

- [ ] **Step 7: Implement `SchematicMap`**

`src/components/SchematicMap.tsx`:
```tsx
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { PipelineLine } from "./PipelineLine";
import { NodeMarker } from "./NodeMarker";
import { getConnectedNodes } from "../lib/selectors";
import type { PipelineNode, Pipeline, Selection } from "../types";

interface SchematicMapProps {
  nodes: PipelineNode[];
  pipelines: Pipeline[];
  selection: Selection;
  onSelectNode: (id: string) => void;
  onSelectPipeline: (id: string) => void;
}

const VIEWBOX_PADDING = 80;

export function SchematicMap({ nodes, pipelines, selection, onSelectNode, onSelectPipeline }: SchematicMapProps) {
  const xs = nodes.map((n) => n.schematicPos.x);
  const ys = nodes.map((n) => n.schematicPos.y);
  const minX = Math.min(...xs) - VIEWBOX_PADDING;
  const minY = Math.min(...ys) - VIEWBOX_PADDING;
  const width = Math.max(...xs) - minX + VIEWBOX_PADDING;
  const height = Math.max(...ys) - minY + VIEWBOX_PADDING;

  return (
    <TransformWrapper minScale={0.3} maxScale={4} limitToBounds={false}>
      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
        <svg viewBox={`${minX} ${minY} ${width} ${height}`} role="img" aria-label="Schematic pipeline diagram">
          {pipelines.map((pipeline) => (
            <PipelineLine
              key={pipeline.id}
              pipeline={pipeline}
              points={getConnectedNodes(pipeline, nodes).map((n) => n.schematicPos)}
              onClick={onSelectPipeline}
              isSelected={selection?.kind === "pipeline" && selection.id === pipeline.id}
            />
          ))}
          {nodes.map((node) => (
            <NodeMarker
              key={node.id}
              node={node}
              x={node.schematicPos.x}
              y={node.schematicPos.y}
              onClick={onSelectNode}
              isSelected={selection?.kind === "node" && selection.id === node.id}
            />
          ))}
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- SchematicMap`
Expected: PASS (2 tests)

- [ ] **Step 9: Commit**

```bash
git add src/lib/selectors.ts src/lib/selectors.test.ts src/components/SchematicMap.tsx src/components/SchematicMap.test.tsx
git commit -m "feat: add data selectors and SchematicMap component"
```

---

## Task 9: `GeoMap` Component

**Files:**
- Create: `src/components/GeoMap.tsx`
- Test: `src/components/GeoMap.test.tsx`

**Interfaces:**
- Consumes: `projectGeo` (Task 2), `PipelineLine`/`NodeMarker` (Task 7), `getConnectedNodes` (Task 8).
- Produces: `<GeoMap nodes pipelines selection onSelectNode onSelectPipeline />`, same props shape as `SchematicMap`, consumed by `App.tsx` (Task 13).

The backdrop is a stylised (not geographically precise) Australia bounding frame with a light grid — the goal is orientation ("this is roughly where these facilities sit"), not a literal coastline, which the source data doesn't provide.

- [ ] **Step 1: Write failing test**

`src/components/GeoMap.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GeoMap } from "./GeoMap";
import nodes from "../data/west/nodes.json";
import pipelines from "../data/west/pipelines.json";
import type { PipelineNode, Pipeline } from "../types";

describe("GeoMap", () => {
  it("renders a marker for every node and a line for every pipeline", () => {
    render(
      <GeoMap
        nodes={nodes as PipelineNode[]}
        pipelines={pipelines as Pipeline[]}
        selection={null}
        onSelectNode={() => {}}
        onSelectPipeline={() => {}}
      />
    );
    expect(screen.getByTestId("node-dampier")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-dbp")).toBeInTheDocument();
  });

  it("calls onSelectPipeline when a pipeline line is clicked", () => {
    const onSelectPipeline = vi.fn();
    render(
      <GeoMap
        nodes={nodes as PipelineNode[]}
        pipelines={pipelines as Pipeline[]}
        selection={null}
        onSelectNode={() => {}}
        onSelectPipeline={onSelectPipeline}
      />
    );
    fireEvent.click(screen.getByTestId("pipeline-dbp"));
    expect(onSelectPipeline).toHaveBeenCalledWith("dbp");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- GeoMap`
Expected: FAIL with "Cannot find module './GeoMap'"

- [ ] **Step 3: Implement `GeoMap`**

`src/components/GeoMap.tsx`:
```tsx
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { PipelineLine } from "./PipelineLine";
import { NodeMarker } from "./NodeMarker";
import { getConnectedNodes } from "../lib/selectors";
import { projectGeo } from "../lib/geoProject";
import type { PipelineNode, Pipeline, Selection } from "../types";

const WIDTH = 900;
const HEIGHT = 1000;

interface GeoMapProps {
  nodes: PipelineNode[];
  pipelines: Pipeline[];
  selection: Selection;
  onSelectNode: (id: string) => void;
  onSelectPipeline: (id: string) => void;
}

export function GeoMap({ nodes, pipelines, selection, onSelectNode, onSelectPipeline }: GeoMapProps) {
  const projected = new Map(
    nodes.map((n) => [n.id, projectGeo(n.geoPos.lat, n.geoPos.lng, WIDTH, HEIGHT)])
  );

  return (
    <TransformWrapper minScale={0.3} maxScale={4} limitToBounds={false}>
      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} role="img" aria-label="Geographic pipeline map">
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#0e1830" stroke="#1c2a45" strokeDasharray="4 6" />
          {pipelines.map((pipeline) => (
            <PipelineLine
              key={pipeline.id}
              pipeline={pipeline}
              points={getConnectedNodes(pipeline, nodes).map((n) => projected.get(n.id)!)}
              onClick={onSelectPipeline}
              isSelected={selection?.kind === "pipeline" && selection.id === pipeline.id}
            />
          ))}
          {nodes.map((node) => {
            const pos = projected.get(node.id)!;
            return (
              <NodeMarker
                key={node.id}
                node={node}
                x={pos.x}
                y={pos.y}
                onClick={onSelectNode}
                isSelected={selection?.kind === "node" && selection.id === node.id}
              />
            );
          })}
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- GeoMap`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/GeoMap.tsx src/components/GeoMap.test.tsx
git commit -m "feat: add GeoMap component"
```

---

## Task 10: `DetailPanel` (Click-to-Read-More)

**Files:**
- Create: `src/components/DetailPanel.tsx`
- Test: `src/components/DetailPanel.test.tsx`

**Interfaces:**
- Consumes: `getNodeById`, `getConnectedPipelines`, `getConnectedNodes` (Task 8); `Selection` (Task 2).
- Produces: `<DetailPanel selection nodes pipelines onSelect onClose />`, consumed by `App.tsx` (Task 13).

- [ ] **Step 1: Write failing test**

`src/components/DetailPanel.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DetailPanel } from "./DetailPanel";
import nodes from "../data/east/nodes.json";
import pipelines from "../data/east/pipelines.json";
import type { PipelineNode, Pipeline } from "../types";

const typedNodes = nodes as PipelineNode[];
const typedPipelines = pipelines as Pipeline[];

describe("DetailPanel", () => {
  it("renders nothing when there is no selection", () => {
    const { container } = render(
      <DetailPanel selection={null} nodes={typedNodes} pipelines={typedPipelines} onSelect={() => {}} onClose={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a node's name, description, and connected pipelines", () => {
    render(
      <DetailPanel
        selection={{ kind: "node", id: "wallumbilla" }}
        nodes={typedNodes}
        pipelines={typedPipelines}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByText("Wallumbilla Hub (WAL)")).toBeInTheDocument();
    expect(screen.getByText(/Major Queensland gas trading hub/)).toBeInTheDocument();
    expect(screen.getByText("South West Queensland Pipeline")).toBeInTheDocument();
  });

  it("shows a pipeline's name, description, and connected nodes", () => {
    render(
      <DetailPanel
        selection={{ kind: "pipeline", id: "swqp" }}
        nodes={typedNodes}
        pipelines={typedPipelines}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByText("South West Queensland Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Ballera")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <DetailPanel
        selection={{ kind: "node", id: "wallumbilla" }}
        nodes={typedNodes}
        pipelines={typedPipelines}
        onSelect={() => {}}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- DetailPanel`
Expected: FAIL with "Cannot find module './DetailPanel'"

- [ ] **Step 3: Implement `DetailPanel`**

`src/components/DetailPanel.tsx`:
```tsx
import { motion, AnimatePresence } from "framer-motion";
import { getNodeById, getConnectedPipelines, getConnectedNodes } from "../lib/selectors";
import type { PipelineNode, Pipeline, Selection } from "../types";

interface DetailPanelProps {
  selection: Selection;
  nodes: PipelineNode[];
  pipelines: Pipeline[];
  onSelect: (selection: Selection) => void;
  onClose: () => void;
}

export function DetailPanel({ selection, nodes, pipelines, onSelect, onClose }: DetailPanelProps) {
  const node = selection?.kind === "node" ? getNodeById(nodes, selection.id) : undefined;
  const pipeline = selection?.kind === "pipeline" ? pipelines.find((p) => p.id === selection.id) : undefined;

  return (
    <AnimatePresence>
      {selection && (node || pipeline) && (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed right-0 top-0 h-full w-[360px] bg-panel border-l border-line p-5 overflow-y-auto"
        >
          <button
            aria-label="Close panel"
            onClick={onClose}
            className="mb-4 text-slate-400 hover:text-slate-100"
          >
            Close
          </button>

          {node && (
            <>
              <h2 className="text-lg font-semibold">{node.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{node.type}</p>
              <p className="mt-3 text-sm text-slate-300">{node.description}</p>
              <h3 className="mt-5 text-sm font-semibold text-slate-200">Connected pipelines</h3>
              <ul className="mt-2 space-y-1">
                {getConnectedPipelines(node.id, pipelines).map((p) => (
                  <li key={p.id}>
                    <button
                      className="text-teal hover:underline text-sm"
                      onClick={() => onSelect({ kind: "pipeline", id: p.id })}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {pipeline && (
            <>
              <h2 className="text-lg font-semibold">{pipeline.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{pipeline.code}</p>
              <p className="mt-3 text-sm text-slate-300">{pipeline.description}</p>
              <dl className="mt-3 text-sm text-slate-300 space-y-1">
                {pipeline.operator && (
                  <div><dt className="inline text-slate-400">Operator: </dt><dd className="inline">{pipeline.operator}</dd></div>
                )}
                {pipeline.lengthKm && (
                  <div><dt className="inline text-slate-400">Length: </dt><dd className="inline">{pipeline.lengthKm} km</dd></div>
                )}
                {pipeline.capacity && (
                  <div><dt className="inline text-slate-400">Capacity: </dt><dd className="inline">{pipeline.capacity}</dd></div>
                )}
              </dl>
              <h3 className="mt-5 text-sm font-semibold text-slate-200">Route</h3>
              <ul className="mt-2 space-y-1">
                {getConnectedNodes(pipeline, nodes).map((n) => (
                  <li key={n.id}>
                    <button
                      className="text-teal hover:underline text-sm"
                      onClick={() => onSelect({ kind: "node", id: n.id })}
                    >
                      {n.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- DetailPanel`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/DetailPanel.tsx src/components/DetailPanel.test.tsx
git commit -m "feat: add DetailPanel click-to-read-more component"
```

---

## Task 11: `Legend` and `SearchBar` Components

**Files:**
- Create: `src/components/Legend.tsx`
- Create: `src/components/SearchBar.tsx`
- Test: `src/components/SearchBar.test.tsx`

**Interfaces:**
- Consumes: `PIPELINE_COLORS`, `NODE_TYPE_COLORS` (Task 7).
- Produces: `<Legend />` (static, no props); `<SearchBar value onChange />`, both consumed by `App.tsx` (Task 13). `SearchBar`'s value is matched against node/pipeline `name`/`code` in `App.tsx` to compute a highlighted-id set (no new selector needed — a simple `.toLowerCase().includes()` filter is inlined there).

- [ ] **Step 1: Implement `Legend` (no test needed — static presentational markup, nothing to assert beyond what TypeScript already checks)**

`src/components/Legend.tsx`:
```tsx
import { PIPELINE_COLORS, NODE_TYPE_COLORS } from "../lib/colors";

const NODE_TYPE_LABELS: Record<keyof typeof NODE_TYPE_COLORS, string> = {
  hub: "Hub / trading point",
  plant: "Gas plant / field",
  compressor: "Compressor station",
  sttm: "STTM (trading market)",
  lng: "LNG export facility",
  town: "Demand centre",
};

export function Legend() {
  return (
    <div className="text-xs text-slate-300 space-y-3">
      <div>
        <p className="font-semibold text-slate-200 mb-1">Pipelines</p>
        <div className="space-y-1">
          {Object.entries(PIPELINE_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="inline-block w-4 h-0.5" style={{ backgroundColor: color }} />
              <span className="capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="font-semibold text-slate-200 mb-1">Facilities</p>
        <div className="space-y-1">
          {Object.entries(NODE_TYPE_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span>{NODE_TYPE_LABELS[key as keyof typeof NODE_TYPE_COLORS]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write failing `SearchBar` test**

`src/components/SearchBar.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("calls onChange with the typed value", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "moomba" } });
    expect(onChange).toHaveBeenCalledWith("moomba");
  });

  it("reflects the current value", () => {
    render(<SearchBar value="wallumbilla" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/search/i)).toHaveValue("wallumbilla");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- SearchBar`
Expected: FAIL with "Cannot find module './SearchBar'"

- [ ] **Step 4: Implement `SearchBar`**

`src/components/SearchBar.tsx`:
```tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      value={value}
      placeholder="Search pipelines or facilities…"
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md bg-panel border border-line px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal"
    />
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- SearchBar`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/Legend.tsx src/components/SearchBar.tsx src/components/SearchBar.test.tsx
git commit -m "feat: add Legend and SearchBar components"
```

---

## Task 12: `ContractsView` Component

**Files:**
- Create: `src/components/ContractsView.tsx`
- Test: `src/components/ContractsView.test.tsx`

**Interfaces:**
- Consumes: `ContractsData`, `ContractRow`, `CfdRow`, `QuarterlyCapacity` types (Task 5); `contracts.json` (Task 5).
- Produces: `<ContractsView data={contracts} search={search} />`, consumed by `App.tsx` (Task 13).

- [ ] **Step 1: Write failing test**

`src/components/ContractsView.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContractsView } from "./ContractsView";
import contracts from "../data/contracts.json";
import type { ContractsData } from "../data/contracts";

describe("ContractsView", () => {
  it("renders Supply, Demand and CFD sections with real contract names", () => {
    render(<ContractsView data={contracts as ContractsData} search="" />);
    expect(screen.getByText("Supply")).toBeInTheDocument();
    expect(screen.getByText("Demand")).toBeInTheDocument();
    expect(screen.getByText("CFDs")).toBeInTheDocument();
    expect(screen.getByText("Woodside GSA")).toBeInTheDocument();
    expect(screen.getByText("Arrow GSA (ongoing)")).toBeInTheDocument();
  });

  it("filters rows by the search query", () => {
    render(<ContractsView data={contracts as ContractsData} search="woodside" />);
    expect(screen.getByText("Woodside GSA")).toBeInTheDocument();
    expect(screen.queryByText("Arrow GSA (ongoing)")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ContractsView`
Expected: FAIL with "Cannot find module './ContractsView'"

- [ ] **Step 3: Implement `ContractsView`**

`src/components/ContractsView.tsx`:
```tsx
import type { ContractsData, ContractRow } from "../data/contracts";

interface ContractsViewProps {
  data: ContractsData;
  search: string;
}

function matches(row: ContractRow, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    row.contractName.toLowerCase().includes(q) ||
    row.section.toLowerCase().includes(q) ||
    row.deliveryPoints.toLowerCase().includes(q)
  );
}

function ContractCard({ row }: { row: ContractRow }) {
  return (
    <div className="rounded-md border border-line bg-panel p-3">
      <p className="text-sm font-semibold text-slate-100">{row.contractName}</p>
      <p className="text-xs text-slate-400">{row.section}</p>
      <dl className="mt-2 text-xs text-slate-300 grid grid-cols-2 gap-x-3 gap-y-1">
        <div><dt className="inline text-slate-500">Start: </dt><dd className="inline">{row.startDate}</dd></div>
        <div><dt className="inline text-slate-500">End: </dt><dd className="inline">{row.endDate}</dd></div>
        {row.acq && <div><dt className="inline text-slate-500">ACQ: </dt><dd className="inline">{row.acq}</dd></div>}
        {row.mdq && <div><dt className="inline text-slate-500">MDQ: </dt><dd className="inline">{row.mdq}</dd></div>}
        {row.totalAcq && <div><dt className="inline text-slate-500">Total ACQ: </dt><dd className="inline">{row.totalAcq}</dd></div>}
        {row.topPercent && <div><dt className="inline text-slate-500">ToP: </dt><dd className="inline">{row.topPercent}</dd></div>}
        <div className="col-span-2"><dt className="inline text-slate-500">Delivery: </dt><dd className="inline">{row.deliveryPoints}</dd></div>
        <div className="col-span-2"><dt className="inline text-slate-500">Price: </dt><dd className="inline">{row.price}</dd></div>
        {row.other && <div className="col-span-2"><dt className="inline text-slate-500">Other: </dt><dd className="inline">{row.other}</dd></div>}
      </dl>
    </div>
  );
}

export function ContractsView({ data, search }: ContractsViewProps) {
  const supply = data.supply.filter((r) => matches(r, search));
  const demand = data.demand.filter((r) => matches(r, search));

  return (
    <div className="p-4 space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Supply</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {supply.map((row) => (
            <ContractCard key={row.id} row={row} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Demand</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {demand.map((row) => (
            <ContractCard key={row.id} row={row} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">CFDs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-slate-400">
              <tr>
                <th className="pr-3 py-1">Start</th>
                <th className="pr-3 py-1">End</th>
                <th className="pr-3 py-1">B/S</th>
                <th className="pr-3 py-1">Strike</th>
                <th className="pr-3 py-1">GJ</th>
                <th className="pr-3 py-1">Counterparty</th>
                <th className="pr-3 py-1">Market</th>
                <th className="pr-3 py-1">Trade Date</th>
                <th className="pr-3 py-1">Comments</th>
              </tr>
            </thead>
            <tbody>
              {[...data.cfds.sell, ...data.cfds.buy].map((cfd, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="pr-3 py-1">{cfd.startDate}</td>
                  <td className="pr-3 py-1">{cfd.endDate}</td>
                  <td className="pr-3 py-1">{cfd.buySell === 1 ? "Buy" : "Sell"}</td>
                  <td className="pr-3 py-1">{cfd.strike}</td>
                  <td className="pr-3 py-1">{cfd.volumeGJ}</td>
                  <td className="pr-3 py-1">{cfd.counterparty}</td>
                  <td className="pr-3 py-1">{cfd.marketRegion}</td>
                  <td className="pr-3 py-1">{cfd.tradeDate}</td>
                  <td className="pr-3 py-1">{cfd.comments ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Quarterly Capacity (Syd Buy / Vic Sell, TJ/day)</h2>
        <table className="text-xs text-left text-slate-300">
          <thead className="text-slate-400">
            <tr>
              <th className="pr-6 py-1">Period</th>
              <th className="pr-6 py-1">Syd Buy</th>
              <th className="pr-6 py-1">Vic Sell</th>
            </tr>
          </thead>
          <tbody>
            {data.quarterlyCapacity.map((q) => (
              <tr key={q.period} className="border-t border-line">
                <td className="pr-6 py-1">{q.period}</td>
                <td className="pr-6 py-1">{q.sydBuyTJDay.toLocaleString()}</td>
                <td className="pr-6 py-1">{q.vicSellTJDay.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- ContractsView`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ContractsView.tsx src/components/ContractsView.test.tsx
git commit -m "feat: add ContractsView component"
```

---

## Task 13: Wire Up `App.tsx` (Tabs, Toggles, Theme)

**Files:**
- Modify: `src/App.tsx` (replaces Task 1's placeholder)
- Modify: `src/App.test.tsx` (replaces Task 1's placeholder test)
- Modify: `src/main.tsx` (wrap with `AppStateProvider`)

**Interfaces:**
- Consumes: everything from Tasks 2–12 (`AppStateProvider`/`useAppState`, `SchematicMap`, `GeoMap`, `DetailPanel`, `Legend`, `SearchBar`, `ContractsView`, region JSON data, `contracts.json`).
- Produces: the assembled app — nothing further consumes this; Task 14 verifies it manually.

- [ ] **Step 1: Write failing `App` test**

Replace `src/App.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- App.test`
Expected: FAIL (current `App` doesn't render any of this yet)

- [ ] **Step 3: Implement `App.tsx`**

```tsx
import { useState } from "react";
import { useAppState } from "./state/AppState";
import { SchematicMap } from "./components/SchematicMap";
import { GeoMap } from "./components/GeoMap";
import { DetailPanel } from "./components/DetailPanel";
import { Legend } from "./components/Legend";
import { SearchBar } from "./components/SearchBar";
import { ContractsView } from "./components/ContractsView";

import eastNodes from "./data/east/nodes.json";
import eastPipelines from "./data/east/pipelines.json";
import westNodes from "./data/west/nodes.json";
import westPipelines from "./data/west/pipelines.json";
import contracts from "./data/contracts.json";

import type { PipelineNode, Pipeline } from "./types";
import type { ContractsData } from "./data/contracts";

type Tab = "map" | "contracts";

export default function App() {
  const { region, view, selection, search, setRegion, setView, select, clearSelection, setSearch } = useAppState();
  const [tab, setTab] = useState<Tab>("map");

  const nodes = (region === "east" ? eastNodes : westNodes) as PipelineNode[];
  const pipelines = (region === "east" ? eastPipelines : westPipelines) as Pipeline[];

  const tabButtonClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium ${active ? "bg-teal text-ink" : "bg-panel text-slate-300 hover:text-slate-100"}`;

  return (
    <div className="min-h-screen bg-ink text-slate-100 flex flex-col">
      <header className="border-b border-line p-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold mr-4">Gas Pipeline Network</h1>

        <button className={tabButtonClass(tab === "map" && region === "east")} onClick={() => { setTab("map"); setRegion("east"); }}>
          East Coast
        </button>
        <button className={tabButtonClass(tab === "map" && region === "west")} onClick={() => { setTab("map"); setRegion("west"); }}>
          West Coast
        </button>
        <button className={tabButtonClass(tab === "contracts")} onClick={() => setTab("contracts")}>
          FY26 Contracts
        </button>

        {tab === "map" && (
          <div className="flex items-center gap-2 ml-auto">
            <button className={tabButtonClass(view === "schematic")} onClick={() => setView("schematic")}>Schematic</button>
            <button className={tabButtonClass(view === "geo")} onClick={() => setView("geo")}>Geographic</button>
          </div>
        )}
      </header>

      <div className="p-3 border-b border-line">
        <div className="max-w-md">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </div>

      <main className="flex-1 relative overflow-hidden">
        {tab === "map" ? (
          <>
            <div className="absolute left-3 top-3 z-10 bg-panel/90 border border-line rounded-md p-3">
              <Legend />
            </div>
            <div className="w-full h-full">
              {view === "schematic" ? (
                <SchematicMap
                  nodes={nodes}
                  pipelines={pipelines}
                  selection={selection}
                  onSelectNode={(id) => select({ kind: "node", id })}
                  onSelectPipeline={(id) => select({ kind: "pipeline", id })}
                />
              ) : (
                <GeoMap
                  nodes={nodes}
                  pipelines={pipelines}
                  selection={selection}
                  onSelectNode={(id) => select({ kind: "node", id })}
                  onSelectPipeline={(id) => select({ kind: "pipeline", id })}
                />
              )}
            </div>
            <DetailPanel selection={selection} nodes={nodes} pipelines={pipelines} onSelect={select} onClose={clearSelection} />
          </>
        ) : (
          <div className="h-full overflow-y-auto">
            <ContractsView data={contracts as ContractsData} search={search} />
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Wrap the app with `AppStateProvider` in `main.tsx`**

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppStateProvider } from "./state/AppState";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </StrictMode>
);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- App.test`
Expected: PASS (4 tests)

- [ ] **Step 6: Run the full test suite**

Run: `npm run test`
Expected: PASS (all tests across all tasks)

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/main.tsx
git commit -m "feat: wire up App with region/view tabs, search, and contracts view"
```

---

## Task 14: Manual Verification Pass

**Files:** none (verification only — per spec's Testing section, v1 doesn't need automated e2e/browser tests; this is the documented manual pass).

**Interfaces:** none — this task consumes the fully wired app from Task 13 and produces nothing further.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`, open the printed local URL in a browser.

- [ ] **Step 2: East Coast schematic checklist**

- [ ] Page loads on East Coast / Schematic by default, no console errors.
- [ ] Click Wallumbilla Hub — detail panel opens with its description and lists SWQP, QGP-adjacent (PPL 90), RBP, PPL 134 as connected pipelines.
- [ ] Click the SWQP line — detail panel switches to show SWQP's description and Ballera/Gooimbah/Wallumbilla as route nodes.
- [ ] Pipeline lines show the subtle animated flow effect.
- [ ] Pan and zoom the canvas (drag, scroll/pinch) — works smoothly.
- [ ] Type "moomba" in the search box — no errors (search is informational at v1; full highlight-filtering can be a fast-follow, not blocking).
- [ ] Close the detail panel via the Close button.

- [ ] **Step 3: East Coast geographic checklist**

- [ ] Click "Geographic" — map re-renders with nodes positioned per their approximate real-world locations (Brisbane-area nodes cluster north-east, Adelaide/Melbourne south).
- [ ] Click a node and a pipeline — detail panel opens correctly in this view too.

- [ ] **Step 4: West Coast checklist**

- [ ] Click "West Coast" — map switches to the 15 WA nodes / 10 WA pipelines, detail panel closes.
- [ ] Click Dampier Hub — shows DBP, GGP, and Pilbara Pipeline System as connected.
- [ ] Toggle Schematic ↔ Geographic — both render correctly for the west region.

- [ ] **Step 5: FY26 Contracts checklist**

- [ ] Click "FY26 Contracts" — Supply, Demand, CFDs and Quarterly Capacity sections all render with real data (spot-check Woodside GSA $14.35, Arrow GSA $10.35/$10.95/$11.10, Delta TN2 Wilton STTM).
- [ ] Search box filters the Supply/Demand cards by contract name.

- [ ] **Step 6: Responsive/theme check**

- [ ] Resize the browser to a narrow width — header wraps sensibly, map canvas still usable.
- [ ] Confirm dark theme renders consistently (no unstyled/white flashes).

- [ ] **Step 7: Production build check**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors, `dist/` is produced.

- [ ] **Step 8: Commit any fixes found during manual verification**

If Steps 2–7 surface bugs, fix them with normal small commits (`fix: ...`) before considering the plan complete. If everything passes cleanly, no commit is needed for this task.

---

## Self-Review Notes

- **Spec coverage:** Region toggle (Task 13), Schematic/Geographic toggle (Tasks 8, 9, 13), click-to-read-more (Task 10), flow animation (Task 7), legend (Task 11), search (Task 11/13), FY26 Contracts tab (Task 12), dark theme (Tasks 1, 13) — all spec sections have a task. Data-integrity testing (spec's Testing section) covered in Tasks 3–5.
- **Placeholder scan:** no TBD/TODO; all JSON/code blocks contain real, final content.
- **Type consistency:** `Selection`, `PipelineNode`, `Pipeline`, `Region`, `NodeType`, `PipelineColor` (Task 2) used identically by `PipelineLine`/`NodeMarker` (Task 7), `selectors.ts` (Task 8), `SchematicMap`/`GeoMap` (Tasks 8–9), `DetailPanel` (Task 10), and `App.tsx` (Task 13). `ContractsData`/`ContractRow`/`CfdRow`/`QuarterlyCapacity` (Task 5) used identically by `ContractsView` (Task 12) and `App.tsx` (Task 13).
- **Known simplification (documented, not a gap):** node `connections` are derived at runtime via `getConnectedPipelines`/`getConnectedNodes` (Task 8) rather than hand-maintained as a `connections: string[]` field on each node, as the spec's data model sketch suggested — this avoids data drift between `nodes.json` and `pipelines.json` and is strictly simpler to keep correct.
