# Constellation Art Direction

This document is the visual source of truth for AI-generated constellation artwork.
Read it before generating or replacing any constellation image.

## Reference Inputs

- `tmp/constellation-captures/<Constellation>.png` is the authoritative reference for each constellation's star positions and line connections.
- The approved Andromeda variation 3 is the authoritative reference for the illustration style.

## Required Look

- Use a deep blue-black night-sky background.
- Render stars as luminous blue points and the constellation connections as thin, soft blue lines.
- Use a symbolic, simplified, dreamlike celestial illustration that follows the Andromeda variation 3 style.
- Keep the motif calm and restrained, with an abstract blue-outline treatment rather than a detailed painting.
- Depict the constellation's traditional motif only as far as it supports the constellation skeleton.

## Confirmed Outline Style

The current approved direction is a **flat, transparent celestial glyph**. Use this as the default style for future constellation-art generation unless a human explicitly changes it.

- Draw the motif primarily with a single thin cyan-blue outer contour and only the few structural lines needed to recognize it.
- Keep the interior completely transparent. The blue-black sky must show through every part of the motif so stars and constellation connections are never obscured.
- Keep line weight close to uniform. Use only a restrained glow on the actual constellation stars; do not give the illustration a glowing volume.
- Treat the motif as a simple star-chart symbol, not as an illustration of a realistic person, animal, object, or a solid silhouette.
- Simplify faces, hands, paws, fur, feathers, scales, clothing, and decorative elements into the outer contour or omit them entirely.
- For animals, use the smallest useful set of contours: outer body, legs or tail if needed, and a simple recognisable feature. For Leo specifically, the mane is only a flat jagged outer edge, never internal hair strands.
- For small constellations, do not invent extra stars to support the motif. Build the simplified outline around the available star skeleton.

### Never Use

- Solid, opaque, translucent, or gradient fills inside the motif.
- Shading, shadow, texture, lighting effects, depth, or 3D rendering.
- Anatomical detail, fur/hair strands, facial features, claws, eyes, or realistic material rendering.
- A fully filled silhouette that hides or competes with the constellation stars and lines.

## Required Geometry

- Preserve the reference capture's star positions and blue-line connections closely.
- The motif, stars, and connecting lines must share the same skeleton and align as one composition.
- Do not add unrelated stars, celestial bodies, or composition elements that change the reference geometry.

## Prohibited Look

- Do not use photorealistic or highly realistic depictions of animals, people, or objects.
- Do not use detailed anatomical, painterly, or dense illustrative rendering.
- Do not use orange, yellow, or white stars.
- Do not add text, constellation labels, borders, or watermarks.

## With-Line and No-Line Asset Pair

- Create the with-line image first. It includes the motif, blue stars, and thin blue constellation lines.
- Create the no-line image from the completed with-line image by removing only the stars and constellation lines.
- The background, motif, framing, and composition must remain identical between the pair. Any other visual difference is a defect.
- Use `tmp/constellation-captures/<Constellation>.png` as the first reference when deciding each image's skeleton. Generate the with-line image from that star-and-line geometry before deriving its no-line pair.
- Only the no-line asset is used in the application. The with-line asset is the geometry reference and review source.

## Output Location

- With-line assets: `public/with_line/<Japanese constellation name>_線あり.png`
- No-line assets: `public/no-line/<Japanese constellation name>_線無し.png`

## Progress and Review

- After completing each constellation pair, update the Phase 13 progress summary with the completed constellation names and the remaining count.
- Keep a single HTML review page that presents every generated with-line and no-line pair side by side, so their matching composition and line removal can be reviewed quickly.
