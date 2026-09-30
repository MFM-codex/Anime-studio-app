# Anime Studio App — black canvas bug fixed

## What was wrong, precisely

Draw and Vector tabs start hidden (`display:none`) since the app opens on
Analyze by default. Both canvases were sizing themselves based on their
container's on-screen size **the moment they loaded** — but a hidden
container reports zero size, so both canvases got set to 0×0 and never
painted anything. What you saw as "black" was actually the dark app
background showing through an essentially blank, invisible canvas.

## The fix

Both `StudioPanel.js` and `VectorPanel.js` now use a `ResizeObserver`
instead of only listening for window resize — this correctly detects the
moment a tab's container goes from hidden to visible and gives the canvas
a real size right then, painting the white paper background fresh at
that point.

Only these two files changed. No new dependencies, no new environment
variables.

## Push instructions — one command at a time

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

Copy just the two changed files plus the usual support files (swap in
your real folder name):
```
cp -r ~/storage/shared/<your-folder>/components ./
```
```
cp ~/storage/shared/<your-folder>/README.md ./
```

Check before committing:
```
git status
```

Expect only `components/StudioPanel.js` and `components/VectorPanel.js`
listed as modified.

```
git add .
```
```
git commit -m "Fix black canvas bug on Draw and Vector tabs"
```
```
git push origin main
```

## Confirm the deploy actually updates

Go to Vercel → Deployments and check the top entry's commit message
matches what you just pushed, before testing.

## Test it

1. Open the app fresh (lands on Analyze)
2. Tap **Draw** — canvas should now show white paper immediately, ready
   to draw on
3. Tap **Vector** — same, white canvas ready for nodes
4. Draw something in Draw, switch tabs away and back — it should still
   be there (this part already worked, just confirming it still does
   after the fix)

## What's next

- Freehand-to-shape recognition (optional, hardest remaining piece)
- An animation timeline (draw multiple frames, play back as a short
  video) — the free path toward actual anime-style shorts
- A canvas scrollbar (mentioned, deferred for later)
- Custom color palette brought to the Vector tab too (currently Draw-only)
