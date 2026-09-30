# Anime Studio App — scroll drift fixed

## What was wrong, precisely

The Vector tab (and any tab with enough stacked controls) is taller than
one phone screen, so the page was naturally scrollable. Combined with
your phone browser's address bar hiding/showing as you scrolled, the
layout reflowed slightly each time — which felt like the workspace was
drifting downward on its own.

## The fix

Locked the outer page (`html`, `body`) so it can never scroll or bounce.
The app's own content area (everything below the header) is now the one
and only scroll container, with `overflow-y: auto`. This keeps the
browser's address bar and viewport stable, so nothing shifts or drifts
during use — any tab with more content than fits just scrolls cleanly
inside itself now.

Only `pages/index.js` changed. No new dependencies, no new environment
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

```
cp ~/storage/shared/<your-folder>/pages/index.js ./pages/index.js
```
```
cp ~/storage/shared/<your-folder>/README.md ./
```

Check before committing:
```
git status
```

Expect only `pages/index.js` listed as modified.

```
git add .
```
```
git commit -m "Fix scroll drift by locking outer page scroll"
```
```
git push origin main
```

## Confirm the deploy actually updates

Go to Vercel → Deployments and check the top entry's commit message
matches what you just pushed, before testing.

## Test it

1. Open the app, go to Vector
2. Tap around to add a few nodes, use the controls below
3. Confirm the page no longer drifts or scrolls on its own
4. If the control area below the canvas doesn't all fit, it should
   scroll smoothly within itself now, without the whole page bouncing

## What's next

- Freehand-to-shape recognition (optional, hardest remaining piece)
- An animation timeline (draw multiple frames, play back as a short
  video) — the free path toward actual anime-style shorts
- A canvas scrollbar (mentioned, deferred for later)
- Custom color palette brought to the Vector tab too (currently Draw-only)
