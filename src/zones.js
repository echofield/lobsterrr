/*
  The four instrument zones — drawn from the real Lobster gear, all in A minor
  so any combination is musical. This config is the shared contract: the room
  renders from it, the audio engine voices from it, the sources address it by id.

  Layout coords are normalised 0..1 over the room floor (iso space). The room
  scene maps them to screen; the pointer/gesture sources test proximity to them.
*/

// Labels are the REAL Lobster signature stack (see /refs). ids stay stable
// (kawai/nine09/moog/booth) so audio + hit-test wiring is untouched.
export const ZONES = [
  {
    id: 'kawai',
    label: 'Rhodes Mk II',
    role: 'chords',
    key: 'Digit1',
    at: { x: 0.33, y: 0.50 },
    color: 0xf4b04a, // tungsten bulb amber
  },
  {
    id: 'nine09',
    label: 'RE-909',
    role: 'drums',
    key: 'Digit2',
    at: { x: 0.67, y: 0.50 },
    color: 0xc0392b, // step-button red
  },
  {
    id: 'moog',
    label: 'AKAI sampler',
    role: 'bass + arp',
    key: 'Digit3',
    at: { x: 0.30, y: 0.78 },
    color: 0x3a6ea5, // console blue knob
  },
  {
    id: 'booth',
    label: 'RE-501 echo',
    role: 'pad',
    key: 'Digit4',
    at: { x: 0.70, y: 0.78 },
    color: 0xd9722a, // burnt-orange wall
  },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));
export const ZONE_BY_KEY = Object.fromEntries(ZONES.map((z) => [z.key, z]));
