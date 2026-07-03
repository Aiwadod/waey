export const SESSION_KEY = "waey.session";
export const SCREEN_KEY = "waey.screen";

export function createLoginSession(id, password) {
  const cleanId = String(id ?? "").trim();
  const cleanPassword = String(password ?? "").trim();
  if (!cleanId || !cleanPassword) return null;
  return { mode: "user", id: cleanId };
}

export function createGuestSession() {
  return { mode: "guest" };
}

export function isValidSession(session) {
  if (!session || typeof session !== "object") return false;
  if (session.mode === "guest") return true;
  return session.mode === "user" && typeof session.id === "string" && session.id.trim().length > 0;
}

export function saveSession(storage, session, screen) {
  if (!storage || !isValidSession(session)) return;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  if (screen) storage.setItem(SCREEN_KEY, screen);
}

export function saveScreen(storage, screen) {
  if (!storage || !screen) return;
  storage.setItem(SCREEN_KEY, screen);
}

export function loadSession(storage) {
  if (!storage) return { session: null, screen: null };
  const screen = storage.getItem(SCREEN_KEY);
  const raw = storage.getItem(SESSION_KEY);
  if (!raw) return { session: null, screen };

  try {
    const session = JSON.parse(raw);
    return { session: isValidSession(session) ? session : null, screen };
  } catch {
    return { session: null, screen };
  }
}

export function clearSession(storage) {
  if (!storage) return;
  storage.removeItem(SESSION_KEY);
  storage.removeItem(SCREEN_KEY);
}
