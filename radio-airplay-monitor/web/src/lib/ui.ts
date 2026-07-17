// SpaceX-style visual system: near-black surfaces, hairline borders, high-contrast
// white ink, a single cool-blue accent, monospaced telemetry, and uppercase
// letter-spaced labels. The whole app is dark by design, so these are fixed
// constants rather than color-mode tokens.
export const SX = {
  page: "#000000",
  panel: "#0a0a0c",
  panelHi: "#101015",
  line: "#1d1d21",
  lineHi: "#2b2b31",
  text: "#f4f4f6",
  dim: "#9a9aa2",
  faint: "#5c5c64",
  accent: "#4b9cff",
  accentDim: "#2f6fd6",
  ok: "#37d67a",
  warn: "#f5b833",
  down: "#ff5c5c",
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
} as const;

// status → color for feed-health dots/labels.
export const statusColor: Record<string, string> = {
  ok: SX.ok,
  stale: SX.warn,
  down: SX.down,
  unknown: SX.faint,
};

// uppercase, letter-spaced label styling used for section eyebrows and headers.
export const label = {
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  fontSize: "11px",
  fontWeight: 600,
  color: SX.dim,
};
