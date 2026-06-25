/*
  CreatorView — the "new producer" character-creation screen. DOM overlay (UI is
  HTML's strength), live iso preview of the composed avatar, RPG skill allocation
  wired to the four instruments. On enter it persists the character and hands it
  back so the room can place the avatar.

  Fully keyboard/controller driven: ↑/↓ move focus, ←/→ change the focused
  control, Enter selects. (The hand maps onto the same nav later: directional →
  arrows, pinch → Enter.) Mouse works too.
*/

import {
  SPECIES, ACCENTS, SKILLS, SKILL_POINTS, SKILL_MAX,
  defaultCharacter, hydrate, saveCharacter, pointsSpent,
} from '../character/model.js';
import { makeAvatarCanvas } from '../art/avatarSprites.js';

export class CreatorView {
  constructor() {
    this.root = document.getElementById('creator');
    this.ch = defaultCharacter();
    this.onDone = null;
    this.rows = [];
    this.focus = 0;
    this.boundKey = (e) => this.#onKey(e);
  }

  open(existing, onDone) {
    this.ch = hydrate(existing);
    this.onDone = onDone;
    this.#build();
    this.root.classList.add('on');
    this.#setFocus(0);
    window.addEventListener('keydown', this.boundKey);
  }

  close() {
    window.removeEventListener('keydown', this.boundKey);
    this.root.classList.remove('on');
    this.root.innerHTML = '';
    this.rows = [];
  }

  // ── shared actions (used by both clicks and the keyboard) ──
  #cycle(list, current, dir) {
    const i = list.findIndex((o) => o.key === current);
    return list[(i + dir + list.length) % list.length].key;
  }
  #setSpecies(dir) { this.ch.species = this.#cycle(SPECIES, this.ch.species, dir); this.#render(); }
  #setAccent(dir) { this.ch.accent = this.#cycle(ACCENTS, this.ch.accent, dir); this.#render(); }
  #toggleHp() { this.ch.headphones = !this.ch.headphones; this.#render(); }
  #stepSkill(key, dir) {
    const next = (this.ch.skills[key] || 0) + dir;
    if (next < 0 || next > SKILL_MAX) return;
    if (dir > 0 && pointsSpent(this.ch) >= SKILL_POINTS) return;
    this.ch.skills[key] = next; this.#refresh();
  }

  #build() {
    this.root.innerHTML = `
      <div class="cr-frame">
        <header>
          <div class="cr-title">NEW PRODUCER</div>
          <div class="cr-sub">↑ ↓ move · ← → change · enter select</div>
        </header>
        <div class="cr-body">
          <div class="cr-stage">
            <div class="cr-avatar" id="cr-avatar"></div>
            <input id="cr-name" class="cr-name" maxlength="18" placeholder="NAME YOUR PRODUCER" autocomplete="off" />
          </div>
          <div class="cr-controls">
            ${this.#pickerHtml('species', 'IDENTITY')}
            ${this.#pickerHtml('accent', 'ACCENT')}
            <div class="cr-row cr-toggle">
              <span class="cr-key">HEADPHONES</span>
              <button class="cr-tg" id="cr-hp"></button>
            </div>
            <div class="cr-skills-head">SKILLS · <span id="cr-pts"></span> LEFT</div>
            ${SKILLS.map((s) => this.#skillHtml(s)).join('')}
          </div>
        </div>
        <footer>
          <span class="cr-hint" id="cr-hint"></span>
          <button class="cr-enter" id="cr-enter">ENTER STUDIO →</button>
        </footer>
      </div>`;

    const q = (s) => this.root.querySelector(s);
    const qa = (s) => [...this.root.querySelectorAll(s)];

    this.$avatar = q('#cr-avatar');
    this.$name = q('#cr-name');
    this.$name.value = this.ch.name || '';
    this.$name.addEventListener('input', () => { this.ch.name = this.$name.value; this.#refresh(); });

    qa('[data-arrow]').forEach((b) => b.addEventListener('click', () => {
      const dir = b.dataset.arrow === 'next' ? 1 : -1;
      b.dataset.pick === 'species' ? this.#setSpecies(dir) : this.#setAccent(dir);
    }));
    q('#cr-hp').addEventListener('click', () => this.#toggleHp());
    qa('[data-skill]').forEach((b) => b.addEventListener('click', () =>
      this.#stepSkill(b.dataset.skill, b.dataset.step === 'up' ? 1 : -1)));
    q('#cr-enter').addEventListener('click', () => this.#enter());

    // focusable rows, in nav order
    const skillRows = qa('.cr-skill');
    this.rows = [
      { el: q('[data-pick="species"]'), left: () => this.#setSpecies(-1), right: () => this.#setSpecies(1) },
      { el: q('[data-pick="accent"]'), left: () => this.#setAccent(-1), right: () => this.#setAccent(1) },
      { el: q('.cr-toggle'), left: () => this.#toggleHp(), right: () => this.#toggleHp(), enter: () => this.#toggleHp() },
      ...SKILLS.map((s, i) => ({ el: skillRows[i], left: () => this.#stepSkill(s.key, -1), right: () => this.#stepSkill(s.key, 1) })),
      { el: this.$name, name: true },
      { el: q('#cr-enter'), enter: () => this.#enter() },
    ];
    this.rows.forEach((r, i) => r.el.addEventListener('mousedown', () => this.#setFocus(i)));

    this.#render();
  }

  #pickerHtml(pick, label) {
    return `
      <div class="cr-row" data-pick="${pick}">
        <span class="cr-key">${label}</span>
        <div class="cr-picker">
          <button class="cr-arrow" data-arrow="prev" data-pick="${pick}">◀</button>
          <span class="cr-val" id="cr-${pick}"></span>
          <button class="cr-arrow" data-arrow="next" data-pick="${pick}">▶</button>
        </div>
      </div>`;
  }

  #skillHtml(s) {
    return `
      <div class="cr-skill" style="--accent:${s.hex}">
        <div class="cr-skill-id"><b>${s.label}</b><span>${s.blurb}</span></div>
        <button class="cr-step" data-skill="${s.key}" data-step="down">−</button>
        <div class="cr-pips" id="cr-pip-${s.key}"></div>
        <button class="cr-step" data-skill="${s.key}" data-step="up">+</button>
      </div>`;
  }

  // full re-render: appearance changed → redraw avatar + values
  #render() {
    const cv = makeAvatarCanvas(this.ch);
    cv.style.width = `${cv.width * 2.2}px`;
    cv.style.height = `${cv.height * 2.2}px`;
    cv.style.imageRendering = 'pixelated';
    this.$avatar.innerHTML = '';
    this.$avatar.appendChild(cv);

    const sp = SPECIES.find((o) => o.key === this.ch.species);
    const ac = ACCENTS.find((o) => o.key === this.ch.accent);
    this.root.querySelector('#cr-species').textContent = sp.label;
    const acEl = this.root.querySelector('#cr-accent');
    acEl.textContent = ac.label;
    acEl.style.color = ac.hex;
    const hp = this.root.querySelector('#cr-hp');
    hp.classList.toggle('on', this.ch.headphones);
    hp.textContent = this.ch.headphones ? 'ON' : 'OFF';

    this.#refresh();
  }

  // light re-render: skills / name changed → pips, points, button state
  #refresh() {
    const left = SKILL_POINTS - pointsSpent(this.ch);
    this.root.querySelector('#cr-pts').textContent = left;
    for (const s of SKILLS) {
      const v = this.ch.skills[s.key] || 0;
      this.root.querySelector(`#cr-pip-${s.key}`).innerHTML =
        Array.from({ length: SKILL_MAX }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('');
    }
    const ready = this.ch.name.trim().length > 0 && left === 0;
    this.root.querySelector('#cr-enter').disabled = !ready;
    this.root.querySelector('#cr-hint').textContent =
      left > 0 ? `spend ${left} more point${left > 1 ? 's' : ''}`
        : !this.ch.name.trim() ? 'name your producer' : 'ready →';
  }

  // ── focus / keyboard ──
  #setFocus(i) {
    this.focus = (i + this.rows.length) % this.rows.length;
    this.rows.forEach((r, k) => r.el.classList.toggle('cr-on', k === this.focus));
    const r = this.rows[this.focus];
    if (r.name) this.$name.focus(); else this.$name.blur();
  }
  #move(d) { this.#setFocus(this.focus + d); }

  #onKey(e) {
    if (!this.rows.length) return;
    const r = this.rows[this.focus];
    switch (e.code) {
      case 'ArrowDown': this.#move(1); e.preventDefault(); break;
      case 'ArrowUp': this.#move(-1); e.preventDefault(); break;
      case 'ArrowRight': if (r.name) return; r.right?.(); e.preventDefault(); break;
      case 'ArrowLeft': if (r.name) return; r.left?.(); e.preventDefault(); break;
      case 'Enter':
        if (r.name) this.#setFocus(this.rows.length - 1);
        else (r.enter || r.right)?.();
        e.preventDefault(); break;
      case 'Space':
        if (r.name) return;
        if (r.enter) { r.enter(); e.preventDefault(); }
        break;
      default: break;
    }
  }

  #enter() {
    if (this.ch.name.trim().length === 0 || pointsSpent(this.ch) !== SKILL_POINTS) return;
    this.ch.name = this.ch.name.trim();
    saveCharacter(this.ch);
    const done = this.onDone;
    this.close();
    done?.(this.ch);
  }
}
