export const ROUTES = {
  "#/landing": "landing",
  "#/roles": "role",
  "#/student": "app",
  "#/university": "uniDash",
  "#/bank": "bankDash",
};

export const SCREEN_HASHES = {
  landing: "#/landing",
  role: "#/roles",
  app: "#/student",
  uniDash: "#/university",
  bankDash: "#/bank",
};

const PUBLIC_SCREENS = new Set(["splash", "landing", "login", "about", "role", "assess", "uniDash", "bankDash"]);

export function screenForHash(hash) {
  return ROUTES[normalizeHash(hash)] ?? null;
}

export function hashForScreen(screen) {
  return SCREEN_HASHES[screen] ?? "#/landing";
}

export function normalizeHash(hash) {
  if (!hash || typeof hash !== "string") return "";
  const clean = hash.trim();
  if (!clean) return "";
  return clean.startsWith("#") ? clean : `#${clean}`;
}

export function sanitizeScreen(screen, session = null) {
  if (screen === "app") return session ? "app" : "landing";
  if (PUBLIC_SCREENS.has(screen)) return screen;
  return "landing";
}

export function resolveInitialScreen({ hash = "", storedScreen = null, session = null } = {}) {
  const routed = screenForHash(hash);
  if (routed) return routed;
  if (storedScreen) return sanitizeScreen(storedScreen, session);
  return "splash";
}
