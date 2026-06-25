/*
  Lobster Pixel Bible — the fixed palette, sampled from the real studio photos in
  /refs. The room is warm: burnt-orange walls, black gear, oak slat diffusers and
  wood floor, tungsten Edison-bulb glow. Vintage gear is cream-grey with red/blue/
  yellow knob accents. Every drawn pixel resolves to one of these names.

  Each material carries three shades for iso lighting: Hi = top (lit), mid = right,
  Lo = front (shadow).
*/

export const PAL = {
  // room shell
  charcoal:   '#0e0a08', // dark pools between the warm light
  wallHi:     '#d9722a', // lit burnt orange
  wall:       '#b5481f',
  wallLo:     '#6e2810',
  bulbHot:    '#ffe6a8', // Edison filament core
  bulb:       '#f4b04a',

  // oak — slat diffusers + plank floor
  woodHi:     '#a8763f',
  wood:       '#7a5226',
  woodLo:     '#492c14',
  grout:      '#2c1a0d',

  // black gear cases (Rhodes, RE-501, monitors)
  blackHi:    '#1f1a17',
  black:      '#140f0c',
  blackLo:    '#080605',

  // cream-grey vintage gear (RE-909, AKAI)
  creamHi:    '#e2dccd',
  cream:      '#c2b8a6',
  creamLo:    '#8a8071',

  // brushed silver / aluminium (Rhodes fascia, Studer strips)
  silverHi:   '#c8ccce',
  silver:     '#9aa0a2',
  silverLo:   '#5f6466',

  // knob + accent colours straight off the console
  red:        '#c0392b',
  redHi:      '#e8584a',
  redLo:      '#7a1f17',
  blue:       '#3a6ea5',
  yellow:     '#e8b53a',

  // keys + leds
  keyWhite:   '#ece6d6',
  keyShade:   '#cfc7b4',
  keyBlack:   '#15110e',
  ledRed:     '#ff5a4a',
  ledAmber:   '#ffb24a',
  ledGreen:   '#6fe89a',
};
