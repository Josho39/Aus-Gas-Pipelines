import { useControls } from "react-zoom-pan-pinch";

/** Explicit +/−/reset zoom buttons, since relying on scroll-wheel or pinch
 * alone (the map's only zoom affordance before this) isn't discoverable,
 * most people don't think to scroll on a map, and there was no visible way
 * to zoom in on a touchpad-less desktop. Must render as a child of
 * `TransformWrapper` (it uses `useControls`, which reads that context). */
export function MapZoomControls() {
  const { zoomIn, zoomOut, resetTransform, centerView } = useControls();

  const buttonClass =
    "flex items-center justify-center w-9 h-9 text-fg bg-panel hover:bg-ink transition-colors first:rounded-t-md last:rounded-b-md";

  return (
    <div className="absolute right-3 bottom-3 z-10 flex flex-col border border-line rounded-md shadow-lg overflow-hidden divide-y divide-line">
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        className={buttonClass}
        onClick={() => zoomIn(0.5, 150)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        className={buttonClass}
        onClick={() => zoomOut(0.5, 150)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Reset view"
        title="Reset view"
        className={buttonClass}
        onClick={() => {
          resetTransform(200);
          centerView(1, 200);
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 1 3 6.7" />
          <path d="M3 21v-6h6" />
        </svg>
      </button>
    </div>
  );
}
