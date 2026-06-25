/*
  GestureSource — the hand adapter. Camera is OPT-IN: nothing here runs until
  enableCamera() is called from the "enable camera" button. The public build is
  fully playable without it.

  ── STATUS: scaffold stub ─────────────────────────────────────────────────
  The gesture brain is harvested from the existing ASTROLAB instrument
  (Desktop/02_PROJECTS/handmade/hands.js, 86KB of proven MediaPipe logic):
  pinch threshold, palm centroid, hand-height -> param, 640x480@30 capture
  tuning, smoothing. This file is where that layer lands.

  The mapping to IntentBus (do NOT change the events — they are the contract):
    pinch (thumb-index distance < threshold)  -> TRIGGER(zoneOverPalm)
    palm centroid                              -> MOVE(x, y)   (drives cursor)
    hand height (palm y)                       -> MODULATE('filter', 1 - y)

  Next step (M2): import { HandLandmarker, FilesetResolver } and port the
  landmark->gesture functions from hands.js verbatim, then emit the events
  below. Until then enableCamera() throws a clear "not wired yet" so the UI
  can fall back to keyboard/pointer.
*/

import { bus, Intent } from '../intentBus.js';

let active = false;

export function isCameraActive() {
  return active;
}

export async function enableCamera(/* { hitTest } */) {
  // TODO(M2): lift HandLandmarker setup + gesture detection from hands.js.
  // The emit contract this must satisfy, for reference:
  //   bus.emit(Intent.MOVE, palm.x, palm.y);
  //   bus.emit(Intent.MODULATE, 'filter', 1 - palm.y);
  //   if (pinchClosed) bus.emit(Intent.TRIGGER, hitTest(palm.x, palm.y));
  throw new Error('GestureSource not wired yet — port hands.js in M2. Keyboard/pointer remain live.');
}

export function disableCamera() {
  active = false;
}

// referenced so the contract symbols stay live for the M2 port
void [bus, Intent];
