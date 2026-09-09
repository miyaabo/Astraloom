"""Convert the no-line glyph backgrounds to alpha without redrawing the art.

The generated images use a near-black blue background and cyan-blue contour.
Alpha is derived from the blue-over-red signal, retaining anti-aliased contour
edges while making the dark field fully transparent.
"""

from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "no-line"


def alpha_for(brightness: int) -> int:
    # The dark blue background reaches 19 at most, while the cyan contour is
    # brighter. A ramp keeps the contour anti-aliased but removes background
    # noise entirely instead of leaving a translucent rectangular field.
    return max(0, min(255, (brightness - 20) * 12))


paths = sorted(ASSET_DIR.glob("*_線なし.png"))
if len(paths) != 89:
    raise RuntimeError(f"Expected 89 no-line PNGs, found {len(paths)}")

for path in paths:
    image = Image.open(path).convert("RGBA")
    red, green, blue, _existing_alpha = image.split()
    brightness = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    alpha = brightness.point([alpha_for(value) for value in range(256)])
    image.putalpha(alpha)
    image.save(path)

print(f"Made {len(paths)} no-line PNGs transparent.")
