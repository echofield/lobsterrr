/*
  Character model — the producer you compose before you enter the studio.

  Composable identity (species × accent × headphones) + an RPG skill spread.
  The four skills map 1:1 to the four playable instruments, so the creation
  screen is wired to the room's real mechanics, not flavour text. Persisted to
  localStorage so the studio remembers you.
*/

// Composable appearance options (first entry = default / on-brand).
export const SPECIES = [
  { key: 'hybrid', label: 'LOBSTER-HEADED' }, // human body, lobster head — the house look
  { key: 'lobster', label: 'FULL LOBSTER' },  // all shell
  { key: 'human', label: 'HUMAN' },           // plain producer
];

export const ACCENTS = [
  { key: 'amber', label: 'AMBER', hex: '#f4b04a' },
  { key: 'red', label: 'RED', hex: '#c0392b' },
  { key: 'blue', label: 'BLUE', hex: '#3a6ea5' },
  { key: 'orange', label: 'ORANGE', hex: '#d9722a' },
];

// RPG skills — each one buffs (and is themed to) one instrument zone.
export const SKILLS = [
  { key: 'harmony', label: 'HARMONY', zone: 'kawai', hex: '#f4b04a', blurb: 'Rhodes · chords' },
  { key: 'groove', label: 'GROOVE', zone: 'nine09', hex: '#c0392b', blurb: 'RE-909 · drums' },
  { key: 'lowend', label: 'LOW-END', zone: 'moog', hex: '#3a6ea5', blurb: 'AKAI · bass' },
  { key: 'space', label: 'SPACE', zone: 'booth', hex: '#d9722a', blurb: 'RE-501 · space' },
];

export const SKILL_POINTS = 8; // total to distribute
export const SKILL_MAX = 5;    // cap per skill

const KEY = 'lobster:character';

export function defaultCharacter() {
  return {
    name: '',
    species: 'hybrid',
    accent: 'amber',
    headphones: true,
    skills: { harmony: 2, groove: 2, lowend: 2, space: 2 },
  };
}

export function loadCharacter() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveCharacter(ch) {
  try { localStorage.setItem(KEY, JSON.stringify(ch)); } catch { /* private mode */ }
}

export function clearCharacter() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

export function pointsSpent(ch) {
  return SKILLS.reduce((sum, s) => sum + (ch.skills[s.key] || 0), 0);
}

// Normalise a possibly-partial saved object back to a full character.
export function hydrate(ch) {
  const d = defaultCharacter();
  if (!ch) return d;
  return { ...d, ...ch, skills: { ...d.skills, ...(ch.skills || {}) } };
}
