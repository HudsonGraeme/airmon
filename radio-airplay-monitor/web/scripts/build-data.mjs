// Consolidates the git-stored NDJSON spin log (../data) into static JSON the
// frontend loads: spins.json (for Orama search + table), stations.json, and
// meta.json (aggregate airplay stats).
//
// No dependencies — plain Node ESM. Runs as a pre-build step (see package.json).

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "..", "data");
const OUT = join(__dirname, "..", "public", "data");

// --- conservative artist normalization (mirrors the Go collector's key rule) ---
function normArtist(s) {
  s = (s || "").split(" / ")[0];
  // strip a featured-artist tail. The separator MUST be preceded by whitespace
  // so we don't clip the "x" inside names like "Alex" or "Maxwell".
  s = s.replace(/\s+[([]?(feat\.?|ft\.?|featuring|with|&|x|vs\.?)\s+.*$/i, "");
  s = s.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  if (s.startsWith("the ")) s = s.slice(4);
  return s;
}
function loadStations() {
  const p = join(DATA, "stations.json");
  if (!existsSync(p)) return { stations: [] };
  return JSON.parse(readFileSync(p, "utf8"));
}

function loadHealth() {
  const p = join(DATA, "health.json");
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

function loadSpins() {
  const dir = join(DATA, "spins");
  if (!existsSync(dir)) return [];
  const spins = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".ndjson")).sort()) {
    for (const line of readFileSync(join(dir, f), "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        spins.push(JSON.parse(line));
      } catch {
        /* skip malformed line */
      }
    }
  }
  spins.sort((a, b) => a.at - b.at);
  return spins;
}

const cfg = loadStations();
const stations = cfg.stations || [];
const health = loadHealth();
const spins = loadSpins();

// --- aggregates ---
const perStation = {};
const lastSpinAt = {};
const artistCounts = new Map(); // norm -> { display, spins }
let minAt = Infinity;
let maxAt = 0;

for (const sp of spins) {
  perStation[sp.s] = (perStation[sp.s] || 0) + 1;
  if (sp.at > (lastSpinAt[sp.s] || 0)) lastSpinAt[sp.s] = sp.at;
  const key = normArtist(sp.a);
  const cur = artistCounts.get(key) || { display: sp.a, spins: 0 };
  cur.spins++;
  artistCounts.set(key, cur);
  if (sp.at < minAt) minAt = sp.at;
  if (sp.at > maxAt) maxAt = sp.at;
}

const topArtists = [...artistCounts.entries()]
  .map(([norm, v]) => ({ norm, artist: v.display, spins: v.spins }))
  .sort((a, b) => b.spins - a.spins)
  .slice(0, 40);

// --- per-station feed health ---
// Reference clock is the collector's most recent poll (health is baked at build
// time and can be hours old, so viewer-clock staleness would be misleading).
const ref = Math.max(0, ...Object.values(health).map((h) => h.last_poll_at || 0), maxAt);
const HOUR = 3600;
function feedStatus(h, spinsCount) {
  if (!h || !h.last_poll_at) return spinsCount > 0 ? "unknown" : "down";
  if ((h.consec_fails || 0) >= 2) return "down";
  if (h.last_ok_at && ref - h.last_ok_at > 3 * HOUR) return "down";
  if (h.last_ok_at && ref - h.last_ok_at <= 2 * HOUR) return "ok";
  return "stale";
}
const feeds = stations.map((s) => {
  const h = health[s.id] || {};
  return {
    id: s.id,
    name: s.name,
    market: s.market,
    adapter: s.adapter,
    spins: perStation[s.id] || 0,
    lastSpinAt: lastSpinAt[s.id] || h.last_spin_at || 0,
    lastOkAt: h.last_ok_at || 0,
    fails: h.consec_fails || 0,
    status: feedStatus(h, perStation[s.id] || 0),
  };
});

const meta = {
  generatedAt: new Date().toISOString(),
  totalSpins: spins.length,
  stationCount: stations.length,
  artistCount: artistCounts.size,
  dateRange: spins.length ? [minAt, maxAt] : null,
  healthRef: ref,
  perStation: stations.map((s) => ({ id: s.id, name: s.name, spins: perStation[s.id] || 0 })),
  feeds,
  topArtists,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "spins.json"), JSON.stringify(spins));
writeFileSync(join(OUT, "stations.json"), JSON.stringify(stations));
writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta));

console.log(
  `build-data: ${spins.length} spins, ${stations.length} stations -> web/public/data/`
);
