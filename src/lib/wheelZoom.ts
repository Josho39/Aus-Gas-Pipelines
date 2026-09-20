/**
 * Wheel-to-zoom step.
 *
 * react-zoom-pan-pinch zooms additively: every wheel click adds a fixed
 * amount to the scale. That makes zooming slower the further in you are -
 * a 0.2 step is a 20% jump at 1x and a 0.5% nudge at 40x - so crossing the
 * range took around 195 clicks, which is a lot of wheel on a mouse that
 * sends one event per detent.
 *
 * Multiplying instead keeps every click the same *proportional* step, so
 * the zoom feels the same speed wherever you are and the range takes about
 * 17 clicks to cross.
 */

/** How far one detent of a normal mouse wheel zooms: 1.25x per click. */
const STEP_PER_DETENT = 1.25;
/** What a mouse reports for one detent. Chrome sends 100, Windows 120. */
const DETENT_DELTA = 100;
/** Per-event clamp. A fast flick can report several hundred in one event,
 * and a trackpad sends a stream of small ones; without this the flick jumps
 * most of the zoom range at once. */
const MAX_DELTA = 140;

const RATE = Math.log(STEP_PER_DETENT) / DETENT_DELTA;

/** Normalises a wheel event's delta to pixels. Firefox reports lines, and
 * page-mode exists too; both need scaling before they can be compared to
 * the pixel deltas everything else sends. */
export function wheelDelta(event: { deltaY: number; deltaMode: number }): number {
  const perUnit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
  const delta = event.deltaY * perUnit;
  return Math.max(-MAX_DELTA, Math.min(MAX_DELTA, delta));
}

/** The scale one wheel event should land on, from the scale it started at. */
export function scaleAfterWheel(
  scale: number,
  event: { deltaY: number; deltaMode: number },
  minScale: number,
  maxScale: number
): number {
  const next = scale * Math.exp(-wheelDelta(event) * RATE);
  return Math.min(maxScale, Math.max(minScale, next));
}

/** Step for the +/- buttons: two wheel detents, so a click of the button
 * moves noticeably more than a click of the wheel. */
export const BUTTON_ZOOM_STEP = STEP_PER_DETENT ** 2;
