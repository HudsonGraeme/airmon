import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Input, Text } from "@chakra-ui/react";
import { SX } from "../lib/ui";
import {
  buildSearchIndex,
  flattenHits,
  queryIndex,
  type SearchKind,
  type SearchResult,
} from "../lib/search";
import { navigate, type Route } from "../lib/router";
import type { Spin, Station } from "../lib/data";

const KIND_LABEL: Record<SearchKind, string> = { station: "Stations", artist: "Artists", song: "Songs" };
const KIND_TAG: Record<SearchKind, string> = { station: "STN", artist: "ART", song: "SNG" };

function routeFor(r: SearchResult): Route {
  if (r.kind === "station") return { name: "station", id: r.id };
  if (r.kind === "artist") return { name: "artist", key: r.id };
  return { name: "song", key: r.id };
}

// Global spotlight-style search: matches stations, artists, and songs and jumps
// to the matching detail page. Lives in the header so it's reachable from every
// view; "/" focuses it, arrow keys + Enter drive the result list.
export function SearchBar({ spins, stations }: { spins: Spin[]; stations: Station[] }) {
  const idx = useMemo(() => buildSearchIndex(spins, stations), [spins, stations]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => queryIndex(idx, q), [idx, q]);
  const flat = useMemo(() => flattenHits(hits), [hits]);
  useEffect(() => setActive(0), [q]);

  // "/" as a global focus shortcut, unless the user is already typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const go = (r: SearchResult) => {
    navigate(routeFor(r));
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!flat.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = flat[active] ?? flat[0];
      if (r) go(r);
    }
  };

  const showDrop = open && q.trim().length > 0;

  return (
    <Box ref={boxRef} position="relative" w={{ base: "full", md: "340px" }}>
      <Flex align="center" position="relative">
        <Box position="absolute" left="10px" color={SX.faint} fontSize="12px" fontFamily={SX.mono} pointerEvents="none">
          ⌕
        </Box>
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search stations, artists, songs…"
          size="sm"
          pl="26px"
          bg={SX.panel}
          borderColor={SX.line}
          color={SX.text}
          fontFamily={SX.mono}
          fontSize="13px"
          borderRadius="4px"
          _hover={{ borderColor: SX.lineHi }}
          _focusVisible={{ borderColor: SX.accent, boxShadow: "none" }}
          _placeholder={{ color: SX.faint }}
        />
      </Flex>

      {showDrop && (
        <Box
          position="absolute"
          top="calc(100% + 6px)"
          left={0}
          right={0}
          zIndex={40}
          bg={SX.panel}
          borderWidth="1px"
          borderColor={SX.lineHi}
          borderRadius="6px"
          boxShadow="0 12px 32px rgba(0,0,0,0.6)"
          maxH="70vh"
          overflowY="auto"
        >
          {hits.total === 0 ? (
            <Text px={3} py={3} fontFamily={SX.mono} fontSize="12px" color={SX.faint}>
              No matches for “{q.trim()}”
            </Text>
          ) : (
            (["station", "artist", "song"] as SearchKind[]).map((kind) => {
              const group = hits[kind === "station" ? "stations" : kind === "artist" ? "artists" : "songs"];
              if (!group.length) return null;
              return (
                <Box key={kind}>
                  <Text
                    px={3}
                    pt={2}
                    pb={1}
                    fontSize="10px"
                    fontWeight={600}
                    letterSpacing="0.14em"
                    textTransform="uppercase"
                    color={SX.faint}
                  >
                    {KIND_LABEL[kind]}
                  </Text>
                  {group.map((r) => {
                    const i = flat.indexOf(r);
                    const on = i === active;
                    return (
                      <Flex
                        key={`${r.kind}:${r.id}`}
                        align="center"
                        gap={2}
                        px={3}
                        py="7px"
                        cursor="pointer"
                        bg={on ? SX.panelHi : "transparent"}
                        borderLeftWidth="2px"
                        borderColor={on ? SX.accent : "transparent"}
                        onMouseEnter={() => setActive(i)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          go(r);
                        }}
                      >
                        <Box
                          fontFamily={SX.mono}
                          fontSize="9px"
                          color={SX.faint}
                          borderWidth="1px"
                          borderColor={SX.line}
                          borderRadius="3px"
                          px="4px"
                          py="1px"
                          flexShrink={0}
                        >
                          {KIND_TAG[r.kind]}
                        </Box>
                        <Box minW={0} flex={1}>
                          <Text fontSize="13px" color={SX.text} noOfLines={1}>
                            {r.label}
                          </Text>
                          <Text fontFamily={SX.mono} fontSize="10px" color={SX.faint} noOfLines={1}>
                            {r.sub}
                          </Text>
                        </Box>
                        <Text fontFamily={SX.mono} fontSize="11px" color={SX.dim} flexShrink={0}>
                          {r.spins.toLocaleString()}
                        </Text>
                      </Flex>
                    );
                  })}
                </Box>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
}
