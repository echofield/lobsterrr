# LOBSTER — Blender render-to-pixel-sprite pipeline

Model gear in 3D **once**, render to 2D sprites from the game's iso angle. The
"Dead Cells" method: consistent lighting, fully owned (your gear), animatable, and
it keeps the real-time-3D door open (the same meshes can later feed Three.js).

## The pathway

```
  ┌── model source ──────────────────────────────┐
  │  a) procedural (pipeline/render_sprites.py)   │  free, placeholder quality
  │  b) photo→3D GLB (Higgsfield generate_3d)     │  fast, owned, needs cleanup
  │  c) hand-modeled / purchased GLB              │  best quality
  └───────────────────────────────────────────────┘
                       │  models/<gear>.glb
                       ▼
        pipeline/render_sprites.py  (Blender 5.1, headless)
          • orthographic camera, Euler X=60° Z=45°  → exact 2:1 dimetric
          • warm tungsten 3-point lighting (matches the room)
          • EEVEE, transparent film, Bible-palette materials
                       │
                       ▼
        public/sprites/hero-<id>.png   (256², transparent)
          • frames>1 → hero-<id>-00.png … (rotation animation)
                       │
                       ▼
        RoomScene loads it into the same hero-<id> slot
          (texture-swap contract — scene code unchanged)
```

## Run

```powershell
# one sprite from the built-in procedural model
pwsh pipeline/render.ps1 kawai

# from a real mesh (photo→3D output or hand-modeled / purchased)
pwsh pipeline/render.ps1 kawai 1 models/rhodes.glb

# 8-frame rotation animation
pwsh pipeline/render.ps1 nine09 8
```

Raw (any OS):
```
blender --background --python pipeline/render_sprites.py -- --id kawai --out public/sprites --size 256
```

ids: `kawai` Rhodes · `nine09` RE-909 · `moog` AKAI · `booth` RE-501.

## The one rule

The pipeline is fixed; **quality = the model.** A crude model renders crude (see the
first procedural pass). Spend effort on the mesh:
- **Owned + realistic:** photo→3D from `/refs`, cleaned in Blender → render.
- **Owned + stylized:** hand-model in Blender (these gear are boxy — very feasible).
- **Fast filler:** a licensed GLB, recolored to the Bible palette.

Never AI-generate the *sprite image* (off-grid, won't tile/animate). AI image gen is
moodboard / key-art / promo only. A 3D model rendered through this rig is owned and clean.

## Tuning knobs (in `render_sprites.py`)

- Camera angle: `add_camera()` — `Euler(60°, 0, 45°)` is the 2:1 dimetric. Don't change unless the game projection changes.
- Lighting: `add_lights()` — warm key (amber), cool fill, warm rim. Match `/refs` mood.
- Size: `--size` (render px). Palette: materials pull from `PAL` (the Bible).
- Framing: `ortho_scale = extent * 1.7` — lower to tighten the crop.

## Wiring into the game (next step, once a sprite looks good)

`RoomScene.preload()` will `this.load.image('hero-<id>', 'sprites/hero-<id>.png')` and,
on success, use it in place of the code-drawn canvas hero — falling back to the canvas if
the PNG is absent. The `hero-<id>` key is the contract; nothing else changes.
