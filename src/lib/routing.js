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

export function resolveInitialScreen({ hash = "", session = null } = {}) {
  // A hash deep-links / reloads a specific screen (e.g. F5 on #/student keeps you in
  // the app), so honor it — except "landing", and any screen the current session
  // can't access which sanitizes down to landing, plays the splash intro first.
  //
  // A bare root URL has no hash: it means "take me to the front door", so it always
  // resolves to the splash → landing. It never restores a stored app or dashboard —
  // that's what the persisted hash is for.
  const routed = screenForHash(hash);
  if (routed) {
    const safe = sanitizeScreen(routed, session);
    if (safe !== "landing") return safe;
  }
  return "splash";
}
