# Anime Studio App — Analyzer + Studio + Vector + Library

## What's new: zoom on the Vector editor (`/vector` only)

Scoped to just this one page, same as the rest of the app — Studio,
Analyzer, and Library are untouched.

- **Two-finger pinch** to zoom in/out
- **Two-finger drag** to pan around
- **One finger always edits nodes**, exactly as before — the two
  gestures don't conflict
- **+ / − buttons and a zoom % readout** in the bottom-right corner of
  the canvas, for precise control without relying on pinch
- **Reset button** snaps back to 100% zoom, centered
- **Mouse scroll wheel** also zooms, for anyone testing on a desktop
  browser

Zoom range is capped between 30% and 500%.

Only `pages/vector.js` changed. No new dependencies, no new environment
variables.

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

Copy each item individually:
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

Expect only `pages/vector.js` listed as modified.

```
git add .
git commit -m "Add pinch-to-zoom and pan to Vector editor"
git push origin main
```

## Confirm the deploy actually updates

Go to Vercel → Deployments and check the top entry's commit message
matches what you just pushed, before testing.

## Test it

1. Open `/vector`
2. Draw a small shape
3. Pinch with two fingers — the shape should zoom in/out smoothly,
   staying under your fingers as you pinch
4. Drag with two fingers — the canvas should pan
5. With one finger, confirm you can still add/move/edit nodes normally,
   even while zoomed in
6. Try the `+` / `−` buttons and Reset in the bottom-right corner

## What's next

- A dedicated, savable custom color palette panel
- Freehand-to-shape recognition (optional, hardest remaining piece)
- An animation timeline (draw multiple frames, play back as a short
  video) — the free path toward actual anime-style shorts
