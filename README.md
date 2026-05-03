# Sports Stream Finder

Personal, ad-free finder for **rugby and cricket** fixtures with your own
curated stream links. Static site, no tracking, runs anywhere — including
Safari on iPad.

## What it does

- Pulls upcoming Rugby and Cricket fixtures from TheSportsDB (free, public).
- Reads your own list of stream links from `streams.json`.
- Shows each fixture as a card with the right link buttons.
- Filters by sport, date window, and free-text search.
- Sidebar of always-on channels you maintain in `sources.json`.

The site never serves ads or trackers, and never embeds links to
unauthorized streams — only what you put in `streams.json`.

## Run it

### On any computer

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>.

### On iPad (zero-install)

Once GitHub Pages is enabled (see *Deploy* below), the site is just a URL:

```
https://<your-github-user>.github.io/teststuff/
```

Open it in Safari and tap **Share → Add to Home Screen** for an app-like
icon.

## Edit it from your iPad

1. Go to the repo on github.com in Safari.
2. Press `.` on the keyboard, or change the URL from `github.com/...` to
   `github.dev/...`. You'll get a full VS Code editor in the browser.
3. Edit `streams.json` (or any other file), use the Source Control tab to
   commit and push.
4. The GitHub Pages workflow redeploys in about a minute.

## Add a stream link

Append to `streams.json`:

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

- `sport` is `Rugby` or `Cricket`.
- `date` is `YYYY-MM-DD` (UTC, the same date as in the fixture card).
- `match` is matched fuzzily against the fixture title and team names.
- `links` is an array of `{ label, url }` — as many sources as you like.

If a fixture has no link yet, the card shows a **"Show snippet"** button
that builds the JSON for you.

## Deploy (one-time setup)

1. In GitHub, open this repo's **Settings → Pages**.
2. Under **Source**, select **GitHub Actions**.
3. Push to `main` or `claude/sports-stream-finder-S9QTN` — the workflow
   in `.github/workflows/pages.yml` will deploy automatically.

## Files

```
index.html      Sports finder UI
styles.css      Styling
app.js          Rendering + filters
fixtures.js     TheSportsDB API wrapper
streams.json    YOUR curated stream links
sources.json    Always-on channels
archive/        Old Floating Farm form, kept for reference
CLAUDE.md       Notes for Claude when working on this repo
```

## Notes

- **TheSportsDB** uses the free public key `3`. No signup required.
  Coverage of small leagues can be patchy; widen the date window if you
  see fewer fixtures than expected.
- The app is responsible only for what you put into `streams.json`. Keep
  the links to legitimate sources you trust — random aggregators tend to
  serve malware and are usually illegal in any case.
