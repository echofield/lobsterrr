/*
  RoomScene — Phaser. Renders the control room as a real iso box (two burnt-orange
  back walls meeting in a corner, a wood floor that fills the space, slat diffuser,
  Persian rug, flanking monitors, hanging Edison bulbs) and reacts to IntentBus.

  Pure LISTENER: never emits intents, never touches audio. Zone + cursor positions
  stay normalised 0..1 mapped LINEARLY to the canvas, so pointer/gesture/render are
  one space; heroes sit on the floor by construction. Swapping the code-drawn heroes
  for hand-painted sprites is a texture swap — this file does not change.
*/

import Phaser from 'phaser';
import { bus, Intent } from '../intentBus.js';
import { ZONES, ZONE_BY_ID } from '../zones.js';
import { PAL } from '../art/palette.js';
import { makeHeroCanvas } from '../art/heroSprites.js';
import { makeMonitor, makeRug, makeConsole } from '../art/propSprites.js';
import { makeAvatarCanvas } from '../art/avatarSprites.js';

const hex = (s) => parseInt(s.slice(1), 16);

export class RoomScene extends Phaser.Scene {
  constructor() { super('room'); }

  preload() {
    // Rendered gear sprites (Blender pipeline → public/sprites/hero-<id>.png).
    // Missing files fall back to the code-drawn canvas hero; load errors are
    // swallowed so the room still builds when a sprite hasn't been rendered yet.
    this.load.on('loaderror', () => {});
    for (const z of ZONES) this.load.image(`sprite-${z.id}`, `sprites/hero-${z.id}.png`);
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W; this.H = H;
    this.markers = {};

    // floor diamond geometry (top vertex T, down to B; L/R at mid)
    this.floor = {
      Tx: W / 2, Ty: H * 0.28,
      halfW: W * 0.47, halfH: H * 0.30,
    };

    this.cameras.main.setBackgroundColor(PAL.charcoal);
    this.#drawWalls();
    this.#drawFloor();
    this.#drawProps();
    this.#drawBulbs();

    // warm tungsten wash across the top (filter feedback)
    this.rim = this.add.rectangle(W / 2, 0, W, 110, hex(PAL.bulb), 0.08).setOrigin(0.5, 0);
    this.rim.setBlendMode(Phaser.BlendModes.ADD);

    for (const z of ZONES) this.#drawZone(z);

    this.#drawVignette();

    this.cursor = this.add.circle(W / 2, H / 2, 5, hex(PAL.bulb), 0.95)
      .setStrokeStyle(1, hex(PAL.keyWhite), 0.6).setDepth(10);

    // soft front-of-floor falloff into the dark
    this.add.rectangle(W / 2, H, W, 90, hex(PAL.charcoal), 0.55).setOrigin(0.5, 1);

    bus.on(Intent.MOVE, (x, y) => this.cursor.setPosition(x * this.W, y * this.H));
    bus.on(Intent.ZONE_ENTER, (id) => this.#hover(id, true));
    bus.on(Intent.ZONE_EXIT, (id) => this.#hover(id, false));
    bus.on(Intent.TRIGGER, (id) => this.#pulse(id));
    bus.on(Intent.MODULATE, (param, v) => { if (param === 'filter') this.#light(v); });
  }

  #px(n) { return { x: n.x * this.W, y: n.y * this.H }; }

  // two orange back walls rising from the floor's back edges + slat diffuser
  #drawWalls() {
    const { Tx, Ty, halfW, halfH } = this.floor;
    const Lx = Tx - halfW, Ly = Ty + halfH;
    const Rx = Tx + halfW, Ry = Ty + halfH;
    const up = halfH * 2.6; // wall height
    const g = this.add.graphics();
    const quad = (pts, col, a) => {
      g.fillStyle(col, a); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath(); g.fillPath();
    };
    // left wall (darker), right wall (lit)
    quad([[Tx, Ty], [Lx, Ly], [Lx, Ly - up], [Tx, Ty - up]], hex(PAL.wallLo), 1);
    quad([[Tx, Ty], [Rx, Ry], [Rx, Ry - up], [Tx, Ty - up]], hex(PAL.wall), 1);
    // warm light bloom high on the right wall
    quad([[Tx, Ty - up * 0.2], [Rx, Ry - up * 0.2], [Rx, Ry - up], [Tx, Ty - up]], hex(PAL.wallHi), 0.4);

    // vertical light falloff down the walls (darker toward the floor)
    g.fillStyle(hex(PAL.charcoal), 0.28);
    g.fillRect(0, this.H * 0.22, this.W, this.H * 0.22);

    // oak slat diffuser — a flat panel of vertical battens centred on the corner
    const panelX = this.W * 0.31, panelW = this.W * 0.38, panelY = this.H * 0.12, panelH = this.H * 0.28;
    const n = 13, bw = panelW / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle(i % 2 ? hex(PAL.wood) : hex(PAL.woodHi), 0.92);
      g.fillRect(panelX + i * bw, panelY, bw - 2, panelH);
      g.fillStyle(hex(PAL.blackLo), 0.5); // shadow gap between battens
      g.fillRect(panelX + i * bw + bw - 2, panelY, 2, panelH);
    }

    // faint vertical wood panelling across both walls (kills the flat-fill look)
    const panel = (x0, y0, x1, y1, n) => {
      for (let k = 1; k < n; k++) {
        const t = k / n;
        const bx = x0 + (x1 - x0) * t, by = y0 + (y1 - y0) * t;
        g.lineStyle(1, hex(PAL.wallLo), 0.32);
        g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by - up); g.strokePath();
        g.lineStyle(1, hex(PAL.wallHi), 0.10);
        g.beginPath(); g.moveTo(bx + 1, by); g.lineTo(bx + 1, by - up); g.strokePath();
      }
    };
    panel(Tx, Ty, Lx, Ly, 12);
    panel(Tx, Ty, Rx, Ry, 12);

    this.#drawCeiling();
  }

  // dark acoustic-foam ceiling band framing the top of the room
  #drawCeiling() {
    const { W, H } = this;
    const g = this.add.graphics();
    const ch = H * 0.11;
    g.fillStyle(hex(PAL.charcoal), 1); g.fillRect(0, 0, W, ch);
    g.fillStyle(hex('#1c1512'), 1); g.fillRect(0, 0, W, ch * 0.72);
    // foam wedge squares
    const s = 26;
    for (let x = 0; x < W; x += s) {
      const lit = (Math.floor(x / s) % 2) === 0;
      g.fillStyle(lit ? hex('#241a16') : hex('#150f0d'), 1);
      g.fillRect(x + 2, 6, s - 4, ch * 0.6 - 8);
    }
    // warm rim where ceiling meets wall
    g.fillStyle(hex(PAL.bulb), 0.10); g.fillRect(0, ch - 3, W, 3);
  }

  #drawFloor() {
    const { Tx, Ty, halfW, halfH } = this.floor;
    const Lx = Tx - halfW, Ly = Ty + halfH, Rx = Tx + halfW, Bx = Tx, By = Ty + halfH * 2;
    // diamond path used for both the solid underlay and the mask
    const diamond = (g) => { g.beginPath(); g.moveTo(Tx, Ty); g.lineTo(Rx, Ly); g.lineTo(Bx, By); g.lineTo(Lx, Ly); g.closePath(); };

    const underlay = this.add.graphics();
    underlay.fillStyle(hex(PAL.woodLo), 1); diamond(underlay); underlay.fillPath();

    const tiles = this.add.graphics();
    const tw = 64, th = 32, N = 18;
    // warm light centre (under the bulbs) — baked into the boards, stepped not smooth
    const lcx = Tx, lcy = Ty + halfH * 0.5, maxD = halfW * 0.95;
    const oak = ['#7a5226', '#875b2c', '#6d4920', '#7f5528']; // varied boards, not a checker
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= N; j++) {
        const cx = Tx + (i - j) * (tw / 2);
        const cy = Ty + (i + j) * (th / 2);
        const face = () => {
          tiles.beginPath();
          tiles.moveTo(cx, cy - th / 2); tiles.lineTo(cx + tw / 2, cy);
          tiles.lineTo(cx, cy + th / 2); tiles.lineTo(cx - tw / 2, cy);
          tiles.closePath(); tiles.fillPath();
        };
        // board tone: bands along (i+j) + deterministic grain noise → oak, not tile
        const noise = Math.abs(Math.sin(i * 12.9898 + j * 4.1414));
        tiles.fillStyle(hex(oak[((i + j) + (noise > 0.66 ? 1 : 0)) % oak.length]), 1); face();
        // baked light: warm toward the centre, sink the edges
        const d = Math.min(1, Math.hypot(cx - lcx, cy - lcy) / maxD);
        if (d < 0.85) { tiles.fillStyle(hex(PAL.bulb), (1 - d) * 0.16); face(); }
        if (d > 0.42) { tiles.fillStyle(hex(PAL.charcoal), (d - 0.42) * 0.62); face(); }
        // board seam — only the front V, so it reads as planks not a grid
        tiles.lineStyle(1, hex(PAL.grout), 0.32);
        tiles.beginPath();
        tiles.moveTo(cx - tw / 2, cy); tiles.lineTo(cx, cy + th / 2); tiles.lineTo(cx + tw / 2, cy);
        tiles.strokePath();
      }
    }
    const maskG = this.make.graphics({ x: 0, y: 0 });
    maskG.fillStyle(0xffffff); diamond(maskG); maskG.fillPath();
    tiles.setMask(maskG.createGeometryMask());
  }

  #drawProps() {
    // Persian rug, centred under the gear cluster
    if (!this.textures.exists('rug')) this.textures.addCanvas('rug', makeRug());
    const r = this.#px({ x: 0.5, y: 0.64 });
    this.add.image(r.x, r.y, 'rug').setOrigin(0.5, 0.5).setScale(1.9);

    // Studer console at the back, between the top heroes
    if (!this.textures.exists('console')) this.textures.addCanvas('console', makeConsole());
    const c = this.#px({ x: 0.5, y: 0.40 });
    this.add.image(c.x, c.y, 'console').setOrigin(0.5, 0.85).setScale(1.4);

    // flanking studio monitors at the back corners
    if (!this.textures.exists('monitor')) this.textures.addCanvas('monitor', makeMonitor());
    for (const mx of [0.18, 0.82]) {
      const m = this.#px({ x: mx, y: 0.45 });
      this.#contactShadow(m.x, m.y, 64, 18);
      this.add.image(m.x, m.y, 'monitor').setOrigin(0.5, 0.9).setScale(1.7);
    }
  }

  #contactShadow(x, y, rx, ry) {
    this.add.ellipse(x, y + 6, rx, ry, hex(PAL.charcoal), 0.4)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  // tungsten vignette — keeps the warm centre lit and sinks the edges into shadow
  #drawVignette() {
    const { W, H } = this;
    if (!this.textures.exists('vignette')) {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d');
      const grd = g.createRadialGradient(W / 2, H * 0.46, H * 0.24, W / 2, H * 0.52, H * 0.92);
      grd.addColorStop(0, 'rgba(7,4,3,0)');
      grd.addColorStop(0.68, 'rgba(7,4,3,0)');
      grd.addColorStop(1, 'rgba(7,4,3,0.62)');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      this.textures.addCanvas('vignette', cv);
    }
    this.add.image(W / 2, H / 2, 'vignette').setOrigin(0.5).setDepth(6);
  }

  // soft round light, tinted per zone, that blooms under a playing instrument
  #ensureSpot() {
    if (this.textures.exists('spot')) return;
    const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.4, 'rgba(255,255,255,0.32)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    this.textures.addCanvas('spot', cv);
  }

  // place (or replace) the composed producer avatar, centred on the rug
  showAvatar(ch) {
    if (this.avatar) this.avatar.destroy();
    if (this.avatarShadow) this.avatarShadow.destroy();
    if (this.textures.exists('avatar')) this.textures.remove('avatar');
    this.textures.addCanvas('avatar', makeAvatarCanvas(ch));
    const p = this.#px({ x: 0.5, y: 0.68 });
    this.avatarShadow = this.add.ellipse(p.x, p.y + 8, 80, 22, hex(PAL.charcoal), 0.42)
      .setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(2);
    this.avatar = this.add.image(p.x, p.y, 'avatar').setOrigin(0.5, 0.92).setScale(1.8).setDepth(5);
    this.character = ch;
    // gentle idle breathing so the producer feels alive on the stage
    this.tweens.add({
      targets: this.avatar, y: p.y - 4, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });
  }

  #drawBulbs() {
    const { W, H } = this;
    const cordTop = H * 0.11; // hangs from the ceiling band
    this.bulbs = [];
    for (const bx of [0.36, 0.5, 0.64]) {
      const x = W * bx, y = H * 0.20;
      this.add.line(0, 0, x, cordTop, x, y, hex(PAL.blackLo), 0.9).setOrigin(0, 0);
      // tight, warm halo: two stacked soft cores instead of one flat disc
      const halo = this.add.circle(x, y, 30, hex(PAL.bulb), 0.16).setBlendMode(Phaser.BlendModes.ADD);
      this.add.circle(x, y, 14, hex(PAL.bulb), 0.22).setBlendMode(Phaser.BlendModes.ADD);
      this.add.circle(x, y, 5, hex(PAL.bulbHot), 0.7).setBlendMode(Phaser.BlendModes.ADD);
      this.add.circle(x, y, 3, hex(PAL.bulbHot), 1);
      this.bulbs.push(halo);
    }
  }

  #drawZone(z) {
    const { x, y } = this.#px(z.at);

    this.#contactShadow(x, y + 4, 78, 22);

    // per-zone spotlight (blooms when the loop is playing)
    this.#ensureSpot();
    const spot = this.add.image(x, y - 6, 'spot').setTint(z.color).setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD).setScale(1.15).setDepth(5);

    // prefer the rendered Blender sprite; fall back to the code-drawn canvas hero
    const spriteKey = `sprite-${z.id}`;
    const usePng = this.textures.exists(spriteKey);
    const canvasKey = `hero-${z.id}`;
    if (!usePng && !this.textures.exists(canvasKey)) this.textures.addCanvas(canvasKey, makeHeroCanvas(z.id));
    const baseScale = usePng ? 1.5 : 2.35;
    const hero = this.add.image(x, y, usePng ? spriteKey : canvasKey)
      .setOrigin(0.5, usePng ? 0.66 : 0.72).setScale(baseScale);

    const ring = this.add.circle(x, y, 74, 0x000000, 0)
      .setStrokeStyle(2, z.color, 0).setData('on', false);

    const label = this.add.text(x, y + 42, `${z.label.toUpperCase()}\n${z.role}`, {
      fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#c9bca8', align: 'center',
    }).setOrigin(0.5, 0).setShadow(0, 1, '#000', 3);

    const keyTag = this.add.text(x, y - 84, z.key.replace('Digit', ''), {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#ece6d6',
    }).setOrigin(0.5, 1).setAlpha(0.55);

    this.markers[z.id] = { hero, ring, label, keyTag, spot, base: { x, y }, baseScale };
  }

  #hover(id, on) {
    const m = this.markers[id]; if (!m) return;
    m.keyTag.setAlpha(on ? 1 : 0.55);
    m.label.setColor(on ? '#ffe6a8' : '#c9bca8');
    m.hero.setScale(on ? m.baseScale * 1.055 : m.baseScale);
  }

  #pulse(id) {
    const m = this.markers[id]; if (!m) return;
    const z = ZONE_BY_ID[id];
    const nowOn = !m.ring.getData('on');
    m.ring.setData('on', nowOn);
    m.ring.setStrokeStyle(2, z.color, nowOn ? 0.9 : 0);
    const pop = m.baseScale * 1.106;
    this.tweens.add({ targets: m.hero, scaleX: pop, scaleY: pop, yoyo: true, duration: 120, ease: 'Quad.out' });
    // bloom (or fade) the instrument's spotlight to match the loop state
    this.tweens.add({ targets: m.spot, alpha: nowOn ? 0.5 : 0, duration: 320, ease: 'Quad.out' });
    this.#dimStage();
    if (nowOn) this.#spinRing(id);
  }

  // lift the stage dim while anything is playing so active spots read as light
  #dimStage() {
    const anyOn = Object.values(this.markers).some((m) => m.ring.getData('on'));
    if (!this.stageDim) {
      this.stageDim = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, hex(PAL.charcoal), 0)
        .setDepth(4);
    }
    this.tweens.add({ targets: this.stageDim, alpha: anyOn ? 0.22 : 0, duration: 320, ease: 'Quad.out' });
  }

  #spinRing(id) {
    const m = this.markers[id]; if (!m) return;
    this.tweens.add({
      targets: m.ring, angle: 360, duration: 4200, repeat: -1,
      onUpdate: () => { if (!m.ring.getData('on')) this.tweens.killTweensOf(m.ring); },
    });
  }

  #light(v) {
    if (this.rim) this.rim.setAlpha(0.05 + v * 0.32);
  }
}
