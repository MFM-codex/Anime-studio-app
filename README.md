# Anime Studio App — canvas scrollbars (Vector tab only)

## What's new

Draggable scrollbar tracks along the bottom and right edge of the Vector
canvas — a visual indicator of where you are, and a way to pan by
dragging instead of only two-finger gestures.

**Precisely how it works:** since the Vector canvas is a free, unbounded
pan/zoom plane (no fixed document size), the scrollbar treats a fixed
area — 3× the size of your visible viewport, centered on the origin —
as the "scrollable content." The thumb's size reflects your current
zoom level (zoomed in = smaller thumb, more room to scroll); dragging it
pans the canvas directly.

Scoped to the Vector tab only, since that's the only tab with pan/zoom
right now. Studio/Draw doesn't have this yet.

Only `components/VectorPanel.js` changed. No new dependencies, no new
environment variables.

## Push instructions — one block, runs line by line

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

```
cp -r ~/storage/shared/<your-folder>/components ./
cp ~/storage/shared/<your-folder>/README.md ./
git status
```

Expect only `components/VectorPanel.js` listed as modified.

```
git add .
git commit -m "Add draggable scrollbars to Vector canvas"
git push origin main
```

## Confirm the deploy actually updates

Go to Vercel → Deployments and check the top entry's commit message
matches what you just pushed, before testing.

## Test it

1. Open Vector
2. Zoom in using the + button or pinch
3. You should see thin scrollbar tracks appear along the bottom and
   right edge of the canvas, with a thumb that's now smaller than the
   full track
4. Drag either thumb — the canvas should pan smoothly in that direction
5. Zoom back to 100% — thumbs should return to filling nearly the whole
   track (nothing to scroll)

## What's next

- Animation timeline (draw multiple frames, play back as a short video)
  — the big one, the actual free path toward your anime-shorts goal
- Freehand-to-shape recognition (optional, hardest remaining piece)
- Custom color palette brought to the Vector tab too (currently Draw-only)
- Same scrollbars could be added to Draw tab too, if it ever gets
  zoom/pan
