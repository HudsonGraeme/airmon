import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
import { SX } from "./lib/ui";

// Dark by design (SpaceX-style), so the color mode is pinned to dark and the app
// draws from the SX palette rather than color-mode tokens.
const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  fonts: {
    heading: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: SX.mono,
  },
  colors: {
    brand: {
      50: "#e8f1fc",
      100: "#cde2fb",
      200: "#9ec5f4",
      300: "#6da7ec",
      400: "#4b9cff",
      500: "#3987e5",
      600: "#2f6fd6",
      700: "#184f95",
      800: "#104281",
      900: "#0d366b",
    },
  },
  styles: {
    global: {
      "html, body, #root": { bg: SX.page, color: SX.text },
      "::selection": { background: "rgba(75,156,255,0.28)" },
    },
  },
});
