# Anime Studio App — canvas growing/elongating fixed

## What was wrong, precisely

The canvas box was set to "fill whatever space is left" (`flex: 1`)
rather than a fixed size. Combined with the `ResizeObserver` added in the
last fix, touching the canvas could trigger a loop: the observer detects
a size change, resizes the canvas, which very slightly changes the
available layout space, which the observer detects again — visually,
this showed up as the white workspace slowly growing/elongating downward
the more you touched it.

## The fix

The canvas area now has a fixed height (`55vh` — just over half the
screen) instead of "fill remaining space." With nothing left to
recalculate, the loop can't happen — the canvas sizes once, correctly,
and stays that size.

Only `components/StudioPanel.js` and `components/VectorPanel.js`
changed (the same two files as last time — this is a refinement of that
same fix, not a new bug). No new dependencies, no new environment
variables.

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

Expect only `components/StudioPanel.js` and `components/VectorPanel.js`
listed as modified. If that's right:

```
git add .
git commit -m "Fix canvas elongating bug with a fixed height"
git push origin main
```

## Confirm the deploy actually updates

Go to Vercel → Deployments and check the top entry's commit message
matches what you just pushed, before testing.

## Test it, precisely

1. Open Vector (or Draw)
2. Tap around on the canvas repeatedly, the way you were before
3. Watch the white canvas box itself — it should stay the exact same
   size the whole time, not grow or shift
4. Also confirm the page overall still doesn't scroll/drift (the
   previous fix)

## What's next

- Freehand-to-shape recognition (optional, hardest remaining piece)
- An animation timeline (draw multiple frames, play back as a short
  video) — the free path toward actual anime-style shorts
- A canvas scrollbar (mentioned, deferred for later)
- Custom color palette brought to the Vector tab too (currently Draw-only)
