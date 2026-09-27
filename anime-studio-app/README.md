# Anime Studio App — Technique Analyzer + Studio

Two working features, both free:

1. **Technique Analyzer** (`/`) — upload an image, get a breakdown of the
   technique via `gemini-3.6-flash` (free tier).
2. **Studio** (`/studio`) — a drawing canvas. Pick a color, adjust brush
   size, draw with your finger, erase, save your drawing as a PNG. No AI,
   no API calls, no cost at all — just a plain HTML canvas.

## What's new in this update

- `pages/studio.js` — the new drawing canvas page
- A nav link added to the Analyzer page pointing to it

Nothing about the Analyzer changed.

## IMPORTANT — how to push this without repeating today's folder mess

Given everything that went wrong today, do this exact sequence. It avoids
every failure mode we hit (nested folders, nested-nested folders, nothing
actually copying):

```
cd ~
rm -rf tmp-push
git clone https://github.com/MFM-codex/Anime-studio-app.git tmp-push
cd tmp-push
```

Now check what's actually in your extracted zip folder first:

```
ls ~/storage/shared/anime-studio-app/
```

You should see: `pages`, `package.json`, `next.config.js`, `.gitignore`,
`.env.example`, `README.md` listed directly (not nested inside another
folder of the same name). If you see a folder with the same name inside
it, that means your file manager double-nested it on extract — go one
level deeper with the `ls` command until you find the real files, and use
that full path below instead.

Once you've confirmed the real path, copy each item individually — do NOT
use `cp -r wholefolder ./` or the `/.` trick, both caused problems today:

```
cp -r ~/storage/shared/anime-studio-app/pages ./
cp ~/storage/shared/anime-studio-app/package.json ./
cp ~/storage/shared/anime-studio-app/next.config.js ./
cp ~/storage/shared/anime-studio-app/.gitignore ./
cp ~/storage/shared/anime-studio-app/.env.example ./
cp ~/storage/shared/anime-studio-app/README.md ./
```

Then check what git actually sees before committing — this catches any
mistake before it gets pushed:

```
git status
```

You should see modified/new files like `pages/studio.js`, and nothing
like `anime-studio-app-gallery/` or any nested folder name. If you see a
nested folder name in that list, stop and don't commit — something's
still wrong with the copy step above.

If `git status` looks right:

```
git add .
git commit -m "Add drawing studio"
git push origin main
```

## Step 2 — Test it

Open your live URL, tap **"Open Studio →"**, and try drawing with your
finger. Try changing colors, brush size, the eraser, and Save.

## Important reminder (from earlier today)

Vercel's **Root Directory** setting must stay blank/empty (Settings →
Build and Deployment). If pages ever seem to deploy successfully but don't
show up live, check this setting first.

## What's next

- Layers and an actual animation timeline (bigger undertaking, later)
- Character library with Supabase, once there's something worth saving
  again
