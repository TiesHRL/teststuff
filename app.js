import { fetchFixtures } from "./fixtures.js";

const SPORTS = ["Rugby", "Cricket"];

const state = {
  sport: "all",
  days: 7,
  query: "",
  fixtures: [],
  streams: [],
  sources: [],
};

const el = {
  fixtures: document.getElementById("fixtures"),
  sources: document.getElementById("sources"),
  search: document.getElementById("search"),
  snippetHelper: document.getElementById("snippet-helper"),
  snippet: document.getElementById("snippet"),
  copySnippet: document.getElementById("copy-snippet"),
  repoLink: document.getElementById("repo-link"),
};

init();

async function init() {
  wireFilters();
  wireSearch();
  wireSnippet();
  wireRepoLink();

  const [streams, sources, fixtures] = await Promise.all([
    loadJSON("streams.json", []),
    loadJSON("sources.json", []),
    fetchFixtures({ sports: SPORTS, days: 14 }),
  ]);

  state.streams = streams;
  state.sources = sources;
  state.fixtures = fixtures;

  renderSources();
  renderFixtures();
}

async function loadJSON(path, fallback) {
  try {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) return fallback;
    return await res.json();
  } catch (err) {
    console.warn("Could not load", path, err);
    return fallback;
  }
}

function wireFilters() {
  document.querySelectorAll(".chip[data-sport]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".chip[data-sport]")
        .forEach((b) => b.classList.toggle("is-active", b === btn));
      state.sport = btn.dataset.sport;
      renderFixtures();
    });
  });
  document.querySelectorAll(".chip[data-window]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".chip[data-window]")
        .forEach((b) => b.classList.toggle("is-active", b === btn));
      state.days = Number(btn.dataset.window);
      renderFixtures();
    });
  });
}

function wireSearch() {
  el.search.addEventListener("input", () => {
    state.query = el.search.value.trim().toLowerCase();
    renderFixtures();
  });
}

function wireSnippet() {
  el.copySnippet.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(el.snippet.textContent);
      el.copySnippet.textContent = "Copied";
      setTimeout(() => (el.copySnippet.textContent = "Copy"), 1500);
    } catch {
      // clipboard may be unavailable on http://; user can select manually
    }
  });
}

function wireRepoLink() {
  // Best-effort: when running on GitHub Pages, link to the source repo.
  const host = location.hostname;
  if (host.endsWith("github.io")) {
    const user = host.replace(".github.io", "");
    const repo = location.pathname.split("/").filter(Boolean)[0] || "";
    el.repoLink.href = repo
      ? `https://github.com/${user}/${repo}`
      : `https://github.com/${user}`;
  } else {
    el.repoLink.href = "https://github.com/";
  }
}

function renderSources() {
  if (!state.sources.length) {
    el.sources.innerHTML = `<li class="muted">No channels yet.</li>`;
    return;
  }
  el.sources.innerHTML = state.sources
    .map(
      (s) =>
        `<li><a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(
          s.label,
        )}</a><br><small class="muted">${escape(s.note || "")}</small></li>`,
    )
    .join("");
}

function renderFixtures() {
  el.fixtures.setAttribute("aria-busy", "false");
  const filtered = state.fixtures.filter(matchesFilters);

  if (!filtered.length) {
    el.fixtures.innerHTML = `<p class="status">No matches found in this window. Try widening the date range or clearing the search.</p>`;
    return;
  }

  const grouped = groupByDate(filtered);
  el.fixtures.innerHTML = grouped
    .map(
      ([dateLabel, matches]) => `
        <h3 class="day-heading">${escape(dateLabel)}</h3>
        ${matches.map(renderMatch).join("")}
      `,
    )
    .join("");

  el.fixtures.querySelectorAll("[data-add-snippet]").forEach((btn) => {
    btn.addEventListener("click", () => showSnippet(JSON.parse(btn.dataset.fixture)));
  });
}

function matchesFilters(fixture) {
  if (state.sport !== "all" && fixture.sport !== state.sport) return false;
  const horizon = new Date();
  horizon.setUTCHours(0, 0, 0, 0);
  horizon.setUTCDate(horizon.getUTCDate() + state.days);
  if (fixture.kickoff > horizon) return false;
  // Hide matches that are clearly in the past (kickoff > 4 hours ago)
  const tooOld = Date.now() - 4 * 60 * 60 * 1000;
  if (fixture.kickoff.getTime() < tooOld) return false;
  if (state.query) {
    const hay = `${fixture.title} ${fixture.league} ${fixture.homeTeam} ${fixture.awayTeam} ${fixture.venue}`.toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

function groupByDate(matches) {
  const map = new Map();
  for (const m of matches) {
    const key = m.dateISO;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  }
  return [...map.entries()].map(([key, list]) => [formatDay(key), list]);
}

function formatDay(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  const label = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  if (diff === 0) return `Today · ${label}`;
  if (diff === 1) return `Tomorrow · ${label}`;
  return label;
}

function renderMatch(f) {
  const links = matchingLinks(f);
  const time = f.kickoff.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const sportClass = f.sport.toLowerCase();
  const linksHtml = links.length
    ? `<div class="links">${links
        .map(
          (l) =>
            `<a class="link-btn" href="${escape(l.url)}" target="_blank" rel="noopener">${escape(
              l.label,
            )}<span class="arrow">↗</span></a>`,
        )
        .join("")}</div>`
    : `<div class="no-link">No link added yet. <button type="button" data-add-snippet data-fixture='${escape(
        JSON.stringify(snippetFor(f)),
      )}'>Show snippet</button></div>`;

  return `
    <article class="match">
      <div class="match-header">
        <h3 class="match-title">${escape(f.title)}</h3>
        <span class="sport-tag ${sportClass}">${escape(f.sport)}</span>
      </div>
      <div class="match-meta">
        <span>${escape(f.league)}</span>
        <span>${escape(time)}${f.venue ? " · " + escape(f.venue) : ""}</span>
      </div>
      ${linksHtml}
    </article>
  `;
}

function matchingLinks(fixture) {
  const out = [];
  for (const entry of state.streams) {
    if (entry.sport && entry.sport.toLowerCase() !== fixture.sport.toLowerCase())
      continue;
    if (entry.date && entry.date !== fixture.dateISO) continue;
    if (entry.match && !sameMatch(entry, fixture)) continue;
    if (Array.isArray(entry.links)) out.push(...entry.links);
  }
  return out;
}

function sameMatch(entry, fixture) {
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const target = norm(entry.match);
  const candidates = [
    fixture.title,
    `${fixture.homeTeam} vs ${fixture.awayTeam}`,
    `${fixture.homeTeam} ${fixture.awayTeam}`,
  ].map(norm);
  return candidates.some((c) => c.includes(target) || target.includes(c));
}

function snippetFor(fixture) {
  return {
    sport: fixture.sport,
    date: fixture.dateISO,
    match: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
    links: [{ label: "Where to watch", url: "https://example.com/replace-me" }],
  };
}

function showSnippet(entry) {
  const arrayForm = [entry];
  el.snippet.textContent = JSON.stringify(arrayForm, null, 2).slice(1, -1).trim();
  el.snippetHelper.hidden = false;
  el.snippetHelper.scrollIntoView({ behavior: "smooth", block: "center" });
}

function escape(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
