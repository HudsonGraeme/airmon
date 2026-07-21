import { useEffect, useMemo } from "react";
import { Box, Flex, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import type { Dataset, Spin } from "../lib/data";
import {
  normArtist,
  rankArtists,
  rankSongs,
  songKey,
  totalTimeSeries,
} from "../lib/agg";
import { hrefFor } from "../lib/router";
import { useViz } from "../lib/viz";
import { SX } from "../lib/ui";
import { TimelineBars } from "./charts";
import { DataGrid } from "./DataGrid";

// --- shared chrome ----------------------------------------------------------

const eyebrow = {
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  fontSize: "11px",
  fontWeight: 600,
  color: SX.dim,
};

const fmtDate = (at: number) =>
  new Date(at * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

function timelineFmt(t: number, unit: "hour" | "day" | "week") {
  return unit === "hour"
    ? new Date(t * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit" })
    : new Date(t * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Crumb({ trail }: { trail: string }) {
  return (
    <Flex align="center" gap={2} mb={4} fontFamily={SX.mono} fontSize="12px" flexWrap="wrap">
      <Box as="a" href={hrefFor({ name: "home" })} color={SX.accent} _hover={{ textDecoration: "underline" }}>
        ← OVERVIEW
      </Box>
      <Text color={SX.faint}>/</Text>
      <Text color={SX.dim}>{trail}</Text>
    </Flex>
  );
}

function Hero({ tag, title, sub }: { tag: string; title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Box mb={5}>
      <Text {...eyebrow} color={SX.accent} mb={1}>
        {tag}
      </Text>
      <Text fontSize={{ base: "24px", md: "32px" }} fontWeight={700} color={SX.text} lineHeight="1.15">
        {title}
      </Text>
      {sub && (
        <Text mt={1} fontFamily={SX.mono} fontSize="13px" color={SX.dim}>
          {sub}
        </Text>
      )}
    </Box>
  );
}

function Tiles({ items }: { items: { label: string; value: string }[] }) {
  return (
    <SimpleGrid
      columns={{ base: 2, md: items.length > 4 ? 5 : items.length }}
      spacing="1px"
      bg={SX.line}
      borderWidth="1px"
      borderColor={SX.line}
      borderRadius="4px"
    >
      {items.map((it, i) => (
        <Box key={it.label} bg={SX.panel} px={{ base: 3, md: 4 }} py={3}>
          <Text textTransform="uppercase" letterSpacing="0.1em" fontSize="10px" color={SX.dim}>
            {it.label}
          </Text>
          <Text fontFamily={SX.mono} fontSize={{ base: "17px", md: "22px" }} fontWeight={600} color={i === 0 ? SX.accent : SX.text}>
            {it.value}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  );
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <Box bg={SX.panel} borderWidth="1px" borderColor={SX.line} borderRadius="4px" p={{ base: 3, md: 4 }} minW={0} overflow="hidden">
      <Flex align="baseline" gap={2} mb={3} flexWrap="wrap">
        <Text {...eyebrow} color={SX.text}>
          {title}
        </Text>
        {sub && (
          <Text fontFamily={SX.mono} fontSize="11px" color={SX.faint}>
            {sub}
          </Text>
        )}
      </Flex>
      {children}
    </Box>
  );
}

function Empty({ label = "NO DATA" }: { label?: string }) {
  return (
    <Flex h="160px" align="center" justify="center" color={SX.faint} fontFamily={SX.mono} fontSize="sm">
      {label}
    </Flex>
  );
}

interface RankRow {
  label: string;
  value: number;
  href?: string;
}

// A compact ranked list with a magnitude bar behind each row; rows link to their
// own detail page when an href is given.
function RankList({ rows }: { rows: RankRow[] }) {
  if (!rows.length) return <Empty />;
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;
  return (
    <VStack align="stretch" spacing="2px">
      {rows.map((r, i) => (
        <Box
          key={`${i}-${r.label}`}
          as={r.href ? "a" : "div"}
          {...(r.href ? { href: r.href } : {})}
          position="relative"
          display="block"
          borderRadius="3px"
          overflow="hidden"
          role="group"
          _hover={r.href ? { bg: SX.panelHi } : {}}
        >
          <Box position="absolute" top={0} left={0} bottom={0} width={`${(r.value / max) * 100}%`} bg="rgba(75,156,255,0.12)" />
          <Flex position="relative" align="center" gap={3} px={2.5} py="7px">
            <Text fontFamily={SX.mono} fontSize="11px" color={SX.faint} w="18px" flexShrink={0} textAlign="right">
              {i + 1}
            </Text>
            <Text
              flex={1}
              minW={0}
              fontSize="13px"
              color={SX.text}
              noOfLines={1}
              _groupHover={r.href ? { color: SX.accent } : {}}
            >
              {r.label}
            </Text>
            <Text fontFamily={SX.mono} fontSize="12px" color={SX.dim} flexShrink={0}>
              {r.value.toLocaleString()}
            </Text>
          </Flex>
        </Box>
      ))}
    </VStack>
  );
}

function Timeline({ spins, endAt, name }: { spins: Spin[]; endAt: number; name: string }) {
  const viz = useViz();
  const rows = useMemo(() => {
    if (!spins.length) return null;
    let minA = Infinity;
    for (const s of spins) if (s.at < minA) minA = s.at;
    const end = Math.max(endAt, minA);
    return totalTimeSeries(spins, minA, end, timelineFmt).rows;
  }, [spins, endAt]);
  if (!rows) return <Empty />;
  return <TimelineBars rows={rows} stations={[{ id: "value", name }]} viz={viz} />;
}

function NotFound({ what }: { what: string }) {
  return (
    <Box>
      <Crumb trail="Not found" />
      <Hero tag="404" title={`No ${what} here`} sub="It may not have been captured yet, or the link is stale." />
    </Box>
  );
}

// --- station detail ---------------------------------------------------------

export function StationPage({ data, id }: { data: Dataset; id: string }) {
  useEffect(() => window.scrollTo(0, 0), [id]);
  const station = data.stations.find((s) => s.id === id);
  const spins = useMemo(() => data.spins.filter((sp) => sp.s === id), [data.spins, id]);
  const stationName = useMemo(() => {
    const m = new Map(data.stations.map((s) => [s.id, s.name]));
    return (sid: string) => m.get(sid) ?? sid;
  }, [data.stations]);
  const feed = data.meta.feeds?.find((f) => f.id === id);
  const endAt = data.meta.dateRange ? data.meta.dateRange[1] : 0;

  const artists = useMemo(() => rankArtists(spins, 10), [spins]);
  const songs = useMemo(() => rankSongs(spins, 10), [spins]);
  const range = useMemo(() => {
    if (!spins.length) return null;
    let lo = Infinity,
      hi = -Infinity;
    for (const s of spins) {
      if (s.at < lo) lo = s.at;
      if (s.at > hi) hi = s.at;
    }
    return { lo, hi };
  }, [spins]);

  if (!station) return <NotFound what="station" />;

  const distinctArtists = new Set(spins.map((s) => normArtist(s.a))).size;
  const distinctSongs = new Set(spins.map((s) => songKey(s.a, s.t))).size;

  return (
    <Box>
      <Crumb trail={station.name} />
      <Hero
        tag={station.short ? `Station · ${station.short}` : "Station"}
        title={station.name}
        sub={`${station.market}${station.prov ? ", " + station.prov : ""} · ${station.format} · ${station.owner}`}
      />
      <VStack align="stretch" spacing={6}>
        <Tiles
          items={[
            { label: "Spins", value: spins.length.toLocaleString() },
            { label: "Artists", value: distinctArtists.toLocaleString() },
            { label: "Songs", value: distinctSongs.toLocaleString() },
            { label: "First spin", value: range ? fmtDate(range.lo) : "—" },
            { label: "Latest spin", value: range ? fmtDate(range.hi) : "—" },
          ]}
        />

        <MetaTable
          rows={[
            ["Market", `${station.market}${station.prov ? ", " + station.prov : ""}`],
            ["Owner", station.owner],
            ["Format", station.format],
            ["Source", station.adapter],
            ["Feed status", feed ? feed.status.toUpperCase() : "—"],
            station.lat != null && station.lon != null
              ? ["Coordinates", `${station.lat.toFixed(3)}, ${station.lon.toFixed(3)}`]
              : ["Coordinates", "—"],
          ]}
        />

        <Panel title="Airplay over time" sub={`spins per bucket · current period dimmed`}>
          <Timeline spins={spins} endAt={endAt} name={station.name} />
        </Panel>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Panel title="Top artists" sub="on this station">
            <RankList rows={artists.map((a) => ({ label: a.display, value: a.spins, href: hrefFor({ name: "artist", key: a.key }) }))} />
          </Panel>
          <Panel title="Top songs" sub="on this station">
            <RankList rows={songs.map((s) => ({ label: s.display, value: s.spins, href: hrefFor({ name: "song", key: s.key }) }))} />
          </Panel>
        </SimpleGrid>

        <Section title="Spin log" count={spins.length}>
          <DataGrid rows={spins} stationName={stationName} />
        </Section>
      </VStack>
    </Box>
  );
}

// --- artist detail ----------------------------------------------------------

export function ArtistPage({ data, artistKey }: { data: Dataset; artistKey: string }) {
  useEffect(() => window.scrollTo(0, 0), [artistKey]);
  const spins = useMemo(() => data.spins.filter((sp) => normArtist(sp.a) === artistKey), [data.spins, artistKey]);
  const stationName = useMemo(() => {
    const m = new Map(data.stations.map((s) => [s.id, s.name]));
    return (sid: string) => m.get(sid) ?? sid;
  }, [data.stations]);
  const endAt = data.meta.dateRange ? data.meta.dateRange[1] : 0;

  const display = useMemo(() => {
    // Most-recent spelling as seen wins as the display name.
    let last = "";
    let lastAt = -Infinity;
    for (const s of spins) if (s.at > lastAt) ((lastAt = s.at), (last = s.a));
    return last;
  }, [spins]);

  const songs = useMemo(() => rankSongs(spins, 15), [spins]);
  const byStation = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of spins) counts.set(s.s, (counts.get(s.s) || 0) + 1);
    return data.stations
      .map((st) => ({ st, v: counts.get(st.id) || 0 }))
      .filter((r) => r.v > 0)
      .sort((a, b) => b.v - a.v);
  }, [spins, data.stations]);
  const range = useMemo(() => {
    if (!spins.length) return null;
    let lo = Infinity,
      hi = -Infinity;
    for (const s of spins) {
      if (s.at < lo) lo = s.at;
      if (s.at > hi) hi = s.at;
    }
    return { lo, hi };
  }, [spins]);

  if (!spins.length) return <NotFound what="artist" />;

  return (
    <Box>
      <Crumb trail={display} />
      <Hero tag="Artist" title={display} sub={`${byStation.length} station${byStation.length === 1 ? "" : "s"} · ${songs.length} distinct song${songs.length === 1 ? "" : "s"}`} />
      <VStack align="stretch" spacing={6}>
        <Tiles
          items={[
            { label: "Spins", value: spins.length.toLocaleString() },
            { label: "Stations", value: byStation.length.toLocaleString() },
            { label: "Songs", value: songs.length.toLocaleString() },
            { label: "First spin", value: range ? fmtDate(range.lo) : "—" },
            { label: "Latest spin", value: range ? fmtDate(range.hi) : "—" },
          ]}
        />

        <Panel title="Airplay over time" sub="spins per bucket · all stations">
          <Timeline spins={spins} endAt={endAt} name={display} />
        </Panel>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Panel title="Top songs" sub="by this artist">
            <RankList rows={songs.map((s) => ({ label: s.title, value: s.spins, href: hrefFor({ name: "song", key: s.key }) }))} />
          </Panel>
          <Panel title="Stations playing" sub="most spins first">
            <RankList rows={byStation.map((r) => ({ label: r.st.name, value: r.v, href: hrefFor({ name: "station", id: r.st.id }) }))} />
          </Panel>
        </SimpleGrid>

        <Section title="Spin log" count={spins.length}>
          <DataGrid rows={spins} stationName={stationName} />
        </Section>
      </VStack>
    </Box>
  );
}

// --- song detail ------------------------------------------------------------

export function SongPage({ data, songKeyStr }: { data: Dataset; songKeyStr: string }) {
  useEffect(() => window.scrollTo(0, 0), [songKeyStr]);
  const spins = useMemo(() => data.spins.filter((sp) => songKey(sp.a, sp.t) === songKeyStr), [data.spins, songKeyStr]);
  const stationName = useMemo(() => {
    const m = new Map(data.stations.map((s) => [s.id, s.name]));
    return (sid: string) => m.get(sid) ?? sid;
  }, [data.stations]);
  const endAt = data.meta.dateRange ? data.meta.dateRange[1] : 0;

  const info = useMemo(() => {
    let last = { a: "", t: "" };
    let lastAt = -Infinity;
    for (const s of spins) if (s.at > lastAt) ((lastAt = s.at), (last = { a: s.a, t: s.t }));
    return last;
  }, [spins]);
  const byStation = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of spins) counts.set(s.s, (counts.get(s.s) || 0) + 1);
    return data.stations
      .map((st) => ({ st, v: counts.get(st.id) || 0 }))
      .filter((r) => r.v > 0)
      .sort((a, b) => b.v - a.v);
  }, [spins, data.stations]);
  const range = useMemo(() => {
    if (!spins.length) return null;
    let lo = Infinity,
      hi = -Infinity;
    for (const s of spins) {
      if (s.at < lo) lo = s.at;
      if (s.at > hi) hi = s.at;
    }
    return { lo, hi };
  }, [spins]);

  if (!spins.length) return <NotFound what="song" />;

  const artistKey = normArtist(info.a);

  return (
    <Box>
      <Crumb trail={`${info.a} — ${info.t}`} />
      <Hero
        tag="Song"
        title={info.t}
        sub={
          <>
            by{" "}
            <Box as="a" href={hrefFor({ name: "artist", key: artistKey })} color={SX.accent} _hover={{ textDecoration: "underline" }}>
              {info.a}
            </Box>
          </>
        }
      />
      <VStack align="stretch" spacing={6}>
        <Tiles
          items={[
            { label: "Spins", value: spins.length.toLocaleString() },
            { label: "Stations", value: byStation.length.toLocaleString() },
            { label: "First spin", value: range ? fmtDate(range.lo) : "—" },
            { label: "Latest spin", value: range ? fmtDate(range.hi) : "—" },
          ]}
        />

        <Panel title="Airplay over time" sub="spins per bucket · all stations">
          <Timeline spins={spins} endAt={endAt} name={info.t} />
        </Panel>

        <Panel title="Stations playing" sub="most spins first">
          <RankList rows={byStation.map((r) => ({ label: r.st.name, value: r.v, href: hrefFor({ name: "station", id: r.st.id }) }))} />
        </Panel>

        <Section title="Spin log" count={spins.length}>
          <DataGrid rows={spins} stationName={stationName} />
        </Section>
      </VStack>
    </Box>
  );
}

// --- small shared bits ------------------------------------------------------

function MetaTable({ rows }: { rows: [string, string][] }) {
  return (
    <Box bg={SX.panel} borderWidth="1px" borderColor={SX.line} borderRadius="4px" overflow="hidden">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing="1px" bg={SX.line}>
        {rows.map(([k, v]) => (
          <Flex key={k} bg={SX.panel} px={4} py="9px" gap={3} justify="space-between" align="baseline">
            <Text {...eyebrow} color={SX.dim}>
              {k}
            </Text>
            <Text fontFamily={SX.mono} fontSize="13px" color={SX.text} textAlign="right" noOfLines={1}>
              {v}
            </Text>
          </Flex>
        ))}
      </SimpleGrid>
    </Box>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Box>
      <Flex align="baseline" gap={3} mb={3}>
        <Text {...eyebrow}>{title}</Text>
        <Text fontFamily={SX.mono} fontSize="11px" color={SX.faint}>
          {count.toLocaleString()} rows
        </Text>
      </Flex>
      {children}
    </Box>
  );
}
