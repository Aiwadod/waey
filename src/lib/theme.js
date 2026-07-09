// Waey design tokens — the single source of design truth.
// Every screen consumes these through the `c` object (c = themes[theme]);
// waey-theme.css consumes the same values through the CSS custom properties
// that applyThemeVars() mirrors onto :root.
//
// Palette contract: the warm cream/beige light theme is the locked default
// (an e2e test asserts the #F1EFE9 page tone). Hue identity is fixed —
// violet accent, terracotta secondary, warm neutrals. Lightness may only be
// tuned to keep every declared text/surface pair at WCAG 2.2 AA (>= 4.5:1),
// which theme.test.js enforces.

export const FONT_STACK = "'IBM Plex Sans Arabic', system-ui, sans-serif";

export const themes = {
  dark: {
    page: "radial-gradient(120% 80% at 50% 0%, #0A2233 0%, #00121C 60%)",
    bg0: "#00121C", bg1: "#002134", card: "#072A3D", card2: "#0B3346",
    line: "rgba(255,255,255,0.08)", text: "#FFFFFF", textSoft: "#E8F0F4", muted: "#8FA6B4",
    accent: "#8685D8", accentText: "#A8A6F2", onAccent: "#0A1822",
    terra: "#CA6C46", terraText: "#E08A63", onTerra: "#0A1822", green: "#5FCB8E", onGreen: "#0A1822",
    warn: "#E4B45C",
    inputBg: "rgba(255,255,255,0.05)", statusText: "#FFFFFF", bezel1: "#04161F", bezel2: "#0A2A3D",
    shadow: "0 24px 70px -48px rgba(0,0,0,0.9)",
    focus: "#A8A6F2",
    softInset: "rgba(255,255,255,0.06)",
    liftShadow: "0 24px 60px -34px rgba(0,0,0,0.75)",
  },
  light: {
    page: "radial-gradient(120% 80% at 50% 0%, #FFFFFF 0%, #ECEAE3 70%)",
    bg0: "#F1EFE9", bg1: "#FFFFFF", card: "#FFFFFF", card2: "#F5F3EE",
    line: "rgba(0,33,52,0.10)", text: "#0F2230", textSoft: "#243744", muted: "#5D6B77",
    accent: "#6663CB", accentText: "#5F5DBE", onAccent: "#FFFFFF",
    terra: "#B4552F", terraText: "#A84E2C", onTerra: "#FFFFFF", green: "#19754A", onGreen: "#FFFFFF",
    warn: "#8A5A0F",
    inputBg: "#F1EFE9", statusText: "#0F2230", bezel1: "#DAD7CF", bezel2: "#C7C3BA",
    shadow: "0 24px 70px -48px rgba(15,34,48,0.45)",
    focus: "#5F5DBE",
    softInset: "rgba(255,255,255,0.72)",
    liftShadow: "0 24px 60px -34px rgba(15,34,48,0.45)",
  },
};

// Keys mirrored to CSS custom properties (--waey-*) so stylesheet rules
// (focus ring, soft-card highlight, hover lift) track the active theme.
const CSS_VAR_KEYS = {
  page: "--waey-page",
  text: "--waey-ink",
  line: "--waey-line",
  card: "--waey-card",
  card2: "--waey-card2",
  muted: "--waey-muted",
  accent: "--waey-accent",
  focus: "--waey-focus",
  softInset: "--waey-soft-inset",
  liftShadow: "--waey-lift-shadow",
};

export function applyThemeVars(themeName, doc = document) {
  const t = themes[themeName] ?? themes.light;
  const root = doc.documentElement;
  root.style.colorScheme = themeName === "dark" ? "dark" : "light";
  for (const [key, varName] of Object.entries(CSS_VAR_KEYS)) {
    root.style.setProperty(varName, key === "page" ? t.bg0 : t[key]);
  }
  if (doc.body) doc.body.style.background = t.bg0;
}

/* ---- WCAG 2.2 contrast math (used by theme.test.js and available to
   any screen that needs to pick a readable foreground at runtime) ---- */

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channelLuminance(v) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fgHex, bgHex) {
  const fg = relativeLuminance(fgHex);
  const bg = relativeLuminance(bgHex);
  if (fg == null || bg == null) return null;
  const [hi, lo] = fg >= bg ? [fg, bg] : [bg, fg];
  return (hi + 0.05) / (lo + 0.05);
}
