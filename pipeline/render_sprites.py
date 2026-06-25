#!/usr/bin/env python
"""
LOBSTER — Blender render-to-pixel-sprite pipeline.

Renders gear as 2:1 dimetric sprites that drop straight into the game's
`hero-<id>` texture slots. The "Dead Cells" method: model once in 3D, render to
2D from the iso angle — consistent lighting, owned, and animatable (frames>1).

Run headless:
  blender --background --python pipeline/render_sprites.py -- \
      --id kawai --out public/sprites --size 192

  # from an imported mesh (photo->3D GLB or hand-modeled), instead of procedural:
  blender --background --python pipeline/render_sprites.py -- \
      --id kawai --model models/rhodes.glb --out public/sprites

  # rotation animation (8 frames around Z):
  blender --background --python pipeline/render_sprites.py -- \
      --id nine09 --frames 8 --out public/sprites

Camera is the game's exact 2:1 dimetric: orthographic, Euler X=60° Z=45°
(cos60°=0.5 squashes vertical to give the 2:1 tile ratio). Lighting matches the
warm tungsten studio. Materials use the Lobster Pixel Bible palette.
"""
import bpy, sys, math, argparse, os
from mathutils import Vector

# ── Pixel Bible palette (sRGB hex) ──
PAL = {
    "wall": "#b5481f", "wallHi": "#d9722a",
    "wood": "#7a5226", "woodHi": "#a8763f",
    "blackHi": "#1f1a17", "black": "#140f0c", "blackLo": "#080605",
    "creamHi": "#e2dccd", "cream": "#c2b8a6", "creamLo": "#8a8071",
    "silverHi": "#c8ccce", "silver": "#9aa0a2", "silverLo": "#5f6466",
    "red": "#c0392b", "blue": "#3a6ea5", "yellow": "#e8b53a",
    "keyWhite": "#ece6d6", "keyBlack": "#15110e",
    "amber": "#f4b04a", "ledRed": "#ff5a4a",
}


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_lin(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), 1.0)


# ── scene reset ──
def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for d in list(coll):
            coll.remove(d)


def mat(name, hex_col, rough=0.55, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = hex_lin(hex_col)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    return m


def box(name, loc, size, hex_col, rough=0.55, metal=0.0, bevel=0.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    b = o.modifiers.new("bevel", "BEVEL")
    b.width = bevel; b.segments = 2
    o.data.materials.append(mat(name + "_m", hex_col, rough, metal))
    return o  # flat-shaded: crisp faces read better for boxy gear


def cyl(name, loc, radius, height, hex_col, rough=0.4, metal=0.0, axis="Z", verts=24):
    """Smooth cylinder — chrome legs, key-slip bar, cross-braces."""
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=height, location=loc, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    if axis == "X":
        o.rotation_euler[1] = math.radians(90)
    elif axis == "Y":
        o.rotation_euler[0] = math.radians(90)
    bpy.ops.object.shade_smooth()
    o.data.materials.append(mat(name + "_m", hex_col, rough, metal))
    return o


# ── procedural gear. These instruments are boxy, so careful primitives read well.
#    Built centred on origin, sitting on z=0; camera sees the +X / -Y / top faces,
#    so keybeds + control surfaces face -Y (toward camera). ──
def build_rhodes():
    # ── Rhodes Mark I Suitcase 73: tubular chrome stand, black tolex case,
    #    back name-rail (red felt + silver logo), sloped keybed facing camera ──
    L = 0.62  # chrome stand height
    for sx in (-1.4, 1.4):            # four splayed tubular chrome legs
        for sy in (-0.42, 0.42):
            leg = cyl(f"leg{sx}{sy}", (sx, sy, L / 2), 0.05, L, PAL["silverHi"], 0.22, 0.25)
            leg.rotation_euler[1] = math.radians(-7 if sx < 0 else 7)   # feet splay out
            leg.rotation_euler[0] = math.radians(7 if sy > 0 else -7)
    cyl("braceX", (0, 0, 0.16), 0.035, 2.8, PAL["silver"], 0.25, 0.25, axis="X")  # chrome braces
    cyl("braceYL", (-1.4, 0, 0.16), 0.035, 0.9, PAL["silver"], 0.25, 0.25, axis="Y")
    cyl("braceYR", (1.4, 0, 0.16), 0.035, 0.9, PAL["silver"], 0.25, 0.25, axis="Y")

    z0 = L + 0.5                       # top surface of the case
    box("case", (0, 0, L + 0.25), (3.15, 1.06, 0.5), PAL["black"], 0.5, bevel=0.03)  # tolex suitcase
    box("caseTop", (0, 0, z0 + 0.005), (3.0, 0.96, 0.04), PAL["blackHi"], 0.45)      # lid top
    box("rail", (0, 0.36, z0 + 0.10), (3.0, 0.30, 0.16), PAL["blackLo"], 0.4, bevel=0.02)  # name rail
    box("felt", (0, 0.205, z0 + 0.14), (3.0, 0.04, 0.05), PAL["red"], 0.75)          # red felt strip
    box("logoPlate", (0, 0.36, z0 + 0.185), (1.6, 0.18, 0.02), PAL["black"], 0.5)
    box("logo", (0, 0.36, z0 + 0.205), (1.35, 0.08, 0.015), PAL["silverHi"], 0.2, 0.7)  # silver logo
    cyl("slip", (0, -0.52, z0 + 0.02), 0.05, 3.04, PAL["blackHi"], 0.4, axis="X")    # front key-slip lip

    nW, kw = 14, 3.0 / 14
    for i in range(nW):               # white keys
        x = -1.5 + kw * 0.5 + i * kw
        box(f"w{i}", (x, -0.16, z0 + 0.045), (kw * 0.80, 0.66, 0.07), PAL["keyWhite"], 0.3)
    for i in range(nW - 1):           # black keys toward the back, skipping E-F and B-C gaps
        if i % 7 in (2, 6):
            continue
        x = -1.5 + kw * (i + 1)
        box(f"bk{i}", (x, 0.02, z0 + 0.10), (kw * 0.5, 0.34, 0.07), PAL["keyBlack"], 0.3)


def build_re909():
    box("body", (0, 0, 0.22), (2.6, 1.5, 0.44), PAL["cream"], 0.45)
    box("surf", (0, 0.05, 0.44), (2.4, 1.3, 0.03), "#b3a995", 0.55)
    for i in range(11):               # knob row (back)
        box(f"k{i}", (-1.0 + i * 0.2, 0.42, 0.49), (0.1, 0.1, 0.12), PAL["blackLo"], 0.4)
    box("led", (-0.85, 0.05, 0.47), (0.6, 0.22, 0.03), PAL["ledRed"], 0.7)  # LED window
    for i in range(16):               # 16-step button strip (front)
        c = PAL["red"] if i % 4 == 0 else PAL["amber"]
        box(f"s{i}", (-1.15 + i * 0.155, -0.4, 0.46), (0.11, 0.34, 0.04), c, 0.6)


def build_akai():
    box("body", (0, 0, 0.28), (2.5, 1.5, 0.56), PAL["cream"], 0.45)
    box("lcd", (-0.75, -0.4, 0.57), (0.8, 0.5, 0.03), "#2f4a44", 0.3)       # LCD
    box("jog", (0.15, -0.4, 0.58), (0.55, 0.55, 0.08), PAL["creamLo"], 0.5) # jog wheel
    box("jogc", (0.15, -0.4, 0.63), (0.22, 0.22, 0.03), PAL["blackLo"], 0.4)
    for i in range(4):                # 4x4 pad matrix
        for j in range(4):
            box(f"p{i}{j}", (-0.55 + j * 0.36, 0.05 + i * 0.26, 0.57),
                (0.28, 0.2, 0.05), "#7d7468", 0.5)


def build_re501():
    box("body", (0, 0, 0.30), (2.5, 1.4, 0.60), PAL["black"], 0.5)
    box("panel", (0, -0.1, 0.60), (2.3, 1.0, 0.04), "#26201c", 0.5)
    for i in range(6):                # orange/red knob row
        c = PAL["red"] if i % 2 else PAL["amber"]
        box(f"k{i}", (-0.9 + i * 0.36, -0.45, 0.64), (0.18, 0.18, 0.12), c, 0.45)
    box("vuL", (-0.55, 0.2, 0.62), (0.55, 0.36, 0.03), PAL["creamHi"], 0.4)  # twin VU
    box("vuR", (0.2, 0.2, 0.62), (0.55, 0.36, 0.03), PAL["creamHi"], 0.4)
    box("reel", (0.95, 0.0, 0.62), (0.5, 0.7, 0.04), PAL["silverLo"], 0.4)   # tape side


BUILDERS = {"kawai": build_rhodes, "nine09": build_re909,
            "moog": build_akai, "booth": build_re501}


def import_glb(path):
    bpy.ops.import_scene.gltf(filepath=path)
    # normalise: drop to floor, centre on origin, scale to ~2 units wide
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for v in o.bound_box:
            w = o.matrix_world @ Vector(v)
            mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
    center = (mn + mx) / 2
    span = max((mx - mn).x, (mx - mn).y, 0.001)
    s = 2.2 / span
    for o in objs:
        o.location -= Vector((center.x, center.y, mn.z))
        o.scale *= s


def scene_bounds():
    mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
    for o in bpy.context.scene.objects:
        if o.type != "MESH":
            continue
        for v in o.bound_box:
            w = o.matrix_world @ Vector(v)
            mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
    return mn, mx


# ── camera: the game's 2:1 dimetric ──
def add_camera():
    cam_d = bpy.data.cameras.new("cam"); cam_d.type = "ORTHO"
    cam = bpy.data.objects.new("cam", cam_d)
    bpy.context.scene.collection.objects.link(cam)
    cam.rotation_euler = (math.radians(60), 0, math.radians(45))  # 2:1 dimetric
    mn, mx = scene_bounds()
    target = (mn + mx) / 2
    extent = max((mx - mn).x, (mx - mn).y, (mx - mn).z)
    cam_d.ortho_scale = extent * 1.3
    fwd = cam.rotation_euler.to_matrix() @ Vector((0, 0, -1))
    cam.location = target - fwd * 20
    bpy.context.scene.camera = cam
    return cam


# ── warm tungsten studio lighting ──
def add_lights():
    def area(name, loc, energy, color, sz=6):
        d = bpy.data.lights.new(name, "AREA"); d.energy = energy; d.size = sz
        d.color = hex_lin(color)[:3]
        o = bpy.data.objects.new(name, d); o.location = loc
        bpy.context.scene.collection.objects.link(o)
        # aim at origin
        o.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        return o
    # neutral-warm key so materials keep their true colour; warmth comes from the rim
    area("key", (4, -5, 7), 550, "#fff1da")             # warm-white key, upper-front-right
    area("fill", (-6, -3, 3), 220, "#b9c6d4", sz=9)     # cool fill, lifts the shadows
    area("rim", (-2, 6, 6), 420, PAL["amber"])          # amber rim from behind (mood)


def setup_render(size):
    sc = bpy.context.scene
    try:
        sc.render.engine = "BLENDER_EEVEE_NEXT"
    except Exception:
        sc.render.engine = "BLENDER_EEVEE"
    sc.render.film_transparent = True
    sc.render.resolution_x = size; sc.render.resolution_y = size
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    try:
        sc.eevee.taa_render_samples = 32
    except Exception:
        pass
    # dark warm world
    w = bpy.data.worlds.new("w"); w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.015, 0.01, 1)
    sc.world = w


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True, choices=list(BUILDERS))
    ap.add_argument("--model", default=None, help="optional GLB to render instead of procedural")
    ap.add_argument("--out", default="public/sprites")
    ap.add_argument("--size", type=int, default=192)
    ap.add_argument("--frames", type=int, default=1)
    args = ap.parse_args(argv)

    clear()
    if args.model:
        import_glb(args.model)
    else:
        BUILDERS[args.id]()
    add_camera()
    add_lights()
    setup_render(args.size)

    out_dir = os.path.abspath(args.out)
    os.makedirs(out_dir, exist_ok=True)

    if args.frames <= 1:
        bpy.context.scene.render.filepath = os.path.join(out_dir, f"hero-{args.id}.png")
        bpy.ops.render.render(write_still=True)
        print(f"[lobster] wrote hero-{args.id}.png")
    else:
        # rotate the gear around Z for an animation strip of separate frames
        meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
        for f in range(args.frames):
            ang = (2 * math.pi) * f / args.frames
            for o in meshes:
                o.rotation_euler[2] = ang
            bpy.context.scene.render.filepath = os.path.join(out_dir, f"hero-{args.id}-{f:02d}.png")
            bpy.ops.render.render(write_still=True)
        print(f"[lobster] wrote {args.frames} frames for hero-{args.id}")


if __name__ == "__main__":
    main()
