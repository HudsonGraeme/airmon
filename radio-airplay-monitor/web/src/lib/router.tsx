// A tiny hash-based router. Hash routing needs no server rewrite rules, so it
// works as-is on GitHub Pages under the /airmon/ base — a deep link like
// #/artist/drake resolves on a cold load with no 404 dance. Keeping it in-house
// (rather than pulling in react-router) keeps the bundle self-contained.
import { useEffect, useState } from "react";

export type Route =
  | { name: "home" }
  | { name: "station"; id: string }
  | { name: "artist"; key: string }
  | { name: "song"; key: string };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, "").split("?")[0];
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "station" && parts[1]) return { name: "station", id: parts[1] };
  if (parts[0] === "artist" && parts[1]) return { name: "artist", key: parts[1] };
  if (parts[0] === "song" && parts[1]) return { name: "song", key: parts[1] };
  return { name: "home" };
}

// Each dynamic segment is encoded as one path component. Song keys carry "|" and
// may carry "/" (e.g. "AC/DC"), so encodeURIComponent — which escapes "/" — keeps
// them from splitting the path.
export function hrefFor(r: Route): string {
  switch (r.name) {
    case "station":
      return `#/station/${encodeURIComponent(r.id)}`;
    case "artist":
      return `#/artist/${encodeURIComponent(r.key)}`;
    case "song":
      return `#/song/${encodeURIComponent(r.key)}`;
    default:
      return "#/";
  }
}

export function navigate(r: Route): void {
  const target = hrefFor(r);
  if (`#${window.location.hash.replace(/^#/, "")}` === target) return;
  window.location.hash = target;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
