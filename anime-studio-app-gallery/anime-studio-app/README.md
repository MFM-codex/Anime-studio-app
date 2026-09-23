# Anime Studio App — Technique Analyzer

Upload an image, get a breakdown of the technique — linework, color
palette, shading, composition — and steps to recreate it yourself. Genuinely
free to run: uses `gemini-3.6-flash`, which has a real free tier for text
analysis (unlike Gemini's image generation, which turned out to require
billing even at low volume — that feature has been removed).

## What's in this folder

- `pages/index.js` — the page you see: upload box, analyze button, chat-style result
- `pages/api/analyze.js` — backend code that sends your image to Gemini's API and returns the analysis
- `package.json` — the libraries the project needs (just Next.js/React)

## Setup (if starting fresh)

1. Get a free key at aistudio.google.com/apikey
2. Push this folder to your GitHub repo
3. On Vercel: import the repo, leave **Root Directory blank/empty** (this
   matters — see note below), add `GEMINI_API_KEY` as an environment
   variable, deploy

## Important: Root Directory must be empty

Vercel's "Root Directory" setting (Settings → Build and Deployment) must be
left **blank**, not set to `anime-studio-app` or any subfolder name. If it's
set to a folder name, Vercel builds from inside that folder instead of the
repo's actual top level, which causes new pages to silently not deploy even
when the build says "Ready." This caused a real bug before — worth
remembering if anything seems to deploy but not show up.

## Updating this in the future

```
cd path/to/extracted/anime-studio-app
git add .
git commit -m "your message here"
git push
```

Vercel should auto-redeploy within a minute or two.

## What's next

- Supabase to save each analysis (so you can revisit past ones)
- Then the actual drawing/studio canvas (fully free, no AI involved)
- AI image generation could come back later as a paid add-on if you decide
  the small per-image cost is worth it — nothing in this build blocks that
