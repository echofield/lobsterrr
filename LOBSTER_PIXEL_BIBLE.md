# Lobster Pixel Bible

The visual constitution for the LOBSTER pixel studio. Written before sprites so the
room reads as one authored object, not a stack of assets. Grounded in the real
studio photos in `/refs` — this is *your* room, which is the one thing a copy can't have.

> Beauty comes from this bible + hand-authored sprites, never from a generator.
> **AI is for moodboard / key art / promo only.** Off-grid, palette-drifting output
> is useless as a game asset and is banned from the render.

---

## 1. Projection — 2:1 dimetric

- Iso voxel space → screen: `sx = (x - y)·S`, `sy = (x + y)·S/2 - z·S`. `+x` down-right, `+y` down-left, `+z` up.
- Every object is built from iso boxes with **three visible faces**: top (lit), right (mid), front (shadow). One light direction across the whole room — never shade an object against the room light.
- Author small, upscale nearest-neighbour. Sprites live at ~120×132 logical px, displayed ~2.1×. Crisp pixels, no blur. `imageSmoothingEnabled = false`, Phaser `pixelArt: true`.
- Implementation: `src/art/iso.js` (`isoBox`, `isoTile`, `glow`). Do not reinvent the projection — call these.

## 2. Palette — the real room (`src/art/palette.js`)

Warm and tungsten-lit. Burnt-orange walls, black gear, oak wood, cream-grey vintage
units with red/blue/yellow knob accents. No colour enters the render unnamed.

| Material | Hi (lit) | Mid | Lo (shadow) |
|---|---|---|---|
| Burnt-orange wall | `#d9722a` | `#b5481f` | `#6e2810` |
| Oak (slats + floor) | `#a8763f` | `#7a5226` | `#492c14` |
| Black gear case | `#1f1a17` | `#140f0c` | `#080605` |
| Cream-grey gear | `#e2dccd` | `#c2b8a6` | `#8a8071` |
| Brushed silver | `#c8ccce` | `#9aa0a2` | `#5f6466` |
| Tungsten bulb | `#ffe6a8` (core) | `#f4b04a` | — |

Knob/accent: red `#c0392b` · blue `#3a6ea5` · yellow `#e8b53a`. Keys: white `#ece6d6`, black `#15110e`. LEDs: red `#ff5a4a`, amber `#ffb24a`, green `#6fe89a`.

## 3. Gear inventory — the real signature stack

The four playable heroes are the actual instruments in `/refs`, not generic gear:

| Zone id | Hero | Role | Look |
|---|---|---|---|
| `kawai` | **Rhodes Mark II Seventy Three** | chords | low wide black suitcase, brushed-silver name strip, red felt line, white key bed |
| `nine09` | **Roland RE-909** | drums | cream box, recessed surface, knob row, red/amber 16-step buttons, LED window |
| `moog` | **AKAI sampler** | bass + arp | cream box, dark LCD, jog wheel, 4×4 grey pad grid |
| `booth` | **Roland RE-501 Chorus Echo** | pad | black box, brushed-silver top, orange/red knob row, twin VU squares |

Secondary props (atmosphere, author as needed): **Studer console** (silver channel
strips, red/blue/yellow knobs, VU meters, faders), black **studio monitors**, oak slat
diffuser, hanging **Edison bulbs**, Persian rug, wood floor.

> Zone **ids are stable** (`kawai/nine09/moog/booth`) so audio + hit-test wiring never
> moves; the gear identity lives in `zones.js` labels and `heroSprites.js` recipes.

## 4. UI grammar

- Type: monospace (`Courier New`), uppercase labels, wide letter-spacing. Editorial, not chrome.
- Active zone = a thin spinning ring in the zone's accent colour + a quick scale pulse on the hero.
- Global filter = the warm tungsten wash brightening across the top of the room.
- Cursor = a small tungsten reticle. No drop-shadows, no gradients except the bulb `glow`.

## 5. The texture-swap contract

Code-drawn heroes today are placeholders for hand-painted Aseprite sprites. The scene
binds each hero by texture key `hero-<id>`. Swapping in a `.png` (or a richer canvas
recipe) is a **texture swap** — `roomScene.js` does not change. Author replacements at
the same logical size, same projection, same palette.

## 6. Authoring checklist (every new object)

1. Built from `isoBox`/`isoTile`? One light direction (top/right/front)?
2. Every colour from §2? No off-palette pixel?
3. Reads against the warm room at display scale (no mud, no blur)?
4. Footprint centred on the voxel origin, seated on a base tile?
5. Grounded in a `/refs` photo — is this *our* gear, not a generic stand-in?
