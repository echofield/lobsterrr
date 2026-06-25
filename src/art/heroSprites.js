/*
  Hero gear — owned iso pixel renditions of the REAL Lobster signature stack
  (see /refs): Rhodes Mark II Seventy Three · Roland RE-909 · AKAI sampler ·
  Roland RE-501 Chorus Echo. Composed from iso boxes in the Bible palette.

  Code-authored (no licensed packs, no AI) so they are fully yours and can be
  re-skinned to the photos pixel-for-pixel later. Hand-painted Aseprite heroes
  drop in behind the same texture key without touching the scene.

  RECIPES are keyed by the stable zone id (kawai/nine09/moog/booth); the labels
  in zones.js carry the real gear names.
*/

import { PAL } from './palette.js';
import { isoBox, isoTile, glow } from './iso.js';

const W = 124, H = 132, S = 6;
const OX = 62, OY = 92; // voxel origin on the canvas

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function base(ctx, w, d, col = PAL.wood) {
  isoTile(ctx, OX, OY, S, -w / 2, -d / 2, 0, w, d, col);
}
const tile = (ctx, x, y, z, w, d, col) => isoTile(ctx, OX, OY, S, x, y, z, w, d, col);
const box = (ctx, x, y, z, w, d, h, t, r, f) => isoBox(ctx, OX, OY, S, x, y, z, w, d, h, t, r, f);

// ── shading helpers (the cheap-light layer that lifts gear off flat 3-tone) ──
// Alpha overlay tile: warm top-light, recessed wells, brushed sheen, glass catch.
function wash(ctx, x, y, z, w, d, col, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  tile(ctx, x, y, z, w, d, col);
  ctx.restore();
}
// Stepped contact shadow on the base — grounds the gear in the floor (fake AO).
function contact(ctx, x, y, w, d) {
  wash(ctx, x - 0.35, y - 0.2, 0.02, w + 0.7, d + 0.5, PAL.charcoal, 0.16); // penumbra
  wash(ctx, x - 0.1, y, 0.03, w + 0.2, d + 0.2, PAL.charcoal, 0.22);        // core
}
// Tungsten lift on a lit top face: warm wash from the bulb + a bright back-edge rim.
function toplight(ctx, x, y, z, w, d) {
  wash(ctx, x, y, z + 0.01, w, d, PAL.bulbHot, 0.10);   // overall warm wash
  wash(ctx, x, y, z + 0.02, w, 0.12, PAL.bulb, 0.5);    // catch-light along the back edge
}
// Raised control knob/cap — small box body + a catch-light dot on top (gives depth).
function knob(ctx, x, y, z, d, hi, mid, lo, spec) {
  box(ctx, x, y, z, d, d, d * 0.7, hi, mid, lo);
  wash(ctx, x + d * 0.22, y + d * 0.14, z + d * 0.7, d * 0.42, d * 0.32, spec, 0.7);
}

// ── Rhodes Mark II Seventy Three → chords ──
// low wide black suitcase, brushed-silver name rail w/ red logo, sloped white key bed
function rhodes(ctx) {
  glow(ctx, OX, OY, 50, PAL.bulb, 0.16);
  base(ctx, 8, 4.2);
  contact(ctx, -3.6, -1.8, 7, 2.6);

  // black tolex suitcase
  const top = 1.3;
  box(ctx, -3.6, -1.8, 0, 7, 2.6, top, PAL.blackHi, PAL.black, PAL.blackLo);
  toplight(ctx, -3.6, -1.8, top, 7, 2.6);
  wash(ctx, -3.4, 0.55, top + 0.02, 6.4, 1.55, PAL.charcoal, 0.22); // recessed key well

  // brushed-silver name rail across the back, red Rhodes logo + two control knobs
  box(ctx, -3.4, -1.5, top, 6.4, 0.7, 0.42, PAL.silverHi, PAL.silver, PAL.silverLo);
  wash(ctx, -3.4, -1.5, top + 0.42, 6.4, 0.7, PAL.bulbHot, 0.12); // brushed sheen
  tile(ctx, -2.0, -1.32, top + 0.43, 3.4, 0.2, PAL.red);          // red logo felt
  tile(ctx, -1.7, -1.28, top + 0.44, 2.8, 0.09, PAL.redHi);       // logo highlight
  for (let i = 0; i < 2; i++) {                                    // vol / bass-boost knobs
    tile(ctx, 1.7 + i * 0.7, -1.32, top + 0.44, 0.36, 0.36, PAL.blackLo);
    tile(ctx, 1.79 + i * 0.7, -1.26, top + 0.45, 0.16, 0.14, PAL.silverHi);
  }

  // sloped white key bed: thin slab, shaded gaps, front-lip catch-light
  const kz = top + 0.06;
  box(ctx, -3.4, 0.9, top, 6.4, 1.1, 0.06, PAL.keyWhite, PAL.keyShade, '#b0a690');
  for (let i = 1; i < 14; i++) // key gaps
    tile(ctx, -3.4 + i * (6.4 / 14), 0.9, kz + 0.001, 0.04, 1.1, PAL.keyShade);
  wash(ctx, -3.4, 1.9, kz + 0.002, 6.4, 0.12, PAL.bulbHot, 0.5); // front-lip specular
  for (let i = 0; i < 13; i++) { // black keys (skip the E-F and B-C gaps)
    if (i % 7 === 2 || i % 7 === 6) continue;
    const x = -3.18 + i * (6.4 / 14);
    box(ctx, x, 0.95, kz, 0.28, 0.6, 0.12, PAL.keyBlack, '#0c0a08', PAL.charcoal);
  }
}

// ── Roland RE-909 → drums ──
// cream box, darker control surface, knob row, red/amber step buttons, LED window
function re909(ctx) {
  glow(ctx, OX, OY, 42, PAL.bulb, 0.13);
  base(ctx, 5.4, 3.6);
  contact(ctx, -2.5, -1.6, 4.6, 3);
  const z = 1.1;
  box(ctx, -2.5, -1.6, 0, 4.6, 3, z, PAL.creamHi, PAL.cream, PAL.creamLo); // body
  toplight(ctx, -2.5, -1.6, z, 4.6, 3);
  tile(ctx, -2.25, -1.35, z + 0.02, 4.1, 2.5, '#b3a995');            // recessed surface
  wash(ctx, -2.25, -1.35, z + 0.03, 4.1, 0.18, PAL.charcoal, 0.3);   // inset shadow at back
  for (let i = 0; i < 9; i++)                                        // dark knob row
    knob(ctx, -2.0 + i * 0.46, -1.18, z + 0.02, 0.26, PAL.blackHi, PAL.black, PAL.blackLo, PAL.silver);
  tile(ctx, -2.05, -0.5, z + 0.04, 0.9, 0.45, PAL.redLo);            // LED window bezel
  tile(ctx, -1.95, -0.42, z + 0.05, 0.7, 0.28, PAL.ledRed);         // lit readout
  for (let i = 0; i < 12; i++) {                                     // 16-step buttons (raised)
    const bx = -2.0 + i * 0.34, on = i % 4 === 0;
    box(ctx, bx, 0.5, z + 0.02, 0.24, 0.5, 0.08,
        on ? PAL.redHi : PAL.ledAmber, on ? PAL.red : PAL.yellow, on ? PAL.redLo : '#9a6e1f');
    wash(ctx, bx + 0.03, 0.56, z + 0.1, 0.12, 0.28, PAL.bulbHot, on ? 0.25 : 0.4); // sheen
  }
}

// ── AKAI sampler → bass + arp ──
// cream box, dark screen, jog wheel, 4x4 grey pad grid
function akai(ctx) {
  glow(ctx, OX, OY, 42, PAL.blue, 0.14);
  base(ctx, 5.4, 3.6);
  contact(ctx, -2.5, -1.6, 4.6, 3);
  const z = 1.25;
  box(ctx, -2.5, -1.6, 0, 4.6, 3, z, PAL.creamHi, PAL.cream, PAL.creamLo); // body
  toplight(ctx, -2.5, -1.6, z, 4.6, 3);
  // recessed LCD — teal screen with a lit upper half + a green scanline catch
  wash(ctx, -2.28, -1.4, z + 0.02, 1.74, 1.18, PAL.charcoal, 0.5); // bezel recess
  tile(ctx, -2.18, -1.32, z + 0.03, 1.5, 1.0, '#16302b');          // screen glass
  tile(ctx, -2.08, -1.24, z + 0.04, 1.3, 0.5, '#2f5a4e');          // lit half
  wash(ctx, -2.08, -1.0, z + 0.05, 1.3, 0.07, PAL.ledGreen, 0.5);  // scanline
  // jog wheel — raised cream disc, dark hub, brushed catch
  box(ctx, -0.55, -1.4, z + 0.02, 1.0, 1.0, 0.1, PAL.creamHi, PAL.cream, PAL.creamLo);
  tile(ctx, -0.35, -1.2, z + 0.12, 0.6, 0.55, '#2a2622');
  wash(ctx, -0.28, -1.14, z + 0.13, 0.32, 0.2, PAL.silverHi, 0.5);
  for (let i = 0; i < 4; i++)                                       // 4x4 raised rubber pads
    for (let j = 0; j < 4; j++)
      box(ctx, -2.0 + j * 0.5, 0.0 + i * 0.36, z + 0.02, 0.36, 0.28, 0.06,
          '#8a8074', '#6f665b', '#4a443c');
  box(ctx, -2.0, 1.08, z + 0.02, 0.36, 0.28, 0.07, '#5a86c0', PAL.blue, '#274b73'); // one pad lit blue
}

// ── Roland RE-501 Chorus Echo → pad ──
// black box, brushed-silver top, row of orange/red knobs, VU squares
function re501(ctx) {
  glow(ctx, OX, OY, 46, PAL.wallHi, 0.2);
  base(ctx, 5.4, 3.4);
  contact(ctx, -2.4, -1.4, 4.4, 2.6);
  const z = 1.5;
  box(ctx, -2.4, -1.4, 0, 4.4, 2.6, z, PAL.blackHi, PAL.black, PAL.blackLo); // body
  toplight(ctx, -2.4, -1.4, z, 4.4, 2.6);
  tile(ctx, -2.15, -1.15, z + 0.02, 3.9, 2.1, '#26201c');           // dark top panel
  wash(ctx, -2.15, -1.15, z + 0.03, 3.9, 0.16, PAL.charcoal, 0.35); // panel inset
  for (let i = 0; i < 6; i++) {                                     // orange/red knob row
    const kx = -1.9 + i * 0.62;
    if (i % 2) knob(ctx, kx, -0.98, z + 0.02, 0.32, PAL.redHi, PAL.red, PAL.redLo, '#ffb0a0');
    else knob(ctx, kx, -0.98, z + 0.02, 0.32, PAL.ledAmber, PAL.yellow, '#9a6e1f', PAL.bulbHot);
  }
  for (const vx of [-1.9, -0.55]) {                                 // twin VU meters
    box(ctx, vx, 0.18, z + 0.02, 1.05, 0.72, 0.05, PAL.creamHi, PAL.cream, PAL.creamLo);
    wash(ctx, vx + 0.06, 0.24, z + 0.07, 0.92, 0.58, PAL.ledAmber, 0.18); // amber backlight
    tile(ctx, vx + 0.62, 0.28, z + 0.08, 0.05, 0.42, '#3a2a1a');          // needle
    wash(ctx, vx + 0.08, 0.24, z + 0.09, 0.5, 0.16, PAL.bulbHot, 0.45);   // glass catch
  }
  box(ctx, 0.95, -0.25, z + 0.02, 0.55, 0.9, 0.06, PAL.silverLo, '#4a4e50', '#33373a'); // tape reel side
  tile(ctx, 1.1, -0.05, z + 0.09, 0.28, 0.45, PAL.silverHi);
}

const RECIPES = { kawai: rhodes, nine09: re909, moog: akai, booth: re501 };

export function makeHeroCanvas(id) {
  const { c, ctx } = makeCanvas();
  (RECIPES[id] || ((cx) => base(cx, 4, 4)))(ctx);
  return c;
}

export const HERO_CANVAS_SIZE = { W, H };
