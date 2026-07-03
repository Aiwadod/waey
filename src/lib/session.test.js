import { describe, expect, it } from "vitest";
import {
  clearSession,
  createGuestSession,
  createLoginSession,
  loadSession,
  saveSession,
} from "./session.js";

function storage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

describe("local session helpers", () => {
  it("rejects empty login attempts", () => {
    expect(createLoginSession("", "")).toBeNull();
    expect(createLoginSession("student", " ")).toBeNull();
    expect(createLoginSession(" ", "secret")).toBeNull();
  });

  it("creates minimal user and guest sessions without storing passwords", () => {
    expect(createLoginSession(" student@u.edu ", "secret")).toEqual({
      mode: "user",
      id: "student@u.edu",
    });
    expect(createGuestSession()).toEqual({ mode: "guest" });
  });

  it("persists, restores, and clears valid session state", () => {
    const localStorage = storage();
    saveSession(localStorage, { mode: "guest" }, "app");

    expect(loadSession(localStorage)).toEqual({ session: { mode: "guest" }, screen: "app" });

    clearSession(localStorage);

    expect(loadSession(localStorage)).toEqual({ session: null, screen: null });
  });

  it("ignores malformed stored session data", () => {
    const localStorage = storage();
    localStorage.setItem("waey.session", "{broken");
    localStorage.setItem("waey.screen", "app");

    expect(loadSession(localStorage)).toEqual({ session: null, screen: "app" });
  });
});
