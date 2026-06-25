/*
  Props — atmosphere objects from the real room (see /refs): the flanking black
  studio monitors and the Persian rug. Same iso module + palette as the heroes,
  so the whole room is lit by one light. Rendered to canvases, placed by RoomScene.
*/

import { PAL } from './palette.js';
import { isoBox, isoTile, project, glow } from './iso.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

// Tall black studio monitor — cabinet + woofer + tweeter on the front baffle.
export function makeMonitor() {
  const S = 7, W = 80, H = 150, OX = 40, OY = 116;
  const { c, ctx } = makeCanvas(W, H);
  const box = (x, y, z, w, d, h, t, r, f) => isoBox(ctx, OX, OY, S, x, y, z, w, d, h, t, r, f);
  glow(ctx, OX, OY - 30, 30, PAL.bulb, 0.05);
  isoTile(ctx, OX, OY, S, -1.1, -0.9, 0, 2.2, 1.8, PAL.woodLo); // shadow
  box(-1, -0.8, 0, 2, 1.6, 7.2, PAL.blackHi, PAL.black, PAL.blackLo); // cabinet
  box(-0.8, 0.78, 0.3, 1.6, 0.05, 6.6, '#2a2420', '#1c1714', '#100c0a'); // recessed baffle
  // speaker cones on the front face (y = +d)
  const cone = (zc, rad, ring) => {
    const [sx, sy] = project(0, 0.8, zc, S);
    const cx = OX + sx, cy = OY + sy;
    ctx.fillStyle = ring; ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0c0a09'; ctx.beginPath(); ctx.ellipse(cx, cy, rad * 0.7, rad * 0.44, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1614'; ctx.beginPath(); ctx.ellipse(cx, cy, rad * 0.18, rad * 0.12, 0, 0, Math.PI * 2); ctx.fill();
  };
  cone(2.0, 13, '#37302a'); // woofer
  cone(5.0, 6, '#322b26');  // tweeter
  return c;
}

// Persian rug — concentric iso diamonds in warm reds, a small motif field.
export function makeRug() {
  const S = 9, W = 300, H = 180, OX = 150, OY = 64;
  const { c, ctx } = makeCanvas(W, H);
  const t = (w, d, col, z = 0) => isoTile(ctx, OX, OY, S, -w / 2, -d / 2, z, w, d, col);
  t(13, 9, PAL.redLo, 0.00);     // fringe / base
  t(12.2, 8.2, '#3a1109', 0.01); // dark border
  t(11.4, 7.4, PAL.red, 0.02);   // red border
  t(10.2, 6.4, PAL.wallLo, 0.03);// orange band
  t(9.2, 5.6, '#5e1810', 0.04);  // inner field (deep red)
  // motif: a grid of small cream + amber diamonds on the field
  for (let i = -3; i <= 3; i++) {
    for (let j = -2; j <= 2; j++) {
      const col = (i + j) % 2 ? PAL.yellow : '#d9c9a8';
      isoTile(ctx, OX, OY, S, i * 1.2 - 0.18, j * 1.0 - 0.18, 0.05, 0.36, 0.3, col);
    }
  }
  t(3.4, 2.2, PAL.wall, 0.06);   // central medallion
  t(2.2, 1.4, PAL.yellow, 0.07);
  return c;
}

// Studer-style mixing console — wide black desk, brushed-silver surface, meter
// bridge, channel strips of red/blue/yellow knobs and faders.
export function makeConsole() {
  const S = 8, W = 300, H = 170, OX = 150, OY = 128;
  const { c, ctx } = makeCanvas(W, H);
  const box = (x, y, z, w, d, h, t, r, f) => isoBox(ctx, OX, OY, S, x, y, z, w, d, h, t, r, f);
  const tile = (x, y, z, w, d, col) => isoTile(ctx, OX, OY, S, x, y, z, w, d, col);
  glow(ctx, OX, OY - 24, 40, PAL.bulb, 0.06);
  isoTile(ctx, OX, OY, S, -7.4, -2.4, 0, 14.8, 4.8, PAL.woodLo); // contact shadow
  box(-7, -2, 0, 14, 4, 1.5, PAL.blackHi, PAL.black, PAL.blackLo); // desk body
  tile(-6.7, -1.7, 1.52, 13.4, 3.4, PAL.silver);                  // brushed top
  // meter bridge across the back, with VU windows
  box(-7, -2, 1.5, 14, 0.7, 1.3, '#52585a', '#3a3f41', PAL.blackLo);
  for (let i = 0; i < 7; i++) tile(-6.4 + i * 1.95, -1.85, 2.82, 1.4, 0.5, PAL.creamHi);
  // channel strips: knob columns + fader
  for (let i = 0; i < 9; i++) {
    const cx = -6.3 + i * 1.45;
    tile(cx, -1.2, 1.54, 0.42, 0.42, PAL.red);    // red collar knob
    tile(cx, -0.5, 1.54, 0.34, 0.34, PAL.silverHi);
    tile(cx, 0.2, 1.54, 0.34, 0.34, PAL.blue);    // blue knob
    tile(cx, 0.9, 1.54, 0.34, 0.34, PAL.yellow);  // yellow knob
    tile(cx - 0.12, 1.5, 1.54, 0.5, 1.0, '#15110e'); // fader slot
    tile(cx - 0.1, 1.8, 1.55, 0.42, 0.28, PAL.creamHi); // fader cap
  }
  return c;
}
