# Anime Studio App — animation timeline (Draw tab)

## What's new, precisely

A frame filmstrip now sits below the canvas in Draw:

- **+ Frame** — adds a new blank frame right after the current one and
  switches to it
- **Duplicate** — copies the current frame as a new one (useful for
  small incremental changes between frames, the normal flipbook workflow)
- **Tap a thumbnail** — switches to editing that frame (saves your
  current frame first, automatically)
- **← / →** under each thumbnail — reorders frames
- **×** on a thumbnail — deletes that frame (always keeps at least one)
- **▶ Play (N)** button — opens a looping preview of all frames in
  order, with a speed slider (1–24 fps)

## Honest scope limits, precisely

- **Frames only live in this browser session's memory.** They are not
  saved to Supabase/Library yet — refreshing the page loses them. Saving
  a full animation project is a real follow-up feature, not included here.
- **No video/GIF export.** Play is an in-app preview only; there's no
  "download as video" button yet. That would need a GIF/video-encoding
  library (a new dependency) and is its own separate step.
- **Undo resets when you switch frames.** Each frame gets a fresh undo
  history — undo doesn't carry across frames. This is a reasonable
  simplification, not a bug.
- **Save to Library still saves only the single current frame** as a
  still image, same as before — it doesn't know about the animation
  concept yet.

Only `components/StudioPanel.js` changed. No new dependencies, no new
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

Expect only `components/StudioPanel.js` listed as modified.

```
git add .
git commit -m "Add animation timeline to Draw tab"
git push origin main
```

## Confirm the deploy actually updates

Go to Vercel → Deployments and check the top entry's commit message
matches what you just pushed, before testing.

## Test it, precisely

1. Open Draw, draw something on frame 1
2. Tap **+ Frame** — canvas should go blank (frame 2), with frame 1's
   thumbnail showing what you drew
3. Draw something different on frame 2
4. Tap frame 1's thumbnail — your original drawing should come back
   exactly as you left it
5. Add a third frame, then use **←** to move it before frame 2 — check
   the thumbnail order updates
6. Tap **▶ Play** — confirm it loops through your frames; try the speed
   slider
7. Delete a frame with **×** — confirm it can't go below 1 frame total

## What's next

- Saving a full animation (all frames) to the Library, not just one
  still — needs a Supabase schema change
- Exporting the animation as an actual downloadable video or GIF file
- Freehand-to-shape recognition (optional, hardest remaining piece)
- Custom color palette brought to the Vector tab too (currently Draw-only)
