/*
  KeyboardSource — the fallback and dev loop. Emits the SAME IntentBus events
  as the hand will. This is the default for the public build (no camera).

    1..4 / Digit1..4   TRIGGER a zone's loop
    ArrowUp / ArrowDown  MODULATE('filter', value)  (steps the global filter)
    Space               TRIGGER the most recently entered zone
*/

import { bus, Intent } from '../intentBus.js';
import { ZONE_BY_KEY, ZONES } from '../zones.js';

export function startKeyboardSource() {
  let filter = 0.6;        // global filter 0..1
  let focused = ZONES[0].id; // last zone touched, for Space

  bus.on(Intent.ZONE_ENTER, (id) => { focused = id; });

  const onKey = (e) => {
    // hand the keyboard to modal overlays / text fields instead of the room
    if (document.getElementById('creator')?.classList.contains('on')) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;

    const zone = ZONE_BY_KEY[e.code];
    if (zone) {
      bus.emit(Intent.TRIGGER, zone.id);
      focused = zone.id;
      e.preventDefault();
      return;
    }
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      filter = Math.max(0, Math.min(1, filter + (e.code === 'ArrowUp' ? 0.08 : -0.08)));
      bus.emit(Intent.MODULATE, 'filter', filter);
      e.preventDefault();
      return;
    }
    if (e.code === 'Space') {
      bus.emit(Intent.TRIGGER, focused);
      e.preventDefault();
    }
  };

  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
