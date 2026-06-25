/*
  VstView — the fullscreen "zoom into the instrument" layer. Clicking an
  instrument in the room emits OPEN(id); this builds a playable panel over the
  canvas, wired to the SAME AudioEngine + Tone.Transport as the room looper.

  The room is the map; the panel is the depth. First real panel: the RE-909 step
  sequencer. Other instruments get a minimal placeholder panel until their VST
  is built. Esc or the close button returns to the room (CLOSE).

  DOM overlay (not Phaser) — a detailed control surface is HTML's strength.
*/

import { bus, Intent } from '../intentBus.js';
import { ZONE_BY_ID } from '../zones.js';

const LANES = [
  { key: 'kick', label: 'KICK', color: '#c0392b' },
  { key: 'snare', label: 'SNARE', color: '#e8b53a' },
  { key: 'hat', label: 'HAT', color: '#3a6ea5' },
];

export class VstView {
  constructor(audio) {
    this.audio = audio;
    this.openId = null;
    this.cells = [];     // [{lane, i, el}]
    this.cols = [];      // column wrappers, for the playhead
    this.raf = null;

    this.root = document.getElementById('vst');
    this.root.addEventListener('click', (e) => {
      if (e.target.dataset.close !== undefined) this.hide();
    });
    window.addEventListener('keydown', (e) => { if (e.code === 'Escape') this.hide(); });
    bus.on(Intent.CLOSE, () => this.hide());
  }

  show(id) {
    this.openId = id;
    const z = ZONE_BY_ID[id];
    this.root.innerHTML = id === 'nine09' ? this.#seq909(z) : this.#placeholder(z);
    this.root.classList.add('on');
    if (id === 'nine09') this.#wire909();
  }

  hide() {
    if (!this.openId) return;
    this.openId = null;
    this.root.classList.remove('on');
    this.root.innerHTML = '';
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  // ── RE-909 step sequencer ──
  #seq909(z) {
    return `
      <div class="vst-frame nine09">
        <header>
          <div class="vst-name">RE-909 · <span>rhythm composer</span></div>
          <button class="vst-x" data-close>← room</button>
        </header>
        <div class="vst-body" id="seq-grid"></div>
        <footer>16-step · A-minor kit · plays live on the same clock as the room · Esc to exit</footer>
      </div>`;
  }

  #wire909() {
    const grid = this.root.querySelector('#seq-grid');
    this.cells = [];
    this.cols = [];
    for (const lane of LANES) {
      const row = document.createElement('div');
      row.className = 'seq-row';
      row.innerHTML = `<span class="seq-label" style="color:${lane.color}">${lane.label}</span>`;
      const steps = document.createElement('div');
      steps.className = 'seq-steps';
      for (let i = 0; i < 16; i++) {
        const cell = document.createElement('button');
        cell.className = 'seq-cell' + (i % 4 === 0 ? ' beat' : '');
        cell.style.setProperty('--accent', lane.color);
        if (this.audio.pattern[lane.key][i]) cell.classList.add('on');
        cell.addEventListener('click', () => {
          const on = this.audio.toggleStep(lane.key, i);
          cell.classList.toggle('on', !!on);
        });
        steps.appendChild(cell);
        this.cells.push({ lane: lane.key, i, el: cell });
      }
      row.appendChild(steps);
      grid.appendChild(row);
    }
    // playhead follows the shared transport
    const tick = () => {
      const s = this.audio.getStep();
      this.cells.forEach((c) => c.el.classList.toggle('cur', c.i === s));
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  #placeholder(z) {
    return `
      <div class="vst-frame">
        <header>
          <div class="vst-name">${z.label.toUpperCase()} · <span>${z.role}</span></div>
          <button class="vst-x" data-close>← room</button>
        </header>
        <div class="vst-body placeholder">
          <p>VST panel coming.</p>
          <p class="dim">For now this instrument plays from the room — press
            <b>${z.key.replace('Digit', '')}</b> there to toggle its loop.</p>
        </div>
        <footer>Esc to exit</footer>
      </div>`;
  }
}
