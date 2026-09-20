import { useControls, useTransformContext } from "react-zoom-pan-pinch";
import { BUTTON_ZOOM_STEP } from "../lib/wheelZoom";

/** Explicit +/−/reset zoom buttons, since relying on scroll-wheel or pinch
 * alone (the map's only zoom affordance before this) isn't discoverable,
 * most people don't think to scroll on a map, and there was no visible way
 * to zoom in on a touchpad-less desktop. Must render as a child of
 * `TransformWrapper` (it uses `useControls`, which reads that context). */
export function MapZoomControls() {
  const { zoomToPoint, resetTransform, centerView } = useControls();
  const context = useTransformContext();

  // Multiply rather than add, to match the wheel (see ../lib/wheelZoom):
  // the library's own zoomIn/zoomOut add a fixed amount to the scale, which
  // makes a button click do less and less the further in you already are.
  // Anchored on the middle of the map, since a button has no cursor to
  // zoom towards.
  const zoomBy = (factor: number) => {
    const wrapper = context.wrapperComponent;
    if (!wrapper) return;
    const box = wrapper.getBoundingClientRect();
    zoomToPoint(context.state.scale * factor, box.left + box.width / 2, box.top + box.height / 2, 0);
  };

  const buttonClass =
    "flex items-center justify-center w-9 h-9 text-fg bg-panel hover:bg-ink transition-colors first:rounded-t-md last:rounded-b-md";

  return (
    <div className="absolute left-3 bottom-3 z-10 flex flex-col border border-line rounded-md shadow-lg overflow-hidden divide-y divide-line">
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        className={buttonClass}
        onClick={() => zoomBy(BUTTON_ZOOM_STEP)}
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
        onClick={() => zoomBy(1 / BUTTON_ZOOM_STEP)}
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
          // Unanimated, like the zoom steps above: the map re-renders on
          // every transform frame, which cuts an animated transform short
          // partway and leaves the view where it happened to stop.
          resetTransform(0);
          centerView(1, 0);
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
