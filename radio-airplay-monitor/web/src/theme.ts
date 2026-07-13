import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: true,
};

// Brand accent doubles as the categorical "focus" hue in the data panels
// (validated dataviz blue). Peer baseline uses orange; both defined here so the
// charts and the UI share one source of truth.
export const viz = {
  focus: "#2a78d6",
  peers: "#eb6834",
};

export const theme = extendTheme({
  config,
  fonts: {
    heading: "system-ui, sans-serif",
    body: "system-ui, sans-serif",
  },
  colors: {
    brand: {
      50: "#e8f1fc",
      100: "#cde2fb",
      200: "#9ec5f4",
      300: "#6da7ec",
      400: "#3987e5",
      500: "#2a78d6",
      600: "#256abf",
      700: "#184f95",
      800: "#104281",
      900: "#0d366b",
    },
  },
  styles: {
    global: {
      "html, body": { bg: "chakra-body-bg" },
    },
  },
});
