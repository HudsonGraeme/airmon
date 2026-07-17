import { SX } from "./ui";

// Chart palette for the dark SpaceX surfaces. Single-hue for magnitude charts
// (accent blue), plus the validated categorical order (dark steps) for pies —
// which also carry labels + legends, so identity is never color-alone.
const CATEGORICAL = [
  "#4b9cff", // blue (accent)
  "#37d67a", // green
  "#d55181", // magenta
  "#c98500", // yellow/amber
  "#199e70", // aqua
  "#d95926", // orange
  "#9085e9", // violet
  "#e66767", // red
];

export interface Viz {
  series: string;
  categorical: string[];
  other: string;
  grid: string;
  axis: string;
  muted: string;
  ink: string;
  surface: string;
  tooltipBg: string;
  tooltipBorder: string;
}

export function useViz(): Viz {
  return {
    series: SX.accent,
    categorical: CATEGORICAL,
    other: "#3a3a40",
    grid: SX.line,
    axis: SX.lineHi,
    muted: SX.dim,
    ink: SX.text,
    surface: SX.panel,
    tooltipBg: "#131318",
    tooltipBorder: SX.lineHi,
  };
}
