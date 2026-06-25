/*
  CreatorView — the "new producer" character-creation screen. DOM overlay (UI is
  HTML's strength), live iso preview of the composed avatar, RPG skill allocation
  wired to the four instruments. On enter it persists the character and hands it
  back so the room can place the avatar.
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
  }

  open(existing, onDone) {
    this.ch = hydrate(existing);
    this.onDone = onDone;
    this.#build();
    this.root.classList.add('on');
  }

  close() {
    this.root.classList.remove('on');
    this.root.innerHTML = '';
  }

  #cycle(list, current, dir) {
    const i = list.findIndex((o) => o.key === current);
    return list[(i + dir + list.length) % list.length].key;
  }

  #build() {
    this.root.innerHTML = `
      <div class="cr-frame">
        <header>
          <div class="cr-title">NEW PRODUCER</div>
          <div class="cr-sub">compose your character · spend your skills · enter the studio</div>
        </header>
        <div class="cr-body">
          <div class="cr-stage">
            <div class="cr-avatar" id="cr-avatar"></div>
            <input id="cr-name" class="cr-name" maxlength="18" placeholder="NAME YOUR PRODUCER" autocomplete="off" />
          </div>
          <div class="cr-controls">
            ${this.#pickerHtml('species', 'IDENTITY')}
            ${this.#pickerHtml('accent', 'ACCENT')}
            <div class="cr-row cr-toggle" data-toggle="headphones">
              <span class="cr-key">HEADPHONES</span>
              <button class="cr-tg" id="cr-hp"></button>
            </div>
            <div class="cr-skills">
              <div class="cr-skills-head">SKILLS · <span id="cr-pts"></span> LEFT</div>
              ${SKILLS.map((s) => this.#skillHtml(s)).join('')}
            </div>
          </div>
        </div>
        <footer>
          <span class="cr-hint" id="cr-hint"></span>
          <button class="cr-enter" id="cr-enter">ENTER STUDIO →</button>
        </footer>
      </div>`;

    this.$avatar = this.root.querySelector('#cr-avatar');
    this.$name = this.root.querySelector('#cr-name');
    this.$name.value = this.ch.name || '';
    this.$name.addEventListener('input', () => { this.ch.name = this.$name.value; this.#refresh(); });

    this.root.querySelectorAll('[data-arrow]').forEach((b) => {
      b.addEventListener('click', () => {
        const { arrow, pick } = b.dataset;
        const list = pick === 'species' ? SPECIES : ACCENTS;
        this.ch[pick] = this.#cycle(list, this.ch[pick], arrow === 'next' ? 1 : -1);
        this.#render();
      });
    });

    this.root.querySelector('#cr-hp').addEventListener('click', () => {
      this.ch.headphones = !this.ch.headphones; this.#render();
    });

    this.root.querySelectorAll('[data-skill]').forEach((b) => {
      b.addEventListener('click', () => {
        const { skill, step } = b.dataset;
        const cur = this.ch.skills[skill] || 0;
        const next = cur + (step === 'up' ? 1 : -1);
        if (next < 0 || next > SKILL_MAX) return;
        if (step === 'up' && pointsSpent(this.ch) >= SKILL_POINTS) return;
        this.ch.skills[skill] = next; this.#refresh();
      });
    });

    this.root.querySelector('#cr-enter').addEventListener('click', () => this.#enter());

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
    // avatar preview (nearest-neighbour upscaled)
    const cv = makeAvatarCanvas(this.ch);
    cv.style.width = `${cv.width * 2.6}px`;
    cv.style.height = `${cv.height * 2.6}px`;
    cv.style.imageRendering = 'pixelated';
    this.$avatar.innerHTML = '';
    this.$avatar.appendChild(cv);

    const sp = SPECIES.find((o) => o.key === this.ch.species);
    const ac = ACCENTS.find((o) => o.key === this.ch.accent);
    this.root.querySelector('#cr-species').textContent = sp.label;
    const acEl = this.root.querySelector('#cr-accent');
    acEl.textContent = ac.label;
    acEl.style.color = ac.hex;
    this.root.querySelector('#cr-hp').classList.toggle('on', this.ch.headphones);
    this.root.querySelector('#cr-hp').textContent = this.ch.headphones ? 'ON' : 'OFF';

    this.#refresh();
  }

  // light re-render: skills / name changed → pips, points, button state
  #refresh() {
    const left = SKILL_POINTS - pointsSpent(this.ch);
    this.root.querySelector('#cr-pts').textContent = left;
    for (const s of SKILLS) {
      const v = this.ch.skills[s.key] || 0;
      const pips = Array.from({ length: SKILL_MAX }, (_, i) =>
        `<i class="${i < v ? 'on' : ''}"></i>`).join('');
      this.root.querySelector(`#cr-pip-${s.key}`).innerHTML = pips;
    }
    const ready = this.ch.name.trim().length > 0 && left === 0;
    const btn = this.root.querySelector('#cr-enter');
    btn.disabled = !ready;
    this.root.querySelector('#cr-hint').textContent =
      left > 0 ? `spend ${left} more point${left > 1 ? 's' : ''}`
        : !this.ch.name.trim() ? 'name your producer' : 'ready';
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
