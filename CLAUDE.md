# CLAUDE.md — Sports Stream Finder

Personal, ad-free static site that lists upcoming Rugby and Cricket fixtures
and shows user-curated stream links per match.

## Stack

Vanilla HTML + CSS + ES modules. **No build step, no npm, no framework.**
The simplicity is the point — the owner edits this from an iPad via
`github.dev` in Safari, so don't introduce tooling without being asked.

## File map

| Path | Role |
|---|---|
| `index.html` | Landing UI — header, filter chips, fixtures list, sidebar. |
| `styles.css` | Dark theme, mobile-first, large tap targets. |
| `app.js` | Loads JSON + fixtures, renders, filters, snippet helper. |
| `fixtures.js` | Wraps TheSportsDB v1 endpoint (`eventsday.php`). |
| `streams.json` | **Owner-edited** list of `{sport, date, match, links[]}`. |
| `sources.json` | Always-on channels shown in the sidebar. |
| `archive/farm-delivery.html` | Old Floating Farm form, kept for reference. |
| `.github/workflows/pages.yml` | Auto-deploys to GitHub Pages on push. |

## Data sources

- **Fixtures:** TheSportsDB v1 free key `3` —
  `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=YYYY-MM-DD&s=Rugby`
  (and `s=Cricket`). CORS-enabled, no auth.
- **Stream links:** only from `streams.json` and `sources.json`.

## Hard rules

1. **Never auto-populate links to unauthorized rebroadcasts.** All links
   come from `streams.json` / `sources.json`, which the owner edits.
   Don't scrape Crackstreams-type sites or generate links to them.
2. **Don't add a build step or framework** unless explicitly asked. No
   bundlers, no React/Vue/Svelte. Plain ES modules only.
3. **Keep tap targets ≥ 40px** and avoid hover-only affordances — primary
   device is iPad Safari.
4. **No analytics, no third-party scripts.** Site stays ad-free and
   tracker-free.
5. **Edit only files listed above** unless adding genuinely new features.
   When adding a new top-level file, update this map.

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly via `file://` mostly works but `fetch()` for
`streams.json` / `sources.json` needs an HTTP origin in some browsers.

## Deploy

Push to `main` or `claude/sports-stream-finder-S9QTN`. The workflow at
`.github/workflows/pages.yml` builds and deploys to GitHub Pages. The
owner must enable Pages once: **repo Settings → Pages → Source: GitHub
Actions** (one-time click).

## Branch policy

- Feature branch for ongoing work: `claude/sports-stream-finder-S9QTN`.
- Merge to `main` to publish to the canonical Pages URL.

## iPad editing workflow

1. Open the repo on `github.com` in Safari.
2. Press `.` (or change `github.com` → `github.dev` in the URL) to launch
   web VS Code.
3. Edit `streams.json`, commit, push. Pages redeploys in ~1 minute.

## Adding a stream link

Append an entry to `streams.json`:

```json
{
  "sport": "Cricket",
  "date": "2026-05-04",
  "match": "England vs Australia",
  "links": [
    { "label": "Sky Sports", "url": "https://example.com/..." }
  ]
}
```

`match` is matched fuzzily against `strEvent` and `homeTeam vs awayTeam`
from TheSportsDB. The in-app "Show snippet" button on any unmatched
fixture generates a ready-to-paste entry.

## Common pitfalls

- TheSportsDB returns `events: null` (not `[]`) when nothing matches —
  `fixtures.js` already handles this.
- TheSportsDB times are UTC; `kickoff` is built as `dateEvent + strTime`.
  Display uses the user's local timezone.
- The free API key `3` is rate-limited; if fixtures stop loading,
  back off rather than hammering.
