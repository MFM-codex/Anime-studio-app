# Anime Studio App — Analyzer + Studio + Library

Three working features now:

1. **Technique Analyzer** (`/`) — upload an image, get a breakdown via Gemini.
2. **Studio** (`/studio`) — drawing canvas: brush, eraser, 8 colors, undo,
   save as PNG, or **Save to Library**.
3. **Library** (`/library`) — browse, search by name, view full-size, and
   delete your saved drawings. Backed by Supabase (free tier).

## What's new in this update

- `lib/supabaseClient.js` — shared Supabase connection
- `pages/library.js` — the new Library page
- Studio page: "Save to Library" button + name prompt
- `package.json` — added the `@supabase/supabase-js` dependency

## New environment variables needed in Vercel

In addition to `GEMINI_API_KEY` (already set), add these two:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase Publishable key

**Important:** these must be typed exactly as shown, including the
`NEXT_PUBLIC_` prefix — that's what tells Next.js it's safe to use in the
browser (this key is meant to be public; your database's row-level
security policies control what it's allowed to do, not secrecy of the key).

Add them the same way as before: Vercel → Settings → Environments →
Production → Add Environment Variable. Then redeploy.

## Push instructions (same safe method as before)

```
cd ~
rm -rf tmp-push
git clone https://github.com/MFM-codex/Anime-studio-app.git tmp-push
cd tmp-push
```

Check the real path first:
```
ls ~/storage/shared/
```

Then copy each item individually (adjust the folder name to match what
`ls` showed you):
```
cp -r ~/storage/shared/<your-extracted-folder>/pages ./
cp -r ~/storage/shared/<your-extracted-folder>/lib ./
cp ~/storage/shared/<your-extracted-folder>/package.json ./
cp ~/storage/shared/<your-extracted-folder>/next.config.js ./
cp ~/storage/shared/<your-extracted-folder>/.gitignore ./
cp ~/storage/shared/<your-extracted-folder>/.env.example ./
cp ~/storage/shared/<your-extracted-folder>/README.md ./
```

Check before committing:
```
git status
```

You should see `lib/supabaseClient.js` and `pages/library.js` as new
files, plus `pages/studio.js` and `package.json` modified. Nothing else.

Then:
```
git add .
git commit -m "Add Supabase library feature"
git push origin main
```

## Test it

1. Add the two new environment variables in Vercel and redeploy
2. Open `/studio`, draw something, tap "Save to Library," give it a name
3. Open `/library` — your drawing should appear
4. Try searching by name, tapping to view full-size, and deleting one

## What's next

- Layers and an animation timeline (bigger undertaking)
- Linking characters analyzed in the Technique Analyzer to library entries
