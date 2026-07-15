import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: true,
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
