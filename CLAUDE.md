# Ebiki — project notes for Claude

Ebiki is a local-first AI flashcard/study app (React + Vite). Mascot: **Ebi**, a red shrimp.
Brand color = **#DF2540** (sampled from Ebi), theme = **Ocean Light**, fonts = Baloo 2 (display) + Nunito (body).

## Design system (use these — don't hardcode colors)
- `src/config/tokens.js` — `C` (colors), `FONT`, `RADIUS`, `SHADOW`. Single source of truth.
- `src/styles/theme.js` — the `S.*` style objects, built from tokens. Most chrome imports `S`.
- Global CSS/keyframes live in the `<style>` block inside `src/App.jsx`.
- Primary CTAs get the className `btn-press` for the Duolingo-style press; tabs use `ui-tab`.

## Ebi the mascot
- 34 pose PNGs in `public/assets/shrimp/`, registered in `src/config/shrimp.js` (`SHRIMP` array).
- The floating button (`src/components/HelpChat.jsx`) shows Ebi; pose changes with context.
- Two ways a pose is chosen:
  1. **AI-chosen** — AI replies append `<pose>NAME</pose>` (names from `POSE_NAMES`); parsed and
     stripped in `applyPose()` (App.jsx) and HelpChat's `sendMessage`. Best accuracy.
  2. **Keyword fallback** — `pickShrimp(text)` for non-AI moments (study question shown, picture word).

## ⭐ HOW TO ADD A NEW EBI EMOTE (do this whenever the user drops new shrimp PNGs)
The user will add new pose PNG(s). To wire each one so the app + AI actually use it:

1. **Place the file** in `public/assets/shrimp/` (keep the given filename, e.g. `12345-ninjashrimp.png`).
2. **Register it** in `src/config/shrimp.js` → add one entry to the `SHRIMP` array:
   ```js
   { name: 'ninja', file: '12345-ninjashrimp.png',
     keywords: ['ninja', 'stealth', 'shuriken', 'assassin', 'martial arts', 'sneak'] },
   ```
   - `name` = the short AI-facing label (lowercase, unique). It is auto-added to `POSE_NAMES`,
     so the AI immediately learns it can pick `<pose>ninja</pose>` — no prompt edits needed.
   - `keywords` = words/phrases that should trigger it via the instant keyword fallback. Include
     synonyms and a few Spanish terms. Think about *when* this pose should appear and cover those words.
3. **That's it** — `POSE_NAMES`, the name→file lookup (`poseFile`), and the AI prompt instruction all
   derive from `SHRIMP`, so no other code changes are required.
4. If two poses overlap (e.g. two "weapon" shrimp), give them distinct `name`s and split keywords so
   each has a clear niche; ties are broken deterministically by a text hash.
5. After adding, optionally sanity-check with: `node -e` importing `pickShrimp` from `src/config/shrimp.js`
   on a sample sentence, or just build (`npx vite build`).

Keep this list curated: every entry should have a clear, non-overlapping purpose so Ebi's reactions
feel intentional.

## Commits
- The user prefers **no Claude attribution** in commit messages.
- Don't commit to `master` directly unless asked; feature branches otherwise.
