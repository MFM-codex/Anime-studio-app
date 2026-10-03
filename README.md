# Anime Studio App — animations now save and reload

## What's new, precisely

This directly removes the limit I flagged last time: **"Save to
Library" now saves the whole animation**, not just the frame you're
currently viewing. Every frame is stored, in order. Loading it back via
**"Edit in Studio"** restores the entire filmstrip — not just one
image — so you can keep animating exactly where you left off, even
after closing the app.

A single-frame drawing still works exactly the same as before — it's
just an "animation" with one frame, so nothing about simple use changed.

Library thumbnails that have more than one frame now show a small
**"N frames"** badge in the corner, so you can tell animations apart
from plain drawings at a glance.

## Required: one small Supabase change first

Before pushing this code, add a new column to your `drawings` table —
this is what stores the extra frames.

1. Go to your Supabase project → **SQL Editor** → **New query**
2. Paste exactly this:

```sql
alter table drawings add column if not exists frames text;
```

3. Tap **Run**

That's it — no new policies needed, your existing read/insert policies
already cover the new column. This is a one-time, additive change: it
doesn't touch or remove anything already saved.

## What changed in code, precisely

- `components/StudioPanel.js` — Save to Library now stores the full
  frames array (as JSON) alongside a thumbnail image; loading from
  Library now restores the whole filmstrip when one exists
- `components/LibraryPanel.js` — fetches the new `frames` column,
  parses it, shows the frame-count badge, passes the full frame set
  through when you tap "Edit in Studio"
- `pages/index.js` — unchanged; it already forwarded whatever Library
  sent through, so no edit was needed there

No new dependencies, no new environment variables — just the one SQL
column addition above.

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

Expect `components/StudioPanel.js` and `components/LibraryPanel.js`
listed as modified.

```
git add .
git commit -m "Save and reload full animations, not just one frame"
git push origin main
```

## Confirm the deploy actually updates

Go to Vercel → Deployments and check the top entry's commit message
matches what you just pushed, before testing.

## Test it, precisely

1. **Run the SQL column addition first** (above) — if you skip this,
   saving will fail with a database error about an unknown column
2. In Draw, make a 2-3 frame animation
3. Save to Library, give it a name
4. Go to Library — confirm you see the **"3 frames"** badge (or
   however many you made) on its thumbnail
5. Tap it, tap **Edit in Studio**
6. Confirm all your frames are back in the filmstrip, in the right
   order, and Play still works on them

## What's next

- Exporting an animation as an actual downloadable video or GIF file
- Freehand-to-shape recognition (optional, hardest remaining piece)
- Custom color palette brought to the Vector tab too (currently Draw-only)
