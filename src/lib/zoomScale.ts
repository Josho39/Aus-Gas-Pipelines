/**
 * Zoom-driven sizing for everything drawn on the geographic map.
 *
 * The map is zoomed by a CSS transform applied to the whole SVG, so a shape
 * drawn at 10 user units covers 10 * scale pixels on screen: at 8x zoom a
 * 9.5px label is 76px of text and a dense basin becomes a wall of overlap.
 * Dividing each size by the zoom cancels that growth out: exponent 1 holds
 * a thing at a constant width in screen pixels however far in you go, and
 * an exponent above 1 shrinks it beyond that. The exponents below sit at or
 * just above 1 - enough that a crowded cluster opens up as you push into
 * it, without the detail dwindling away to something you have to squint at.
 *
 * This replaced a set of discrete zoom "tiers" (shrink a step on crossing
 * 1.8, then 3.2, then 6). Between two thresholds everything still visibly
 * ballooned, then snapped down a step on crossing one. Sizing off a
 * continuous curve has no steps to snap across, so every scroll click
 * shrinks things by a little instead of nothing-then-a-lot.
 */

/** Global size multiplier for the detail drawn on top of the map: labels,
 * node dots, pipeline strokes. Everything below is expressed as its
 * original size times this, so one number moves the whole set at every zoom
 * level at once, rather than each size drifting out of proportion with the
 * others. The coastline is deliberately not included - it's a backdrop, and
 * thickening it just muddies what's drawn over it. */
export const DETAIL_SCALE = 1.3;

/** Rounding applied to the raw zoom scale before it reaches React state.
 * `onTransform` fires on every frame of a pan/pinch gesture, and storing an
 * unrounded scale would re-render the whole map tree dozens of times a
 * second (the jank the tiers were originally introduced to avoid). Rounding
 * means a pan, which doesn't change the scale at all, bails out of setState
 * via Object.is, while any real zoom change still gets through: the wheel's
 * own step is 0.2, ten times this quantum. */
const ZOOM_QUANTUM = 0.02;

export function quantizeZoom(scale: number): number {
  return Math.round(scale / ZOOM_QUANTUM) * ZOOM_QUANTUM;
}

/** `zoom ** -exponent`, clamped. Zooming out below the initial fit doesn't
 * inflate anything: the un-zoomed sizes are already as large as we ever
 * want to draw.
 *
 * The lower clamp is a backstop against a degenerate zero, not a working
 * floor: it sits below what the curve reaches at maxScale, deliberately.
 * A floor that engaged inside the usable range would pin a size in *user
 * units*, and user units are themselves multiplied by the zoom, so past
 * that point the thing would start growing on screen again - exactly the
 * ballooning all of this exists to cancel out. */
function zoomFactor(zoom: number, exponent: number, min: number): number {
  const factor = Math.max(zoom, 1) ** -exponent;
  return Math.min(1, Math.max(min, factor));
}

/** Multiplier for text, label boxes and the offsets that position them.
 * Exponent 1: a name holds the same size on screen at every zoom. Text is
 * the one thing here with a hard lower bound on being useful - past about
 * 8px it stops being readable - so it gives up its size to the map rather
 * than shrinking in absolute terms as well. */
export function labelScale(zoom: number): number {
  return DETAIL_SCALE * zoomFactor(zoom, 1, 0.005);
}

/** Multiplier for pipeline stroke widths and dash lengths. Thins slightly
 * as you go in, unlike the text: overlapping lines smear into one another
 * sooner than overlapping labels do, and a thinner line also places a route
 * more precisely once you're close enough to care where it actually runs. */
export function lineScale(zoom: number): number {
  return DETAIL_SCALE * zoomFactor(zoom, 1.12, 0.005);
}

/** Node dot radius in user units (a size, not a multiplier). The dots start
 * out proportionally much larger than the text, so they can afford to give
 * up a little more than it does. */
export function markerRadius(zoom: number): number {
  return 6.5 * DETAIL_SCALE * zoomFactor(zoom, 1.1, 0.005);
}

/** Multiplier for the coastline stroke. Held at a constant on-screen width
 * (exponent 1) rather than shrinking like the data drawn on top of it: it's
 * a backdrop, and it should neither thicken into a band nor thin away to
 * nothing as the viewer moves through the zoom range. */
export function outlineScale(zoom: number): number {
  return zoomFactor(zoom, 1, 0.005);
}

/** Fade-in for detail that stays hidden until the viewer zooms past
 * `threshold` (minor laterals, minor facility labels). 0 below the
 * threshold, ramping to 1 over the next `ramp` of zoom, so that detail
 * arrives over a few scroll clicks rather than the whole set popping into
 * existence on one. */
export function revealOpacity(zoom: number, threshold: number, ramp = 0.6): number {
  if (zoom <= threshold) return 0;
  return Math.min(1, (zoom - threshold) / ramp);
}
