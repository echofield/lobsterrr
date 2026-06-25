/*
  KeyboardSource — fallback + controller input. Emits the SAME IntentBus events
  as the hand will, so the room stays a pure listener.

    1..4 / Digit1..4    TRIGGER a zone's loop
    ↑ ↓ ← →             MOVE the selection between instruments (spatial)
    Enter               OPEN the selected instrument (its VST panel)
    Space               TRIGGER the selected instrument's loop

  (Filter lives on the pointer — mouse Y — so the arrows are free to navigate.)
*/

import { bus, Intent } from '../intentBus.js';
import { ZONE_BY_KEY, ZONES } from '../zones.js';

// 2-D selection grid built from the zones' floor positions (rows by y, cols by x)
const GRID = [...new Set(ZONES.map((z) => z.at.y))].sort((a, b) => a - b)
  .map((y) => ZONES.filter((z) => z.at.y === y).sort((a, b) => a.at.x - b.at.x));

export function startKeyboardSource() {
  let focused = ZONES[0].id;
  let r = 0, c = 0, navOn = false;
  const curId = () => GRID[r][c].id;

  bus.on(Intent.ZONE_ENTER, (id) => { focused = id; });

  const nav = (dr, dc) => {
    const prev = navOn ? curId() : null;
    if (navOn) {
      r = Math.max(0, Math.min(GRID.length - 1, r + dr));
      c = Math.max(0, Math.min(GRID[r].length - 1, c + dc));
    }
    navOn = true;
    if (prev && prev !== curId()) bus.emit(Intent.ZONE_EXIT, prev);
    bus.emit(Intent.ZONE_ENTER, curId());
  };

  const onKey = (e) => {
    // yield to modal overlays / text fields
    if (document.getElementById('creator')?.classList.contains('on')) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;

    const zone = ZONE_BY_KEY[e.code];
    if (zone) { bus.emit(Intent.TRIGGER, zone.id); focused = zone.id; e.preventDefault(); return; }

    switch (e.code) {
      case 'ArrowUp': nav(-1, 0); e.preventDefault(); break;
      case 'ArrowDown': nav(1, 0); e.preventDefault(); break;
      case 'ArrowLeft': nav(0, -1); e.preventDefault(); break;
      case 'ArrowRight': nav(0, 1); e.preventDefault(); break;
      case 'Enter': if (navOn) { bus.emit(Intent.OPEN, focused); } e.preventDefault(); break;
      case 'Space': bus.emit(Intent.TRIGGER, focused); e.preventDefault(); break;
      default: break;
    }
  };

  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
