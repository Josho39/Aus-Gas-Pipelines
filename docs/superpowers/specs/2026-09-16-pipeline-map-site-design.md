# East/West Coast Gas Pipeline Interactive Map — Design

## Purpose

An internal team website that visualises Australia's east coast (NEM) and
west coast (WEM) gas pipeline networks as an interactive, click-to-explore
map/diagram, plus a reference view of the FY26 supply/demand/CFD contract
book. Source material is `Gas1.xlsx` (three sheets: `East MAP`, `WA Map`,
`FY26 Contracts`), built as Excel shape diagrams (lines, connectors, text
boxes), not tabular data.

Audience: the user's team. Not public-facing. Will eventually deploy to
Vercel or Railway, but no further access-control requirements were raised.

## Source Material Notes

- `East MAP` sheet: NEM pipeline network — Moomba, Ballera, SWQP, MSP, MCF,
  RBP, EGP, QGP, MAP, TGP, PCA/PCI, PPL 90/133/134, STTM hubs (BRI, SYD,
  ADL), LNG export facilities (GLNG, APLNG, QGC, Curtis Island), compressor
  stations, and a "2026 gas flow overview" supply/demand annotation panel.
  Marked *Classification: CONFIDENTIAL* in the source file.
- `WA Map` sheet: WEM pipeline network — PGP, DBP, GGP, Telfer Gas Pipeline,
  Pilbara Pipeline System, Mid West Pipeline, Eastern/Northern Goldfields
  systems, Kambalda/Esperance laterals, Perth metro. Marked *Classification:
  INTERNAL*.
- `FY26 Contracts` sheet: tabular supply/demand/CFD contract data by region
  (VIC, QLD, NSW/SA), with counterparties, prices, MDQ, delivery points.
- Confirmed with user: fine for team visibility, no need to keep private or
  scrub commercial figures. Rendered blueprint exports (used only as a
  reference for hand-authoring the site's data) are kept in
  `reference/blueprint/` in this repo.
- Because the Excel diagrams are ~270+ raw shapes each (many purely
  decorative — valve symbols, arrowheads, connector jogs), the site's node/
  pipeline data will be **hand-authored** against the rendered blueprint
  images/PDFs rather than programmatically parsed from the XML. This trades
  a bit of extraction speed for a clean, well-structured dataset.

## Architecture

- **Stack:** React 18 + TypeScript + Vite. Tailwind CSS for styling.
  Framer Motion for transitions/flow animations. A pan/zoom wrapper
  (`react-zoom-pan-pinch`) for the map canvas.
- **Static site**, no backend. All pipeline/node/contract data ships as
  bundled JSON. Deploys as a static build to Vercel or Railway later with
  no code changes needed.
- **Routing:** simple client-side view state (not full router) — top-level
  tabs: `East Coast`, `West Coast`, `FY26 Contracts`. No need for deep
  linking initially.

## Data Model

`src/data/<region>/nodes.json` — one entry per hub/plant/town/compressor
station/demand point:

```ts
type Node = {
  id: string;
  name: string;
  type: "hub" | "plant" | "compressor" | "sttm" | "lng" | "town" | "interconnect";
  region: "east" | "west";
  schematicPos: { x: number; y: number }; // hand-placed, for diagram layout
  geoPos: { lat: number; lng: number };   // approximate real-world coords
  description: string;
  connections: string[]; // pipeline ids touching this node
};
```

`src/data/<region>/pipelines.json` — one entry per pipeline/lateral:

```ts
type Pipeline = {
  id: string;
  code: string;        // e.g. "SWQP", "MSP", "RBP", "EGP", "PGP", "DBP", "GGP"
  name: string;         // full name, e.g. "South West Queensland Pipeline"
  region: "east" | "west";
  path: string[];       // ordered node ids the line passes through
  description: string;  // general/public info: route, purpose
  operator?: string;
  lengthKm?: number;
  capacity?: string;
  style: { color: string; dashed?: boolean };
};
```

`src/data/contracts.json` — structured from the `FY26 Contracts` sheet,
grouped the same way the sheet is: `supply[]`, `demand[]`, `cfds[]`, each
row keeping the fields present in the sheet (counterparty, start/end date,
ACQ, MDQ, DCQ, ToP %, delivery point, price, other notes).

Pipeline codes get general public-domain context added where useful (e.g.
SWQP, MSP, MCF, RBP, EGP on the east coast; PGP, DBP, GGP on the west) —
operator, approximate route/length — clearly written as general knowledge,
not sourced from the confidential sheet's commercial figures.

## Components & Interactions

- **Region toggle** (East Coast / West Coast) — top-level tab.
- **View toggle** (Schematic / Geographic) per region:
  - Schematic: SVG diagram laid out like the Excel original (nodes as
    dots/boxes, pipelines as lines/curves), built from `schematicPos`.
  - Geographic: same nodes/pipelines plotted on a simplified Australia
    map background using `geoPos`.
- **Click-to-read-more:** clicking any node or pipeline line opens a side
  panel (slide-in) with name, type/code, description, and a list of
  connected pipelines/nodes (clickable to jump).
- **Flow animation:** subtle animated dash-offset or gradient sweep along
  pipeline lines to suggest gas flow — decorative, not literal direction
  data (no directional data exists in the source).
- **Legend:** color/style key for pipeline types and node types.
- **Search:** filter/highlight nodes and pipelines by name or code.
- **FY26 Contracts tab:** grouped tables (Supply / Demand / CFDs) mirroring
  the sheet's regional sections, with simple text filter — no map.

## Visual Style

Dark, modern energy-ops-dashboard theme: deep navy/slate background,
glowing teal pipeline lines for gas, amber/purple accents for LNG/export
facilities, clean sans-serif type. Should feel like a slick monitoring
dashboard rather than a recreated Excel sheet.

## Testing

- Component/interaction sanity checked by running the dev server and
  clicking through both regions, both view modes, and the contracts tab
  (per this project's UI-verification norm — no automated test framework
  needed for a v1 static site, but basic smoke checks: all node/pipeline
  click targets open a panel with real content, no broken toggle state).
- Data integrity check: every `path` id in `pipelines.json` resolves to a
  real node id (simple script/test), so nothing renders as a dangling line.

## Deployment

Out of scope for this build — user will deploy to Vercel or Railway
later. The static Vite build output (`dist/`) is deploy-ready for either
with no extra configuration.

## Out of Scope (v1)

- Real-time or live data feeds.
- User accounts/auth.
- Editing data through the UI (data changes happen by editing the JSON
  files and redeploying).
- Exhaustive 1:1 reproduction of every minor valve/arrow symbol from the
  Excel diagrams — the goal is a clean, accurate representation of the
  network topology and key facilities, not a pixel-perfect recreation.
