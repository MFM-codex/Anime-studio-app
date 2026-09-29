# Anime Studio App — one unified interface

## What changed: everything merged into one real interface

This is the biggest structural change yet, precisely: the four separate
pages (`/`, `/studio`, `/vector`, `/library`) are gone. There is now just
**one page**, with a tab bar at the top — Analyze / Draw / Vector /
Library — switching between tools instantly, no page loads.

**The important technical detail:** all four tools stay mounted at all
times. Switching tabs only hides/shows them with CSS — it does not reset
them. That means: start a drawing in Draw, switch to Library to check a
reference, switch back — your drawing is still exactly there, mid-stroke.
Same for an in-progress Vector path, or an Analyzer result on screen.

**Bonus this enabled:** "Edit in Studio" from the Library no longer
navigates to a different page — it just switches the tab and hands the
image straight to the Draw panel, instantly.

Also, since everything now visually lives together, the Analyzer's old
plain light styling was updated to match the same ink-plum/coral/cyan/
gold theme as everything else — one consistent look throughout.

## What's technically different under the hood

- Old: `pages/index.js`, `pages/studio.js`, `pages/vector.js`,
  `pages/library.js` — four separate routes
- New: `pages/index.js` is now just the shell (header + tab bar +
  mounts all four panels). The actual tool logic moved into
  `components/AnalyzerPanel.js`, `components/StudioPanel.js`,
  `components/VectorPanel.js`, `components/LibraryPanel.js`

Nothing about how any individual tool *works* changed — same brush
engine, same vector node editing, same zoom, same Supabase saving. This
was a structural move, not a feature change.

No new dependencies, no new environment variables.

## Push instructions — read carefully, this one replaces whole files

Because pages were deleted and a new `components/` folder was added,
this push needs the deletions to actually go through, so **run these
one command at a time**, pressing Enter after each — do not paste them
as a block (that broke a push last time):

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

Now remove the old files that no longer exist in this version, then
copy in the new structure (swap in your real folder name):

```
rm -rf pages components
```

```
cp -r ~/storage/shared/<your-folder>/pages ./
```

```
cp -r ~/storage/shared/<your-folder>/components ./
```

```
cp ~/storage/shared/<your-folder>/package.json ./
```

```
cp ~/storage/shared/<your-folder>/next.config.js ./
```

```
cp ~/storage/shared/<your-folder>/.gitignore ./
```

```
cp ~/storage/shared/<your-folder>/.env.example ./
```

```
cp ~/storage/shared/<your-folder>/README.md ./
```

Check before committing — this is the most important step this time:
```
git status
```

Expect to see: `pages/studio.js`, `pages/vector.js`, `pages/library.js`
listed as **deleted**, `pages/index.js` as **modified**, and a whole new
`components/` folder listed as new files. If you don't see the old pages
marked as deleted, stop and check `ls pages/` — if `studio.js` etc. are
still sitting in that folder, the `rm -rf pages components` step didn't
run, or ran in the wrong folder.

```
git add .
```

```
git commit -m "Merge all tools into one unified interface"
```

```
git push origin main
```

## Confirm the deploy actually updates

Go to Vercel → Deployments and check the top entry's commit message
matches what you just pushed, before testing.

## Test it, precisely

1. Open the app — you should land on Analyze, with a tab bar up top
2. Tap **Draw**, draw something
3. Tap **Library** without saving first — your drawing should NOT
   disappear when you tap back to Draw
4. Tap **Vector**, drop a few nodes
5. Tap back to **Draw** — your earlier drawing should still be there,
   untouched
6. Save something to the Library from Draw, tap **Library**, tap
   **Refresh** if it doesn't show up immediately, then tap it and
   **Edit in Studio** — confirm it switches straight to Draw with the
   image loaded, no page reload

## What's next

- Freehand-to-shape recognition (optional, hardest remaining piece)
- An animation timeline (draw multiple frames, play back as a short
  video) — the free path toward actual anime-style shorts
- A canvas scrollbar (mentioned, deferred for later)
- Custom color palette brought to the Vector tab too (currently Draw-only)
