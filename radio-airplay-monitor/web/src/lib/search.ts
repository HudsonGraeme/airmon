// A small in-memory search index over stations, artists, and songs. Built once
// from the loaded dataset; queried per keystroke with a plain substring match
// (the corpus is a few thousand rows, so this is sub-millisecond).
import type { Spin, Station } from "./data";
import { normArtist, songKey } from "./agg";

export type SearchKind = "station" | "artist" | "song";

export interface SearchResult {
  kind: SearchKind;
  id: string; // station id | artist key | song key — the detail-page target
  label: string; // display name
  sub: string; // secondary line (market/format, or the kind)
  spins: number;
  hay: string; // lowercased haystack for matching
}

export interface SearchIndex {
  stations: SearchResult[];
  artists: SearchResult[];
  songs: SearchResult[];
}

export interface SearchHits {
  stations: SearchResult[];
  artists: SearchResult[];
  songs: SearchResult[];
  total: number;
}

export function buildSearchIndex(spins: Spin[], stations: Station[]): SearchIndex {
  const stationSpins = new Map<string, number>();
  const artistMap = new Map<string, { display: string; spins: number }>();
  const songMap = new Map<string, { display: string; spins: number }>();
  for (const sp of spins) {
    stationSpins.set(sp.s, (stationSpins.get(sp.s) || 0) + 1);
    const ak = normArtist(sp.a);
    if (ak) {
      const a = artistMap.get(ak) || { display: sp.a, spins: 0 };
      a.spins++;
      artistMap.set(ak, a);
    }
    const sk = songKey(sp.a, sp.t);
    const s = songMap.get(sk) || { display: `${sp.a} — ${sp.t}`, spins: 0 };
    s.spins++;
    songMap.set(sk, s);
  }

  const stationRes: SearchResult[] = stations.map((st) => {
    const sub = `${st.market} · ${st.format}`;
    return {
      kind: "station",
      id: st.id,
      label: st.name,
      sub,
      spins: stationSpins.get(st.id) || 0,
      hay: `${st.name} ${st.short ?? ""} ${sub} ${st.owner}`.toLowerCase(),
    };
  });
  const artistRes: SearchResult[] = [...artistMap.entries()].map(([key, v]) => ({
    kind: "artist",
    id: key,
    label: v.display,
    sub: "Artist",
    spins: v.spins,
    hay: v.display.toLowerCase(),
  }));
  const songRes: SearchResult[] = [...songMap.entries()].map(([key, v]) => ({
    kind: "song",
    id: key,
    label: v.display,
    sub: "Song",
    spins: v.spins,
    hay: v.display.toLowerCase(),
  }));

  return { stations: stationRes, artists: artistRes, songs: songRes };
}

function match(arr: SearchResult[], term: string, limit: number): SearchResult[] {
  const out: SearchResult[] = [];
  for (const r of arr) if (r.hay.includes(term)) out.push(r);
  out.sort((a, b) => b.spins - a.spins);
  return out.slice(0, limit);
}

export function queryIndex(idx: SearchIndex, q: string, limitEach = 6): SearchHits {
  const term = q.trim().toLowerCase();
  if (!term) return { stations: [], artists: [], songs: [], total: 0 };
  const stations = match(idx.stations, term, limitEach);
  const artists = match(idx.artists, term, limitEach);
  const songs = match(idx.songs, term, limitEach);
  return { stations, artists, songs, total: stations.length + artists.length + songs.length };
}

// Flatten hits into one ordered list (stations, then artists, then songs) for
// keyboard navigation of the dropdown.
export function flattenHits(h: SearchHits): SearchResult[] {
  return [...h.stations, ...h.artists, ...h.songs];
}
