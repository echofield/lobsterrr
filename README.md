# LOBSTER — Hybrid Pixel Studio

A web-native, hand-controlled pixel twin of the Lobster control room. The room is
the instrument; your hand is the player. One runtime: hand → game → sound, all JS
in one browser tab. No Unity, no OSC bridge.

This is ARCHÉ's V26 Spatial Looper getting its first real room. It is a **sibling**
of the ASTROLAB instrument in `../handmade` — it harvests that project's proven
MediaPipe gesture brain, but ships as its own Phaser pixel game. `../handmade`
stays untouched. (Distinct from `../lobster`, the studio's agenda/booking site.)

## Architecture — the spine

```
sources  ──emit──►  IntentBus  ──►  RoomScene   (Phaser render, pure listener)
                              └─►  AudioEngine  (Tone.js,  pure listener)
```

Input adapters are interchangeable. The room and the audio engine never know
whether an intent came from a hand, a key, or a mouse.

- `src/intentBus.js` — the single event bus. `ZONE_ENTER/EXIT · TRIGGER · MODULATE · MOVE`.
- `src/zones.js` — the four instrument zones (Kawai / RE-909 / Minimoog / booth), all A minor.
- `src/sources/keyboardSource.js` — keys 1–4 trigger, ↑↓ filter. Fallback + dev loop.
- `src/sources/pointerSource.js` — mouse → MOVE + filter; click-in-zone → TRIGGER.
- `src/sources/gestureSource.js` — hand adapter. **Opt-in.** Scaffold stub; M2 ports `handmade/hands.js`.
- `src/engine/audioEngine.js` — Tone.Transport quantized looper, per-zone gate, global filter.
- `src/scenes/roomScene.js` — faux-iso placeholder render; swapped for Aseprite heroes later.

## Run

```bash
npm install
npm run dev      # http://localhost:5173  — localhost is a secure context, camera works
```

Playable on keyboard with no camera. Press **1–4** to lock loops in/out; combine
freely — it stays in A minor. Move the mouse to sweep the filter. The **enable
camera** button is progressive enhancement (wired in M2).

## Status

- **M0 — scaffold** ✅ Vite + Phaser + Tone + MediaPipe pinned; IntentBus + keyboard + pointer; black iso room; four A-minor quantized loops play on keys.
- **M1 — gesture** ▢ lift `HandLandmarker` + gesture detection from `handmade/hands.js` into `gestureSource.js`; pinch = TRIGGER, palm = MOVE, height = MODULATE.
- **M2 — Pixel Bible room** ▢ first art-directed iso room (Aseprite hero gear) per the Lobster Pixel Bible.
- **M3 — ship** ▢ Vercel — first shareable playable link.
