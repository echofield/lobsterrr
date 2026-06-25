/*
  PointerSource — mouse / touch as a continuous adapter. Drives the cursor and
  the global filter so a no-camera visitor still gets the spatial feel.

    pointer move    MOVE(x, y)   normalised over the canvas
                    MODULATE('filter', 1 - y)  (top of room = open filter)
    pointer down    TRIGGER on whatever zone the cursor is over (handled by
                    the room's hit-test, which emits ZONE_ENTER; Space/click
                    then triggers it). Here we emit TRIGGER on click-in-zone.

  It is given a hit-test fn (x,y normalised) -> zoneId|null so it stays the only
  place that turns a click into a TRIGGER, keeping the room a pure listener.
*/

import { bus, Intent } from '../intentBus.js';

export function startPointerSource(canvas, hitTest) {
  const norm = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  let inside = null;

  const onMove = (e) => {
    const { x, y } = norm(e);
    bus.emit(Intent.MOVE, x, y);
    bus.emit(Intent.MODULATE, 'filter', 1 - y);
    const z = hitTest(x, y);
    if (z !== inside) {
      if (inside) bus.emit(Intent.ZONE_EXIT, inside);
      if (z) bus.emit(Intent.ZONE_ENTER, z);
      inside = z;
    }
  };

  // click an instrument = zoom into its fullscreen VST panel.
  // (keys 1-4 stay the quick loop-toggle from the room overview.)
  const onDown = (e) => {
    const { x, y } = norm(e);
    const z = hitTest(x, y);
    if (z) bus.emit(Intent.OPEN, z);
  };

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  return () => {
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onDown);
  };
}
