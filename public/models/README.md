# 3D model slot

No gaming-PC model is bundled: none has been obtained and license-verified yet, so the site shows the
built-in SVG case illustration.

To use a real model:

1. Get a `.glb` whose license allows commercial use on a website. Record the source, author, license
   and any required attribution in `ATTRIBUTION.md` in this folder BEFORE shipping it.
2. Prefer a compressed, optimized file (a few MB, Draco/meshopt + compressed textures).
3. Save it as `public/models/gaming-pc.glb` and set `NEXT_PUBLIC_PC_MODEL_URL=/models/gaming-pc.glb`
   in `.env.local`, then rebuild (`NEXT_PUBLIC_*` values are compiled in).

Behavior: the model loads lazily when the hero is near the viewport; until it is ready (or if the URL is
wrong, the script fails, or it takes more than 20 s) the illustration stays visible. The same model is
used for Standard and Pro; only lighting/accent color changes with the tier.
