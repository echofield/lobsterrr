/*
  KeyboardSource — play actions + the loop hotkeys. Emits the SAME IntentBus
  events as the hand will, so the room stays a listener.

    1..4 / Digit1..4    TRIGGER a zone's loop directly
    Enter               OPEN the instrument the producer is standing by
    Space               TRIGGER that instrument's loop

  Movement (arrow keys → walking the producer) lives in the room's update loop;
  the room emits ZONE_ENTER/EXIT as the producer nears gear, which sets `focused`
  here. Filter lives on the pointer (mouse Y).
*/

import { bus, Intent } from '../intentBus.js';
import { ZONE_BY_KEY } from '../zones.js';

export function startKeyboardSource() {
  let focused = null; // the instrument currently in reach (set by proximity / hover)

  bus.on(Intent.ZONE_ENTER, (id) => { focused = id; });
  bus.on(Intent.ZONE_EXIT, (id) => { if (focused === id) focused = null; });

  const onKey = (e) => {
    // yield to modal overlays / text fields
    if (document.getElementById('creator')?.classList.contains('on')) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;

    const zone = ZONE_BY_KEY[e.code];
    if (zone) { bus.emit(Intent.TRIGGER, zone.id); e.preventDefault(); return; }

    if (e.code === 'Enter') { if (focused) bus.emit(Intent.OPEN, focused); e.preventDefault(); }
    else if (e.code === 'Space') { if (focused) bus.emit(Intent.TRIGGER, focused); e.preventDefault(); }
  };

  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
