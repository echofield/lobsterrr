/*
  Avatar — the composable producer, drawn from iso boxes in the Bible palette.
  Same hand-authored rule as the heroes: code-drawn parts, one palette, no AI.

  Layered build (shadow → legs → torso → jacket → arms → neck → head →
  headphones → face). The camera-facing FRONT plane is given the MID tone (not
  the shadow tone) so the character reads forward without breaking the room's
  one-light feel — a deliberate hero-key for the figure only. Sized to fill its
  canvas so it reads at preview and room scale.
*/

import { PAL } from './palette.js';
import { isoBox, isoTile, project } from './iso.js';

const W = 72, H = 104, S = 13, OX = 36, OY = 88;

// accent shade triples [hi, mid, lo]
const ACCENT = {
  amber: ['#ffd27a', '#f4b04a', '#b87a22'],
  red: ['#e8584a', '#c0392b', '#7a1f17'],
  blue: ['#5a86c0', '#3a6ea5', '#274b73'],
  orange: ['#e8945a', '#d9722a', '#8a4216'],
};
const SKIN = ['#e8b890', '#c9926a', '#8a5e40'];
const SHELL = ['#ef6a4a', '#c0392b', '#7a1f17'];
const PANTS = ['#33302b', '#262320', '#15120f'];
const TEE = ['#403a33', '#2e2922', '#181410'];
const SHOE = ['#1a1613', '#120f0c', '#0a0806'];
const HAIR = ['#3a2a1a', '#2a1d12', '#180f08'];

export function makeAvatarCanvas(ch) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const box = (x, y, z, w, d, h, t, r, f) => isoBox(ctx, OX, OY, S, x, y, z, w, d, h, t, r, f);
  const tile = (x, y, z, w, d, col) => isoTile(ctx, OX, OY, S, x, y, z, w, d, col);
  // part(): top=hi, right=lo, FRONT=mid — keeps the camera-facing face readable
  const part = (x, y, z, w, d, h, c3) => box(x, y, z, w, d, h, c3[0], c3[2], c3[1]);
  const dot = (x, z, w, h, col, y) => faceQuad(ctx, x, z, w, h, col, OX, OY, S, y);

  const A = ACCENT[ch.accent] || ACCENT.amber;
  const lobsterHead = ch.species === 'lobster' || ch.species === 'hybrid';
  const fullLobster = ch.species === 'lobster';
  const limb = fullLobster ? SHELL : SKIN;

  // ── contact shadow ──
  ctx.save(); ctx.globalAlpha = 0.34;
  tile(-1.0, -0.7, 0.02, 2.0, 1.5, PAL.charcoal);
  ctx.restore();

  // ── legs + shoes ──
  part(-0.66, -0.3, 0, 0.58, 0.62, 1.92, PANTS);
  part(0.08, -0.3, 0, 0.58, 0.62, 1.92, PANTS);
  part(-0.68, -0.34, 0, 0.62, 0.74, 0.32, SHOE);
  part(0.06, -0.34, 0, 0.62, 0.74, 0.32, SHOE);

  // ── torso (tee) + shoulders ──
  part(-0.78, -0.38, 1.9, 1.56, 0.76, 1.5, TEE);
  part(-0.88, -0.4, 3.16, 1.76, 0.82, 0.34, TEE);      // shoulder cap (wider)

  // ── open jacket: two accent lapels with the dark tee showing between ──
  part(-0.64, -0.42, 1.96, 0.52, 0.12, 1.42, A);
  part(0.12, -0.42, 1.96, 0.52, 0.12, 1.42, A);
  dot(-0.06, 2.0, 0.12, 1.34, TEE[2], -0.42 + 0.12);   // tee V / zip line
  tile(-0.7, -0.32, 1.9, 1.5, 0.64, '#14100d');        // belt line at the waist

  // ── arms + hands ──
  part(-1.12, -0.26, 1.98, 0.4, 0.48, 1.5, fullLobster ? SHELL : TEE);
  part(0.74, -0.26, 1.98, 0.4, 0.48, 1.5, fullLobster ? SHELL : TEE);
  part(-1.1, -0.24, 1.84, 0.38, 0.44, 0.34, limb);
  part(0.76, -0.24, 1.84, 0.38, 0.44, 0.34, limb);

  // ── neck ──
  part(-0.22, -0.2, 3.48, 0.44, 0.42, 0.32, limb);

  // ── head ──
  const hz = 3.78;
  if (lobsterHead) {
    part(-0.58, -0.5, hz, 1.16, 1.0, 1.16, SHELL);
    for (const ex of [-0.42, 0.28]) {                  // eye stalks
      part(ex, -0.48, hz + 1.16, 0.16, 0.16, 0.5, SHELL);
      dot(ex - 0.02, hz + 1.6, 0.2, 0.2, '#15110e', -0.48 + 0.16);
    }
    dot(-0.28, hz + 0.14, 0.22, 0.2, SHELL[2], 0.5);   // mandible nubs
    dot(0.06, hz + 0.14, 0.22, 0.2, SHELL[2], 0.5);
  } else {
    part(-0.55, -0.5, hz, 1.1, 1.0, 1.16, SKIN);
    part(-0.58, -0.52, hz + 0.96, 1.16, 1.04, 0.3, HAIR);        // hair cap
    dot(-0.58, hz + 0.2, 0.12, 0.74, HAIR[1], 0.5);             // left sideburn
    dot(0.46, hz + 0.2, 0.12, 0.74, HAIR[1], 0.5);             // right sideburn
  }

  // ── face ──
  dot(-0.3, hz + 0.54, 0.18, 0.2, '#15110e', 0.5);     // eyes
  dot(0.14, hz + 0.54, 0.18, 0.2, '#15110e', 0.5);
  dot(-0.12, hz + 0.24, 0.26, 0.07, '#6e4a34', 0.5);   // mouth

  // ── headphones ──
  if (ch.headphones) {
    part(-0.6, -0.04, hz + 0.98, 1.2, 0.18, 0.28, ['#2a2420', '#1c1714', '#0e0b09']); // band
    for (const cx of [-0.8, 0.58]) {
      part(cx, -0.34, hz + 0.2, 0.24, 0.8, 0.7, ['#2a2420', '#1c1714', '#0e0b09']);   // cup
      dot(cx + 0.03, hz + 0.42, 0.16, 0.24, A[1], -0.34 + 0.8);                        // accent dot
    }
  }

  return c;
}

// Draw a small filled quad on a vertical front plane (constant y), in x–z.
function faceQuad(ctx, x, z, w, h, col, ox, oy, S, y) {
  const P = (X, Z) => { const [a, b] = project(X, y, Z, S); return [a + ox, b + oy]; };
  const p = [P(x, z), P(x + w, z), P(x + w, z + h), P(x, z + h)];
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < 4; i++) ctx.lineTo(p[i][0], p[i][1]);
  ctx.closePath(); ctx.fill();
}

export const AVATAR_SIZE = { W, H };
