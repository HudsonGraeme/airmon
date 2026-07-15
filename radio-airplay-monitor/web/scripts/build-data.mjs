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
const spins = loadSpins();

// --- aggregates ---
const perStation = {};
const artistCounts = new Map(); // norm -> { display, spins }
let minAt = Infinity;
let maxAt = 0;

for (const sp of spins) {
  perStation[sp.s] = (perStation[sp.s] || 0) + 1;
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

const meta = {
  generatedAt: new Date().toISOString(),
  totalSpins: spins.length,
  stationCount: stations.length,
  artistCount: artistCounts.size,
  dateRange: spins.length ? [minAt, maxAt] : null,
  perStation: stations.map((s) => ({ id: s.id, name: s.name, spins: perStation[s.id] || 0 })),
  topArtists,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "spins.json"), JSON.stringify(spins));
writeFileSync(join(OUT, "stations.json"), JSON.stringify(stations));
writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta));

console.log(
  `build-data: ${spins.length} spins, ${stations.length} stations -> web/public/data/`
);
