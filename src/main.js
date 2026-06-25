/*
  LOBSTER — Hybrid Pixel Studio · boot.

  Wiring: the spine (IntentBus) connects interchangeable input adapters
  (keyboard, pointer, hand) to two pure listeners (the Phaser room, the Tone
  audio engine). Neither listener knows which adapter spoke.

      sources  ──emit──►  IntentBus  ──►  RoomScene  (render)
                                      └─►  AudioEngine (sound)
*/

import Phaser from 'phaser';
import { bus, Intent } from './intentBus.js';
import { ZONES } from './zones.js';
import { RoomScene } from './scenes/roomScene.js';
import { AudioEngine } from './engine/audioEngine.js';
import { startKeyboardSource } from './sources/keyboardSource.js';
import { startPointerSource } from './sources/pointerSource.js';
import { enableCamera } from './sources/gestureSource.js';
import { VstView } from './views/vstView.js';

const W = 960, H = 600;

// ── shared geometry: normalised hit-test, used by pointer + (later) gesture ──
const HIT_R = 0.13;
function hitTest(x, y) {
  let best = null, bestD = HIT_R;
  for (const z of ZONES) {
    const d = Math.hypot(x - z.at.x, y - z.at.y);
    if (d < bestD) { bestD = d; best = z.id; }
  }
  return best;
}

// ── audio engine: pure IntentBus listener ──
const audio = new AudioEngine();
bus.on(Intent.TRIGGER, async (id) => { await audio.ensureStarted(); audio.toggle(id); });
bus.on(Intent.MODULATE, (param, v) => { if (param === 'filter') audio.setFilter(v); });

// ── fullscreen VST view: click an instrument to zoom in and play it ──
const vst = new VstView(audio);
bus.on(Intent.OPEN, async (id) => {
  await audio.ensureStarted();
  audio.activate(id);   // make it audible while you build the pattern
  vst.show(id);
});

// ── Phaser game ──
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W, height: H,
  backgroundColor: '#120a0a',
  pixelArt: true,
  scene: [RoomScene],
});

// ── input adapters: keyboard is always live; pointer binds to the canvas ──
startKeyboardSource();
game.events.once('ready', () => {
  startPointerSource(game.canvas, hitTest);
});

// ── camera: strictly opt-in, behind the button (M2 wires gestureSource) ──
const camBtn = document.getElementById('cam-btn');
camBtn?.addEventListener('click', async () => {
  try {
    await enableCamera({ hitTest });
    camBtn.dataset.on = 'true';
    camBtn.textContent = 'camera on';
  } catch (err) {
    camBtn.textContent = 'camera: not wired (keys work)';
    console.warn('[gesture]', err.message);
  }
});
