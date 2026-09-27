# Anime Studio App — Analyzer + Studio + Vector + Library

<<<<<<< HEAD
## What's new: custom color palette (`/studio` only, for now)

Scoped precisely: added to the Studio brush canvas only. The Vector
editor's swatches are untouched — same scope discipline as before, one
page at a time.

- Tap the dashed **"+"** circle to open your phone's native color picker
  and add any color you want to your personal palette
- New colors appear as extra swatches alongside the original 8, and are
  saved **on this device** (browser local storage) — they'll still be
  there next time you open the app on this same phone/browser
- Tap **"Edit"** (appears once you've added at least one custom color) to
  reveal small **×** buttons for removing colors you don't want anymore;
  tap **"Done"** to exit edit mode

## Scope note, precisely

This is one growing palette shelf — add and remove custom colors — not
multiple separately-named, switchable palettes. If you want actual
named/swappable palette sets later, that's a bigger follow-up, not part
of this build.

Colors are saved per-device, not to Supabase — this is a personal
preference, not a shared asset like a drawing, so it didn't need the
database.

Only `pages/studio.js` changed. No new dependencies, no new environment
=======
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
>>>>>>> 07e2c43621de91a7145219ff179730c440a72914
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

<<<<<<< HEAD
**Important — run each git command one at a time, pressing Enter after
each, not pasted together as one block.** Pasting them together caused a
broken command last time and nothing actually got pushed.

=======
>>>>>>> 07e2c43621de91a7145219ff179730c440a72914
Check before committing:
```
git status
```

<<<<<<< HEAD
Expect only `pages/studio.js` listed as modified.

```
git add .
```

Then, separately:
```
git commit -m "Add custom color palette to Studio"
```

Then, separately:
```
=======
Expect only `pages/vector.js` listed as modified.

```
git add .
git commit -m "Add pinch-to-zoom and pan to Vector editor"
>>>>>>> 07e2c43621de91a7145219ff179730c440a72914
git push origin main
```

## Confirm the deploy actually updates

Go to Vercel → Deployments and check the top entry's commit message
matches what you just pushed, before testing.

## Test it

<<<<<<< HEAD
1. Open `/studio`
2. Tap the dashed "+" circle, pick any color
3. Confirm it appears as a new swatch and gets selected
4. Draw with it
5. Reload the page — the custom color should still be there
6. Tap "Edit," then the × on that swatch to remove it, then "Done"

## What's next

- Freehand-to-shape recognition (optional, hardest remaining piece)
- An animation timeline (draw multiple frames, play back as a short
  video) — the free path toward actual anime-style shorts
- Bringing this same custom palette to the Vector editor, if wanted
- A canvas scrollbar (mentioned, deferred for later)
=======
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
>>>>>>> 07e2c43621de91a7145219ff179730c440a72914
