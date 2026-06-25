/*
  AudioEngine — Tone.js. Transport-locked spatial looper. Listens to IntentBus
  ONLY; it never knows whether an intent came from a hand or a key.

  Every zone owns a quantized loop that runs on the shared Tone.Transport, gated
  by a per-zone gain. TRIGGER(id) toggles that gate (loop in / loop out). The
  whole room is in A minor, so any subset of zones playing together is musical.

  MODULATE('filter', v 0..1) sweeps one global low-pass on the master bus —
  this is what hand height (or mouse Y) drives.

  Audio cannot start until a user gesture (browser autoplay rule); call
  ensureStarted() from the first interaction.
*/

import * as Tone from 'tone';
import { bus, Intent } from '../intentBus.js';

// A natural minor: A C D E F G. Voicings chosen to stay consonant when layered.
const CHORDS = [
  ['A3', 'C4', 'E4'], // i  Am
  ['F3', 'A3', 'C4'], // VI F
  ['C4', 'E4', 'G4'], // III C
  ['E3', 'G3', 'B3'], // v  Em
];

export class AudioEngine {
  constructor() {
    this.started = false;
    this.active = new Set();   // zone ids currently looping
    this.gains = {};           // zone id -> Tone.Gain (the gate)
    this.loops = {};           // zone id -> Tone.Loop | Tone.Sequence
    this._built = false;
    this.curStep = 0;          // 909 sequencer playhead (0..15)
    // editable RE-909 pattern — the fullscreen step-sequencer panel writes this
    this.pattern = {
      kick:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hat:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    };
  }

  // Build the graph lazily, after Tone.start() (needs a live AudioContext).
  async ensureStarted() {
    if (this.started) return;
    await Tone.start();
    if (!this._built) this.#build();
    Tone.Transport.bpm.value = 84;
    Tone.Transport.start();
    this.started = true;
  }

  #gate(id, node) {
    const g = new Tone.Gain(0); // start silent; TRIGGER opens it
    node.connect(g);
    g.connect(this.filter);
    this.gains[id] = g;
    return g;
  }

  #build() {
    // master bus: global filter (modulated) -> gentle limiter -> out
    this.filter = new Tone.Filter({ type: 'lowpass', frequency: 1200, Q: 0.7 });
    this.limiter = new Tone.Limiter(-2);
    this.filter.connect(this.limiter);
    this.limiter.toDestination();

    // ── kawai: chord stabs, one chord per bar ──
    const kawai = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.8 },
      volume: -8,
    });
    this.#gate('kawai', kawai);
    let bar = 0;
    this.loops['kawai'] = new Tone.Loop((time) => {
      kawai.triggerAttackRelease(CHORDS[bar % CHORDS.length], '2n', time);
      bar++;
    }, '1m').start(0);

    // ── nine09: kick / snare / hat pattern ──
    const kick = new Tone.MembraneSynth({ volume: -4 });
    const snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.18, sustain: 0 }, volume: -12 });
    const hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0 }, volume: -22 });
    const drumMix = new Tone.Gain(1);
    kick.connect(drumMix); snare.connect(drumMix); hat.connect(drumMix);
    this.#gate('nine09', drumMix);
    this.loops['nine09'] = new Tone.Sequence((time, i) => {
      this.curStep = i; // playhead for the VST panel
      // the engine owns the transport, so it is the room's clock: broadcast the tick
      Tone.Draw.schedule(() => bus.emit(Intent.BEAT, i), time);
      if (this.pattern.kick[i]) kick.triggerAttackRelease('C1', '8n', time);
      if (this.pattern.snare[i]) snare.triggerAttackRelease('16n', time);
      if (this.pattern.hat[i]) hat.triggerAttackRelease('32n', time);
    }, [...Array(16).keys()], '16n').start(0);

    // ── moog: bass root + octave arp ──
    const moog = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 2, type: 'lowpass' },
      filterEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.3, baseFrequency: 200, octaves: 3 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 },
      volume: -10,
    });
    this.#gate('moog', moog);
    const arp = ['A1', 'A2', 'E2', 'A2'];
    this.loops['moog'] = new Tone.Sequence((time, n) => {
      moog.triggerAttackRelease(n, '16n', time);
    }, arp, '8n').start(0);

    // ── booth: sustained A-minor pad ──
    const booth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 1.2, decay: 0.4, sustain: 0.9, release: 2.4 },
      volume: -16,
    });
    this.#gate('booth', booth);
    this.loops['booth'] = new Tone.Loop((time) => {
      booth.triggerAttackRelease(['A3', 'C4', 'E4'], '1m', time);
    }, '1m').start(0);

    this._built = true;
  }

  // ── IntentBus reactions ──
  toggle(id) {
    if (!this.gains[id]) return;
    const on = this.active.has(id);
    const g = this.gains[id].gain;
    if (on) { g.rampTo(0, 0.15); this.active.delete(id); }
    else { g.rampTo(1, 0.15); this.active.add(id); }
    return !on;
  }

  isActive(id) { return this.active.has(id); }

  // force a zone's loop audible (used when opening its VST panel)
  activate(id) {
    if (this.gains[id] && !this.active.has(id)) {
      this.gains[id].gain.rampTo(1, 0.1);
      this.active.add(id);
    }
  }

  // 909 step-sequencer API for the panel
  toggleStep(lane, i) {
    this.pattern[lane][i] = this.pattern[lane][i] ? 0 : 1;
    return this.pattern[lane][i];
  }
  getStep() { return this.curStep; }

  setFilter(v) {
    if (!this._built) return;
    // 0 -> 240Hz (dark), 1 -> 6kHz (open); exponential feels musical
    const hz = 240 * Math.pow(25, Math.max(0, Math.min(1, v)));
    this.filter.frequency.rampTo(hz, 0.08);
  }
}
