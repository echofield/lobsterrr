/*
  IntentBus — the single spine.

  Input sources EMIT; the room + the audio engine LISTEN. Neither the room
  nor the audio engine ever knows whether an intent came from a hand, a key,
  or a mouse. Hand and keyboard are interchangeable adapters.

  This is a thin projection of ASTROLAB's "Field" idea: inputs write,
  readers read. Events are deliberately a small, musical vocabulary.

  Events:
    ZONE_ENTER(id)            cursor entered an instrument zone
    ZONE_EXIT(id)             cursor left an instrument zone
    TRIGGER(id)               toggle a zone's quantized loop
    MODULATE(param, value)    continuous control, value 0..1 (e.g. 'filter')
    MOVE(x, y)                cursor / avatar position, normalised 0..1
*/

export const Intent = {
  ZONE_ENTER: 'ZONE_ENTER',
  ZONE_EXIT: 'ZONE_EXIT',
  TRIGGER: 'TRIGGER',
  MODULATE: 'MODULATE',
  MOVE: 'MOVE',
  OPEN: 'OPEN',   // zoom into an instrument's fullscreen VST panel
  CLOSE: 'CLOSE', // back to the room
};

class IntentBus {
  #listeners = new Map(); // event -> Set<fn>

  on(event, fn) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(fn);
    return () => this.#listeners.get(event)?.delete(fn);
  }

  emit(event, ...args) {
    const set = this.#listeners.get(event);
    if (!set) return;
    for (const fn of set) fn(...args);
  }
}

// One shared instance for the whole runtime.
export const bus = new IntentBus();
