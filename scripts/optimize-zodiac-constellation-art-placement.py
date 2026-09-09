#!/usr/bin/env python3
"""One-pass rigid auto-fit for the twelve zodiac constellation illustrations.

Skeleton coordinates come from tmp/constellation-illustration-data, never by
reading the labelled guide SVGs.  The output changes only the six permitted
placement values for the zodiac records and writes a before/after review.
"""

from __future__ import annotations

import html
import json
import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
ART_PATH = ROOT / "src/constellations/data/constellationArt.json"
SKELETON_DIR = ROOT / "tmp/constellation-illustration-data"
BACKUP_PATH = ROOT / "tmp/constellation-art-zodiac-placement-backup.json"
RESULT_PATH = ROOT / "tmp/constellation-art-zodiac-autofit.json"
REVIEW_PATH = ROOT / "tmp/constellation-placement-optimization-review.html"
ZODIAC = ("Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc")
CANVAS = 1024
PADDING = 0.12
DISTANCE_SIZE = 256
INF = 10_000.0


def guide_geometry(skeleton: dict) -> tuple[dict[int, tuple[float, float]], list[tuple[float, float, float, float]]]:
    stars = skeleton["stars"]
    min_x, max_x = min(s["x"] for s in stars), max(s["x"] for s in stars)
    min_y, max_y = min(s["y"] for s in stars), max(s["y"] for s in stars)
    center_x, center_y = (min_x + max_x) / 2, (min_y + max_y) / 2
    scale = CANVAS * (1 - 2 * PADDING) / max(max_x - min_x, max_y - min_y)
    points = {
        star["id"]: (CANVAS / 2 + (star["x"] - center_x) * scale, CANVAS / 2 - (star["y"] - center_y) * scale)
        for star in stars
    }
    lines = [(points[line["from"]][0], points[line["from"]][1], points[line["to"]][0], points[line["to"]][1]) for line in skeleton["lines"]]
    return points, lines


def sample_skeleton(points: dict[int, tuple[float, float]], lines: list[tuple[float, float, float, float]]) -> tuple[list[tuple[float, float]], list[tuple[float, float]]]:
    line_samples = []
    for x1, y1, x2, y2 in lines:
        count = max(6, int(math.hypot(x2 - x1, y2 - y1) / 18))
        for index in range(count + 1):
            ratio = index / count
            line_samples.append((x1 + (x2 - x1) * ratio, y1 + (y2 - y1) * ratio))
    # The score is a spatial average; cap density so the two-stage search is
    # deterministic and fast enough to remain an authoring command, not a
    # long-running batch optimizer.
    if len(line_samples) > 240:
        stride = math.ceil(len(line_samples) / 240)
        line_samples = line_samples[::stride]
    return line_samples, list(points.values())


def alpha_distance(image_path: Path) -> tuple[list[float], int, int]:
    with Image.open(image_path) as source:
        rgba = source.convert("RGBA")
        width, height = rgba.size
        alpha = rgba.getchannel("A").resize((DISTANCE_SIZE, DISTANCE_SIZE), Image.Resampling.LANCZOS)
    values = list(alpha.getdata())
    distance = [0.0 if value > 12 else INF for value in values]
    side = DISTANCE_SIZE
    diagonal = math.sqrt(2)
    for y in range(side):
        for x in range(side):
            index = y * side + x
            value = distance[index]
            if x:
                value = min(value, distance[index - 1] + 1)
            if y:
                value = min(value, distance[index - side] + 1)
                if x:
                    value = min(value, distance[index - side - 1] + diagonal)
                if x + 1 < side:
                    value = min(value, distance[index - side + 1] + diagonal)
            distance[index] = value
    for y in range(side - 1, -1, -1):
        for x in range(side - 1, -1, -1):
            index = y * side + x
            value = distance[index]
            if x + 1 < side:
                value = min(value, distance[index + 1] + 1)
            if y + 1 < side:
                value = min(value, distance[index + side] + 1)
                if x:
                    value = min(value, distance[index + side - 1] + diagonal)
                if x + 1 < side:
                    value = min(value, distance[index + side + 1] + diagonal)
            distance[index] = value
    return distance, width, height


def inverse_transform(point: tuple[float, float], record: dict, candidate: dict) -> tuple[float, float]:
    guide = record["guideBounds"]
    bounds = record["pixelBounds"]
    guide_x = (guide["minX"] + guide["maxX"]) / 2 + candidate["offsetX"]
    guide_y = (guide["minY"] + guide["maxY"]) / 2 + candidate["offsetY"]
    dx = (point[0] - guide_x) / candidate["scale"]
    dy = (point[1] - guide_y) / candidate["scale"]
    radians = math.radians(candidate["rotationDeg"])
    cos, sin = math.cos(radians), math.sin(radians)
    # Inverse screen-space rotation, then inverse optional reflection.
    x = cos * dx + sin * dy
    y = -sin * dx + cos * dy
    if candidate["flipX"]:
        x = -x
    if candidate["flipY"]:
        y = -y
    return ((bounds["minX"] + bounds["maxX"]) / 2 + x, (bounds["minY"] + bounds["maxY"]) / 2 + y)


def transform_point(point: tuple[float, float], record: dict, candidate: dict) -> tuple[float, float]:
    bounds, guide = record["pixelBounds"], record["guideBounds"]
    x = point[0] - (bounds["minX"] + bounds["maxX"]) / 2
    y = point[1] - (bounds["minY"] + bounds["maxY"]) / 2
    if candidate["flipX"]:
        x = -x
    if candidate["flipY"]:
        y = -y
    radians = math.radians(candidate["rotationDeg"])
    cos, sin = math.cos(radians), math.sin(radians)
    return (
        (guide["minX"] + guide["maxX"]) / 2 + candidate["offsetX"] + candidate["scale"] * (cos * x - sin * y),
        (guide["minY"] + guide["maxY"]) / 2 + candidate["offsetY"] + candidate["scale"] * (sin * x + cos * y),
    )


def score_candidate(record: dict, candidate: dict, distance: list[float], image_width: int, image_height: int, line_samples: list[tuple[float, float]], stars: list[tuple[float, float]], base_scale: float) -> float:
    def point_distance(point: tuple[float, float]) -> float:
        x, y = inverse_transform(point, record, candidate)
        if x < 0 or y < 0 or x >= image_width or y >= image_height:
            return 48.0 + min(80.0, max(-x, -y, x - image_width, y - image_height) / 8)
        ix = min(DISTANCE_SIZE - 1, max(0, round(x / image_width * (DISTANCE_SIZE - 1))))
        iy = min(DISTANCE_SIZE - 1, max(0, round(y / image_height * (DISTANCE_SIZE - 1))))
        return distance[iy * DISTANCE_SIZE + ix]

    line_mean = sum(point_distance(point) for point in line_samples) / len(line_samples)
    star_mean = sum(point_distance(point) for point in stars) / len(stars)
    corners = [
        (record["pixelBounds"]["minX"], record["pixelBounds"]["minY"]),
        (record["pixelBounds"]["maxX"], record["pixelBounds"]["minY"]),
        (record["pixelBounds"]["minX"], record["pixelBounds"]["maxY"]),
        (record["pixelBounds"]["maxX"], record["pixelBounds"]["maxY"]),
    ]
    edge_penalty = 0.0
    for corner in corners:
        x, y = transform_point(corner, record, candidate)
        edge_penalty += max(0, 20 - x, x - (CANVAS - 20), 20 - y, y - (CANVAS - 20)) / 8
    scale_penalty = 2.5 * abs(math.log(candidate["scale"] / base_scale))
    return 0.65 * line_mean + 0.35 * star_mean + edge_penalty + scale_penalty


def candidates(base: dict):
    for flip_x in (False, True):
        for flip_y in (False, True):
            for rotation in range(-180, 181, 45):
                for factor in (0.55, 0.75, 1.0, 1.35, 1.75):
                    for offset_x in range(-120, 121, 120):
                        for offset_y in range(-120, 121, 120):
                            yield {"offsetX": offset_x, "offsetY": offset_y, "scale": base["scale"] * factor, "rotationDeg": rotation, "flipX": flip_x, "flipY": flip_y}


def fine_candidates(best: dict):
    for rotation in range(int(best["rotationDeg"] - 24), int(best["rotationDeg"] + 25), 8):
        for factor_index in range(-2, 3):
            for offset_x in range(int(best["offsetX"] - 48), int(best["offsetX"] + 49), 24):
                for offset_y in range(int(best["offsetY"] - 48), int(best["offsetY"] + 49), 24):
                    yield {"offsetX": offset_x, "offsetY": offset_y, "scale": best["scale"] * (1 + factor_index * 0.05), "rotationDeg": rotation, "flipX": best["flipX"], "flipY": best["flipY"]}


def optimize(record: dict, skeleton: dict) -> dict:
    distance, image_width, image_height = alpha_distance(ROOT / record["imagePath"])
    points, lines = guide_geometry(skeleton)
    line_samples, stars = sample_skeleton(points, lines)
    base = {key: record[key] for key in ("offsetX", "offsetY", "scale", "rotationDeg", "flipX", "flipY")}
    base_scale = base["scale"]
    initial_score = score_candidate(record, base, distance, image_width, image_height, line_samples, stars, base_scale)
    coarse = min(candidates(base), key=lambda candidate: score_candidate(record, candidate, distance, image_width, image_height, line_samples, stars, base_scale))
    best = min(fine_candidates(coarse), key=lambda candidate: score_candidate(record, candidate, distance, image_width, image_height, line_samples, stars, base_scale))
    best_score = score_candidate(record, best, distance, image_width, image_height, line_samples, stars, base_scale)
    # Lower distance is better. The scale/edge penalties are deliberately in
    # the same score, so a high score means the matching remains unreliable.
    confidence = max(0.0, min(1.0, 1 - best_score / 24))
    return {
        "constellationId": record["constellationId"],
        "name": skeleton["name"],
        "nameJa": skeleton["nameJa"],
        "before": base,
        "after": {**best, "scale": round(best["scale"], 8)},
        "initialScore": round(initial_score, 3),
        "optimizedScore": round(best_score, 3),
        "confidence": round(confidence, 3),
        "needsHumanCheck": confidence < 0.58,
        "sampleCounts": {"line": len(line_samples), "stars": len(stars)},
    }


def overlay_svg(record: dict, skeleton: dict, placement: dict) -> str:
    points, lines = guide_geometry(skeleton)
    bounds, guide = record["pixelBounds"], record["guideBounds"]
    art_center_x = (bounds["minX"] + bounds["maxX"]) / 2
    art_center_y = (bounds["minY"] + bounds["maxY"]) / 2
    guide_center_x = (guide["minX"] + guide["maxX"]) / 2 + placement["offsetX"]
    guide_center_y = (guide["minY"] + guide["maxY"]) / 2 + placement["offsetY"]
    transform = f'translate({guide_center_x:.3f} {guide_center_y:.3f}) rotate({placement["rotationDeg"]:.3f}) scale({placement["scale"]:.8f}) scale({-1 if placement["flipX"] else 1} {-1 if placement["flipY"] else 1}) translate({-art_center_x:.3f} {-art_center_y:.3f})'
    image_href = "../" + record["imagePath"]
    line_markup = "".join(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" />' for x1, y1, x2, y2 in lines)
    star_markup = "".join(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="4.5" />' for x, y in points.values())
    return f'<svg viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#0b0d14" /><image href="{html.escape(image_href, quote=True)}" width="{record["imageWidthPx"]}" height="{record["imageHeightPx"]}" transform="{transform}" /><g class="skeleton">{line_markup}{star_markup}</g></svg>'


def main() -> None:
    records = json.loads(ART_PATH.read_text(encoding="utf-8"))
    by_id = {record["constellationId"]: record for record in records}
    if set(ZODIAC) - by_id.keys():
        raise RuntimeError("Missing zodiac placement records")
    backup = [{"constellationId": constellation_id, **{key: by_id[constellation_id][key] for key in ("offsetX", "offsetY", "scale", "rotationDeg", "flipX", "flipY")}} for constellation_id in ZODIAC]
    BACKUP_PATH.write_text(json.dumps(backup, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    results = []
    skeletons = {}
    for constellation_id in ZODIAC:
        skeleton = json.loads((SKELETON_DIR / f"{constellation_id}.json").read_text(encoding="utf-8"))
        skeletons[constellation_id] = skeleton
        results.append(optimize(by_id[constellation_id], skeleton))
    for result in results:
        record = by_id[result["constellationId"]]
        record.update(result["after"])
        record["needsHumanCheck"] = result["needsHumanCheck"]
    ART_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    RESULT_PATH.write_text(json.dumps({"method": "alpha distance transform; sampled source-data lines and stars; coarse then fine rigid search", "results": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    cards = []
    for result in results:
        record = by_id[result["constellationId"]]
        skeleton = skeletons[result["constellationId"]]
        before = overlay_svg(record, skeleton, result["before"])
        after = overlay_svg(record, skeleton, result["after"])
        cards.append(f'''<article><h2>{html.escape(result["nameJa"])} <span>{html.escape(result["name"])} · {result["constellationId"]}</span></h2><p>confidence {result["confidence"]:.3f} · score {result["initialScore"]:.2f} → {result["optimizedScore"]:.2f}{" · Human Check 推奨" if result["needsHumanCheck"] else ""}</p><div class="compare"><figure><figcaption>現在の配置</figcaption>{before}</figure><figure><figcaption>自動最適化後</figcaption>{after}</figure></div></article>''')
    REVIEW_PATH.write_text(f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zodiac constellation art optimization review</title><style>:root{{color-scheme:dark;font-family:system-ui,sans-serif;background:#080b12;color:#e8efff}}body{{margin:0;padding:24px}}article{{margin:24px 0;padding:16px;border:1px solid #26344f;border-radius:12px;background:#101725}}h1,h2{{margin:0}}h2 span,p,figcaption{{color:#aebbd3;font-size:14px;font-weight:500}}.compare{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}}figure{{margin:0}}figure svg{{display:block;width:100%;aspect-ratio:1;background:#0b0d14}}.skeleton line{{stroke:#ffd166;stroke-width:2;stroke-opacity:.9}}.skeleton circle{{fill:#fff;stroke:#0b0d14;stroke-width:.75}}@media(max-width:760px){{body{{padding:12px}}.compare{{grid-template-columns:1fr}}}}</style></head><body><h1>黄道12星座 — 自動剛体フィット比較</h1><p>左はバックアップ済みの現在値、右はPNGのアルファ線画への距離と実データ骨格の星・線サンプルで一度だけ探索した値です。画像変形は行わず、平行移動・回転・一様拡縮・反転だけを使います。</p>{''.join(cards)}</body></html>''', encoding="utf-8")
    print(json.dumps({"optimized": len(results), "humanCheck": [result["constellationId"] for result in results if result["needsHumanCheck"]], "backup": str(BACKUP_PATH.relative_to(ROOT)), "review": str(REVIEW_PATH.relative_to(ROOT))}, ensure_ascii=False))


if __name__ == "__main__":
    main()
