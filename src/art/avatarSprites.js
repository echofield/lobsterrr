/*
  Avatar — the composable producer, drawn from iso boxes in the Bible palette.
  Same hand-authored rule as the heroes: code-drawn parts, one palette, no AI.

  Layered build (shadow → legs → torso → accent vest → arms → neck → head →
  headphones → face). The camera-facing FRONT plane is given the MID tone (not
  the shadow tone) so the character reads forward without breaking the room's
  one-light feel — a deliberate hero-key for the figure only.
*/

import { PAL } from './palette.js';
import { isoBox, isoTile, project } from './iso.js';

const W = 72, H = 96, S = 5, OX = 36, OY = 80;

// accent shade triples [hi, mid, lo]
const ACCENT = {
  amber: ['#ffd27a', '#f4b04a', '#b87a22'],
  red: ['#e8584a', '#c0392b', '#7a1f17'],
  blue: ['#5a86c0', '#3a6ea5', '#274b73'],
  orange: ['#e8945a', '#d9722a', '#8a4216'],
};
const SKIN = ['#e8b890', '#c9926a', '#8a5e40'];
const SHELL = ['#ef6a4a', '#c0392b', '#7a1f17'];
const PANTS = ['#2e2a25', '#211d19', '#12100d'];
const TEE = ['#3a342e', '#2a251f', '#161310'];

export function makeAvatarCanvas(ch) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const box = (x, y, z, w, d, h, t, r, f) => isoBox(ctx, OX, OY, S, x, y, z, w, d, h, t, r, f);
  const tile = (x, y, z, w, d, col) => isoTile(ctx, OX, OY, S, x, y, z, w, d, col);
  // part(): top=hi, right=lo, FRONT=mid — keeps the camera-facing face readable
  const part = (x, y, z, w, d, h, c3) => box(x, y, z, w, d, h, c3[0], c3[2], c3[1]);

  const A = ACCENT[ch.accent] || ACCENT.amber;
  const lobsterHead = ch.species === 'lobster' || ch.species === 'hybrid';
  const fullLobster = ch.species === 'lobster';
  const limb = fullLobster ? SHELL : SKIN;

  // ── contact shadow ──
  ctx.save(); ctx.globalAlpha = 0.32;
  tile(-1.0, -0.7, 0.02, 2.0, 1.5, PAL.charcoal);
  ctx.restore();

  // ── legs ──
  part(-0.72, -0.32, 0, 0.62, 0.66, 1.6, PANTS);
  part(0.1, -0.32, 0, 0.62, 0.66, 1.6, PANTS);
  // shoes
  part(-0.74, -0.34, 0, 0.66, 0.78, 0.28, ['#1a1613', '#120f0c', '#0a0806']);
  part(0.08, -0.34, 0, 0.66, 0.78, 0.28, ['#1a1613', '#120f0c', '#0a0806']);

  // ── torso (tee) + accent vest panel proud of the chest ──
  part(-0.8, -0.4, 1.6, 1.6, 0.78, 1.7, TEE);
  part(-0.66, -0.46, 1.72, 1.32, 0.12, 1.4, A);          // accent vest
  tile(-0.2, -0.46, 1.72 + 1.4, 0.4, 0.12, A[0]);        // collar lip

  // ── arms ──
  part(-1.16, -0.28, 1.66, 0.42, 0.5, 1.42, fullLobster ? SHELL : TEE);
  part(0.76, -0.28, 1.66, 0.42, 0.5, 1.42, fullLobster ? SHELL : TEE);
  part(-1.14, -0.26, 1.5, 0.4, 0.46, 0.3, limb);          // left hand
  part(0.78, -0.26, 1.5, 0.4, 0.46, 0.3, limb);           // right hand

  // ── neck ──
  part(-0.24, -0.22, 3.3, 0.48, 0.46, 0.32, limb);

  // ── head ──
  const hz = 3.58;
  if (lobsterHead) {
    part(-0.6, -0.5, hz, 1.2, 1.0, 1.12, SHELL);
    // eye stalks
    for (const ex of [-0.42, 0.28]) {
      part(ex, -0.5, hz + 1.12, 0.16, 0.16, 0.46, SHELL);
      tile(ex - 0.02, -0.52, hz + 1.58, 0.2, 0.2, '#15110e'); // eye bulb
    }
    // little mandible nubs on the front
    faceQuad(ctx, -0.28, hz + 0.18, 0.22, 0.2, SHELL[2], OX, OY, S, 0.5);
    faceQuad(ctx, 0.06, hz + 0.18, 0.22, 0.2, SHELL[2], OX, OY, S, 0.5);
  } else {
    part(-0.55, -0.5, hz, 1.1, 1.0, 1.12, SKIN);
    part(-0.58, -0.52, hz + 0.92, 1.16, 1.04, 0.3, ['#3a2a1a', '#2a1d12', '#180f08']); // hair
  }

  // ── face (eyes on the front plane) ──
  const faceY = lobsterHead ? 0.5 : 0.5;
  faceQuad(ctx, -0.3, hz + 0.5, 0.18, 0.2, '#15110e', OX, OY, S, faceY);
  faceQuad(ctx, 0.14, hz + 0.5, 0.18, 0.2, '#15110e', OX, OY, S, faceY);

  // ── headphones ──
  if (ch.headphones) {
    part(-0.62, -0.05, hz + 0.95, 1.24, 0.18, 0.26, ['#26211d', '#1a1613', '#0e0b09']); // band
    for (const cx of [-0.82, 0.6]) {
      part(cx, -0.34, hz + 0.18, 0.24, 0.78, 0.66, ['#26211d', '#1a1613', '#0e0b09']);  // cup
      faceQuad(ctx, cx + 0.03, hz + 0.36, 0.16, 0.22, A[1], OX, OY, S, -0.34 + 0.78);    // accent dot
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
