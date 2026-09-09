"""Generates the home-screen icons. Run once; re-run only if the mark changes."""
from PIL import Image, ImageDraw

GROUND = (20, 32, 43)      # --ink, the app's darkest navy
ROUTE  = (89, 174, 224)    # --low  (blue)
HOT    = (240, 120, 92)    # --high (the attic/roof job that goes first)
S      = 4                 # supersample factor, for smooth edges

def build(size):
    n = size * S
    img = Image.new("RGB", (n, n), GROUND)
    d = ImageDraw.Draw(img)

    # Content stays inside the middle 80% so a maskable/circular crop is safe.
    pad = n * 0.22
    span = n - 2 * pad
    # Four stops sweeping up one corridor, the way the app batches a zone.
    pts = [(pad + span * x, pad + span * y) for x, y in
           ((0.08, 0.94), (0.62, 0.68), (0.16, 0.36), (0.78, 0.06))]

    d.line(pts, fill=ROUTE, width=int(n * 0.055), joint="curve")

    r = n * 0.085
    for i, (x, y) in enumerate(pts):
        top = (i == len(pts) - 1)          # last stop of the sweep = the hot one
        d.ellipse([x - r, y - r, x + r, y + r], fill=GROUND,
                  outline=HOT if top else ROUTE, width=int(n * 0.045))

    return img.resize((size, size), Image.LANCZOS)

for s in (180, 192, 512):
    build(s).save(f"icons/icon-{s}.png")
    print(f"icons/icon-{s}.png")
