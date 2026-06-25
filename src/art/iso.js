/*
  Iso primitives — 2:1 dimetric. The whole Pixel Bible projection in one place.

  Voxel space (x, y, z) -> screen:
    sx = (x - y) * S
    sy = (x + y) * S/2 - z * S
  +x runs down-right, +y down-left, +z up. S = pixels per voxel.

  Boxes are drawn three faces only — top (lit), right (mid), front (shadow) —
  so directional light is consistent across every object. Render small, let
  Phaser upscale nearest-neighbour for crisp pixels.
*/

export function project(x, y, z, S) {
  return [(x - y) * S, (x + y) * S * 0.5 - z * S];
}

function poly(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// A flat diamond at height z (floor seat / pad / knob top).
export function isoTile(ctx, ox, oy, S, x, y, z, w, d, col) {
  const P = (X, Y, Z) => { const [a, b] = project(X, Y, Z, S); return [a + ox, b + oy]; };
  poly(ctx, [P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], col);
}

// A cuboid [x..x+w] x [y..y+d] x [z..z+h] with 3-tone shading.
export function isoBox(ctx, ox, oy, S, x, y, z, w, d, h, top, right, front) {
  const P = (X, Y, Z) => { const [a, b] = project(X, Y, Z, S); return [a + ox, b + oy]; };
  // right face (x = x+w) — mid
  poly(ctx, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], right);
  // front face (y = y+d) — shadow
  poly(ctx, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], front);
  // top face (z = z+h) — lit
  poly(ctx, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top);
}

// Soft radial glow (lamp / red booth bleed), drawn under an object.
export function glow(ctx, cx, cy, r, color, alpha = 0.5) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
