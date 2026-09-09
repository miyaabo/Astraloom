#!/usr/bin/env python3
"""Build initial rigid placement data and an all-constellation review page.

This is an authoring aid only.  It does not alter artwork or application
rendering.  Each transform maps an illustration's alpha-bounds centre to the
corresponding constellation-guide skeleton centre, with one uniform scale.
"""

from __future__ import annotations

import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "tmp/constellation-illustration-manifest.json"
VALIDATION_PATH = ROOT / "tmp/constellation-final-validation.json"
ART_PATH = ROOT / "src/constellations/data/constellationArt.json"
REVIEW_PATH = ROOT / "tmp/constellation-placement-review.html"
GUIDE_SIZE = 1024
FIT_RATIO = 0.9
SVG_NS = "{http://www.w3.org/2000/svg}"


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def parse_guide(path: Path) -> tuple[list[tuple[float, float, float, float]], list[tuple[float, float, float]]]:
    root = ET.parse(path).getroot()
    lines = []
    stars = []
    for element in root:
        if element.tag == f"{SVG_NS}line":
            lines.append(
                tuple(float(element.attrib[key]) for key in ("x1", "y1", "x2", "y2"))
            )
        elif element.tag == f"{SVG_NS}circle":
            stars.append(
                tuple(float(element.attrib[key]) for key in ("cx", "cy", "r"))
            )
    if not stars:
        raise ValueError(f"No guide stars found in {relative(path)}")
    return lines, stars


def bounds_for_guide(lines: list[tuple[float, float, float, float]], stars: list[tuple[float, float, float]]) -> dict[str, float]:
    points = [(x, y) for x1, y1, x2, y2 in lines for x, y in ((x1, y1), (x2, y2))]
    points.extend((x, y) for x, y, _ in stars)
    xs, ys = zip(*points)
    return {"minX": min(xs), "minY": min(ys), "maxX": max(xs), "maxY": max(ys)}


def alpha_bounds(path: Path) -> tuple[int, int, dict[str, float]]:
    with Image.open(path) as source:
        image = source.convert("RGBA")
        bounds = image.getbbox()
        if bounds is None:
            raise ValueError(f"No visible pixels in {relative(path)}")
        min_x, min_y, max_x, max_y = bounds
        return image.width, image.height, {
            "minX": min_x,
            "minY": min_y,
            "maxX": max_x,
            "maxY": max_y,
        }


def center(bounds: dict[str, float]) -> tuple[float, float]:
    return ((bounds["minX"] + bounds["maxX"]) / 2, (bounds["minY"] + bounds["maxY"]) / 2)


def extent(bounds: dict[str, float]) -> tuple[float, float]:
    return (bounds["maxX"] - bounds["minX"], bounds["maxY"] - bounds["minY"])


def overlay_svg(
    image_path: str,
    image_width: int,
    image_height: int,
    art_bounds: dict[str, float],
    guide_lines: list[tuple[float, float, float, float]],
    guide_stars: list[tuple[float, float, float]],
    guide_bounds: dict[str, float],
    scale: float,
    offset_x: float,
    offset_y: float,
    rotation_deg: float,
    flip_x: bool,
    flip_y: bool,
) -> str:
    art_cx, art_cy = center(art_bounds)
    guide_cx, guide_cy = center(guide_bounds)
    # SVG transform order is right-to-left: first centre the visible artwork,
    # then apply optional flips, uniform scale, rotation, and final offset.
    flip_scale = f"scale({-1 if flip_x else 1} {-1 if flip_y else 1})"
    transform = (
        f"translate({guide_cx + offset_x:.3f} {guide_cy + offset_y:.3f}) "
        f"rotate({rotation_deg:.3f}) scale({scale:.6f}) {flip_scale} "
        f"translate({-art_cx:.3f} {-art_cy:.3f})"
    )
    image_href = "../" + image_path
    line_markup = "".join(
        f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" />'
        for x1, y1, x2, y2 in guide_lines
    )
    star_markup = "".join(
        f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{max(2.2, radius):.2f}" />'
        for x, y, radius in guide_stars
    )
    return f'''<svg viewBox="0 0 {GUIDE_SIZE} {GUIDE_SIZE}" aria-label="initial placement overlay">
  <rect width="{GUIDE_SIZE}" height="{GUIDE_SIZE}" fill="#0b0d14" />
  <image href="{html.escape(image_href, quote=True)}" width="{image_width}" height="{image_height}" transform="{transform}" />
  <g class="skeleton">{line_markup}{star_markup}</g>
</svg>'''


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))["constellations"]
    validation = json.loads(VALIDATION_PATH.read_text(encoding="utf-8"))
    if validation.get("manifestEntryCount") != 89 or validation.get("issueCount") != 0:
        raise RuntimeError("Final validation must contain 89 passing entries before placement data is built.")

    existing = json.loads(ART_PATH.read_text(encoding="utf-8")) if ART_PATH.exists() else []
    existing_by_id = {
        item["constellationId"]: item
        for item in existing
        if "constellationId" in item
    }
    existing_by_name = {
        name: item for item in existing for name in item.get("constellationNames", [])
    }

    records = []
    review_cards = []
    human_check_ids = []
    for entry in manifest:
        image_path = ROOT / entry["outputImagePath"]
        guide_path = ROOT / entry["guideImagePath"]
        width, height, art_bounds = alpha_bounds(image_path)
        guide_lines, guide_stars = parse_guide(guide_path)
        guide_bounds = bounds_for_guide(guide_lines, guide_stars)
        art_width, art_height = extent(art_bounds)
        guide_width, guide_height = extent(guide_bounds)
        scale = FIT_RATIO * min(guide_width / art_width, guide_height / art_height)
        aspect_mismatch = max(
            (art_width / art_height) / (guide_width / guide_height),
            (guide_width / guide_height) / (art_width / art_height),
        )
        # The automatic fit only has bounding boxes, so highly different
        # silhouettes deserve an explicit visual decision in Human Check.
        needs_human_check = aspect_mismatch >= 2.5
        if needs_human_check:
            human_check_ids.append(entry["constellationId"])

        previous = existing_by_id.get(
            entry["constellationId"], existing_by_name.get(entry["name"], {})
        )
        offset_x = previous.get("offsetX", 0)
        offset_y = previous.get("offsetY", 0)
        placement_scale = previous.get("scale", round(scale, 8))
        rotation_deg = previous.get("rotationDeg", 0)
        flip_x = previous.get("flipX", False)
        flip_y = previous.get("flipY", False)
        record = {
            # Existing runtime-catalog fields are kept.  Empty anchors mean
            # this authoring data cannot affect the app until a later,
            # explicitly approved anchor-integration task.
            "constellationNames": [entry["name"]],
            "imageUrl": "/" + entry["outputImagePath"].removeprefix("public/"),
            "imageWidthPx": width,
            "imageHeightPx": height,
            "pixelBounds": art_bounds,
            "anchors": previous.get("anchors", []),
            # Initial rigid-placement authoring fields.
            "constellationId": entry["constellationId"],
            "imagePath": entry["outputImagePath"],
            "guideImagePath": entry["guideImagePath"],
            "offsetX": offset_x,
            "offsetY": offset_y,
            "scale": placement_scale,
            "rotationDeg": rotation_deg,
            "flipX": flip_x,
            "flipY": flip_y,
            "guideBounds": guide_bounds,
            "needsHumanCheck": needs_human_check,
        }
        records.append(record)
        image_src = "../" + entry["outputImagePath"]
        guide_src = entry["guideImagePath"].removeprefix("tmp/")
        overlay = overlay_svg(entry["outputImagePath"], width, height, art_bounds, guide_lines, guide_stars, guide_bounds, placement_scale, offset_x, offset_y, rotation_deg, flip_x, flip_y)
        review_cards.append(f'''<article class="card" id="{entry["constellationId"]}">
  <h2>{html.escape(entry["nameJa"])} <span>{html.escape(entry["name"])} · {entry["constellationId"]}</span></h2>
  <p>scale {placement_scale:.4f} · offset ({offset_x}, {offset_y}) · rotation {rotation_deg}° · flipX {str(flip_x).lower()} · flipY {str(flip_y).lower()}{(" · 要確認" if needs_human_check else "")}</p>
  <div class="comparison">
    <figure><figcaption>実データ骨格ガイド</figcaption><img src="{html.escape(guide_src, quote=True)}" alt="{html.escape(entry["name"])} guide" /></figure>
    <figure><figcaption>線なしイラスト</figcaption><div class="art"><img src="{html.escape(image_src, quote=True)}" alt="{html.escape(entry["name"])} illustration" /></div></figure>
    <figure><figcaption>初期配置 + 実データ骨格</figcaption>{overlay}</figure>
  </div>
</article>''')

    ART_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    review = f'''<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Constellation art initial placement review</title>
  <style>
    :root {{ color-scheme: dark; font-family: system-ui, sans-serif; background: #080b12; color: #e8efff; }}
    body {{ margin: 0; padding: 24px; }}
    h1 {{ margin: 0 0 6px; }} p {{ color: #aebbd3; }}
    .card {{ margin: 28px 0; padding: 18px; border: 1px solid #26344f; border-radius: 12px; background: #101725; }}
    h2 {{ margin: 0; font-size: 20px; }} h2 span {{ color: #aebbd3; font-size: 15px; font-weight: 500; }}
    .comparison {{ display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }}
    figure {{ margin: 0; }} figcaption {{ margin: 8px 0; color: #aebbd3; font-size: 13px; }}
    figure > img, .art, figure > svg {{ display: block; width: 100%; aspect-ratio: 1; background: #0b0d14; object-fit: contain; }}
    .art {{ position: relative; overflow: hidden; }} .art img {{ width: 100%; height: 100%; object-fit: contain; }}
    .skeleton line {{ stroke: #ffd166; stroke-width: 2; stroke-opacity: .9; }} .skeleton circle {{ fill: #fff; stroke: #0b0d14; stroke-width: .75; }}
    @media (max-width: 900px) {{ body {{ padding: 12px; }} .comparison {{ grid-template-columns: 1fr; }} }}
  </style>
</head>
<body>
  <h1>89星座 — 線なしイラスト初期配置レビュー</h1>
  <p>中央合わせ・一様スケール（ガイド骨格範囲の90%に収める）による初期値です。右は実データ由来の星・星座線を最前面に重ねています。回転・反転・位置・縮尺は Human Check 後にのみ調整します。</p>
  {''.join(review_cards)}
</body>
</html>
'''
    REVIEW_PATH.write_text(review, encoding="utf-8")
    print(json.dumps({
        "records": len(records),
        "flipXCount": 0,
        "flipYCount": 0,
        "humanCheckIds": human_check_ids,
        "artData": relative(ART_PATH),
        "review": relative(REVIEW_PATH),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
