# Anime Studio App — Analyzer + Studio + Library

## What's new in this update: the brush engine

This directly addresses "make a drawing feel more human" — four real,
free techniques, no stylus required:

1. **Stroke smoothing** — lines are now drawn as smooth curves between
   points instead of straight jagged segments, so finger-drawn strokes
   look cleaner and more deliberate.
2. **Velocity-based taper** — draw fast and the line thins out; draw
   slow and it thickens, just like a real pen responds to hand speed.
   This is the same trick that makes a line "feel" hand-drawn even
   without pressure-sensitive hardware.
3. **Opacity slider** — build up color gradually with light strokes,
   like real ink or marker, instead of one flat opaque layer every time.
4. **Soft edge toggle** — blurs the brush edge slightly for an airbrush/
   soft-pencil feel instead of a hard vector-like line.
5. **Blend colors toggle** — uses a "multiply" blend so overlapping
   strokes mix and darken naturally, closer to how real pigment
   layers, instead of the new stroke just covering up the old one.

**Real, honest limitation:** actual pressure sensitivity (thin on light
touch, thick on hard press) only works with a real stylus — a finger on
glass reports no pressure data at all, on any app, not just this one. The
velocity-taper trick above is the finger-friendly substitute, and it gets
you a real hand-drawn feel without needing a stylus.

No new dependencies, no new environment variables — just `pages/studio.js`
changed.

## Push instructions (same safe method as always)

```
cd ~
rm -rf tmp-push
git clone https://github.com/MFM-codex/Anime-studio-app.git tmp-push
cd tmp-push
```

Check the real path of your latest extracted zip:
```
ls ~/storage/shared/
```

Copy each item individually (swap in the real folder name):
```
cp -r ~/storage/shared/<your-folder>/pages ./
cp -r ~/storage/shared/<your-folder>/lib ./
cp ~/storage/shared/<your-folder>/package.json ./
cp ~/storage/shared/<your-folder>/next.config.js ./
cp ~/storage/shared/<your-folder>/.gitignore ./
cp ~/storage/shared/<your-folder>/.env.example ./
cp ~/storage/shared/<your-folder>/README.md ./
```

Check before committing:
```
git status
```

Expect only `pages/studio.js` listed as modified.

```
git add .
git commit -m "Add brush engine: smoothing, taper, opacity, soft edge, blend"
git push origin main
```

## Vercel — confirm the deploy actually updates

After pushing, go straight to Deployments and check the top entry's commit
message matches what you just pushed. If it shows an older commit,
manually Redeploy the correct one, or reimport the project fresh if that
doesn't work (Settings → Delete Project → vercel.com/new) — this has been
the recurring issue today.

## Test it

1. Open `/studio`
2. Draw a slow, deliberate stroke, then a fast flick — notice the line
   gets thinner on the fast one
3. Lower Opacity to ~30% and draw the same spot twice — colors should
   build up rather than instantly cover
4. Toggle "Soft edge" on — new strokes should look blurred/airbrushed
5. Toggle "Blend colors" on, draw one color over another — they should
   mix/darken where they overlap, rather than one flatly covering the other

## What's next

- A dedicated color palette panel with custom, saveable swatches
- Vector shape tools (circles, rectangles, polygons) — a bigger phase
  requiring a new engine (Fabric.js), done separately when ready
- An animation timeline (draw multiple frames, play back as a short
  video) — the free path toward actual anime-style shorts
