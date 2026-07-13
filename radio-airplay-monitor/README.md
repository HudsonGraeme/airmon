# airmon — open Canadian radio airplay monitor

An open, **CC0** dataset of Canadian radio **airplay facts** — *what track played,
when, on which station* — collected from broadcasters' own public now-playing
endpoints, stored in-repo (git-as-database), and surfaced through a Cloudflare
Pages frontend with instant client-side search.

Deliberately **multi-broadcaster and multi-artist**: a general public resource,
not a dossier on one target. Any sharper question ("is artist X over-rotated?") is
*one query on top of the open data* — clearly labelled as interpretation, see
[`METHODOLOGY.md`](METHODOLOGY.md).

> **Facts, not audio.** airmon reads the short "now playing" text metadata
> stations already publish. It does **not** record, store, or redistribute audio.
> Playlist facts aren't copyrightable; audio is. Keep it that way.

## Architecture

```
GitHub Actions cron (every 10 min)
   └─ Go collector ─► fetch each station's public now-playing endpoint
                      └─ append new spins to data/spins/YYYY-MM.ndjson
                         └─ git commit + push   ← the database is the repo

Cloudflare Pages (on push)
   └─ pnpm build ─► build-data.mjs consolidates NDJSON → static JSON
                    └─ Vite + React + Chakra app, Orama in-browser search
```

No servers, no database to run, no audio. Two moving parts: a Go binary in CI and
a static site.

| Component | Stack |
|---|---|
| Collector | **Go** (stdlib only), run by **GitHub Actions** cron |
| Store | **git** — month-partitioned NDJSON under `data/spins/` |
| Frontend | **TypeScript + React + Chakra UI**, built with **Vite** + **pnpm** |
| Search | **Orama** full-text index, built in the browser from the committed data |
| Hosting | **Cloudflare Pages** |

### Station adapters (both public, unauthenticated)

| Adapter | Broadcaster | Data | Notes |
|---|---|---|---|
| `triton` | Bell Media / iHeartRadio Canada | timestamped recent history | catches every spin between polls |
| `streamb` | Evanov Communications | current track only | history built from state changes |

Default stations (`data/stations.json`): CHUM 104.5, Virgin 99.9 Toronto, Virgin
95.9 Montreal, CHOM 97.7, The Beat 94.5 Vancouver, Evanov Z103.5.

## Collector (Go)

```bash
cd collector
go run . -data ../data      # one polling pass; appends new spins + updates state
```

Idempotent: a per-station cursor in `data/state.json` means overlapping runs never
double-count. Runs automatically via [`.github/workflows/collect-airplay.yml`](../.github/workflows/collect-airplay.yml).

> GitHub only fires `schedule` from the **default branch**, so the cron starts
> once this is merged to `master`. Use the workflow's **Run workflow** button to
> test it from a branch.

## Frontend (Cloudflare Pages)

```bash
cd web
pnpm install
pnpm dev       # local dev (regenerates data first)
pnpm build     # → web/dist  (runs build-data.mjs, tsc, vite)
```

**Cloudflare Pages settings:**

| Setting | Value |
|---|---|
| Root directory | `radio-airplay-monitor/web` |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Package manager | pnpm (via `packageManager` / auto-detected) |

The build reads `../data` and emits `web/public/data/{spins,stations,meta}.json`;
the app fetches those and builds the Orama index client-side (fine to ~100k+
spins). For much larger logs, chunk the spin file or persist a prebuilt index.

## Adding a station

1. Find its public now-playing endpoint (many use Triton's
   `np.tritondigital.com/public/nowplaying?mountName=…`; others expose a small
   JSON/XML feed like Evanov's StreamB).
2. Reuse an adapter if the shape matches, or add a `fetchX` in
   `collector/adapters.go` and a `case` in `fetchStation`.
3. Add the station to `data/stations.json`.

## Analysis & responsibility

The rotation panel compares a focus artist against matched-era peers per station.
**Read [`METHODOLOGY.md`](METHODOLOGY.md) before quoting any number** — a high
index is *consistent with* mundane causes and does not prove coordination;
correlation with an external timeline is a question, not evidence; anything under
~a week of data, or that doesn't replicate across independent owners, is noise.

## Roadmap — audio fingerprinting

Metadata misses spins a station mislabels or omits (often the recurrent/catalog
rotation you'd care about). For **evidence-grade** monitoring, add a fingerprinting
collector that IDs songs from the live stream audio against a reference DB
([Olaf](https://github.com/JorenSix/Olaf) / [Panako](https://github.com/JorenSix/Panako)
/ [Dejavu](https://github.com/worldveil/dejavu), or ACRCloud). Fingerprint and
discard — never store or restream audio.

## Good-faith collection & legal

- Identifiable `User-Agent`; a 10-minute poll interval. Be polite; back off on
  errors; respect `robots.txt`.
- Publishing *what played when* is what existing aggregators already do; facts
  aren't copyrightable (Feist; CCH Canadian). Re-streaming **audio** is not — don't.
- The dataset takes no editorial position. Not legal advice; for adversarial
  publication, consult a media/IP lawyer (in Canada, CIPPIC/EFF).
