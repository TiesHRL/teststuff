// Thin wrapper around TheSportsDB v1 free endpoints. The "3" key is the
// public free tier — no signup. CORS is enabled by the API.
//
// Endpoint we use:
//   https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=YYYY-MM-DD&s=Rugby
//
// Response shape: { events: [ { idEvent, strEvent, strLeague, dateEvent,
// strTime, strHomeTeam, strAwayTeam, strVenue, strSport, ... } ] | null }

const BASE = "https://www.thesportsdb.com/api/v1/json/3/eventsday.php";

function ymd(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysAhead(n) {
  const out = [];
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    out.push(d);
  }
  return out;
}

async function fetchOne(date, sport) {
  const url = `${BASE}?d=${ymd(date)}&s=${encodeURIComponent(sport)}`;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.events) ? json.events : [];
  } catch (err) {
    console.warn("fixtures fetch failed", url, err);
    return [];
  }
}

export async function fetchFixtures({ sports, days }) {
  const dates = daysAhead(days);
  const tasks = [];
  for (const date of dates) {
    for (const sport of sports) {
      tasks.push(fetchOne(date, sport));
    }
  }
  const results = await Promise.all(tasks);
  return results
    .flat()
    .map(normalize)
    .filter(Boolean)
    .sort((a, b) => a.kickoff - b.kickoff);
}

function normalize(ev) {
  if (!ev || !ev.dateEvent) return null;
  const time = ev.strTime && ev.strTime !== "00:00:00" ? ev.strTime : "00:00:00";
  const kickoff = new Date(`${ev.dateEvent}T${time}Z`);
  const sport = (ev.strSport || "").toLowerCase().includes("cricket")
    ? "Cricket"
    : "Rugby";
  return {
    id: ev.idEvent,
    sport,
    league: ev.strLeague || "",
    title: ev.strEvent || `${ev.strHomeTeam} vs ${ev.strAwayTeam}`,
    homeTeam: ev.strHomeTeam || "",
    awayTeam: ev.strAwayTeam || "",
    venue: ev.strVenue || "",
    dateISO: ev.dateEvent,
    kickoff,
  };
}
