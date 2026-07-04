import { describe, expect, it } from "vitest";
import {
  hashForScreen,
  resolveInitialScreen,
  screenForHash,
  sanitizeScreen,
} from "./routing.js";

describe("hash routing", () => {
  it("maps public hash routes to app screens", () => {
    expect(screenForHash("#/landing")).toBe("landing");
    expect(screenForHash("#/roles")).toBe("role");
    expect(screenForHash("#/student")).toBe("app");
    expect(screenForHash("#/university")).toBe("uniDash");
    expect(screenForHash("#/bank")).toBe("bankDash");
  });

  it("maps screens back to stable hash routes", () => {
    expect(hashForScreen("landing")).toBe("#/landing");
    expect(hashForScreen("role")).toBe("#/roles");
    expect(hashForScreen("app")).toBe("#/student");
    expect(hashForScreen("uniDash")).toBe("#/university");
    expect(hashForScreen("bankDash")).toBe("#/bank");
  });

  it("falls back to landing for unknown persisted screens", () => {
    expect(sanitizeScreen("not-real")).toBe("landing");
  });

  it("restores functional screens from a hash deep-link, gating the app behind a session", () => {
    expect(resolveInitialScreen({ hash: "#/student", session: { mode: "guest" } })).toBe("app");
    expect(resolveInitialScreen({ hash: "#/university" })).toBe("uniDash");
    expect(resolveInitialScreen({ hash: "#/bank" })).toBe("bankDash");
    // An app deep-link with no session sanitizes down to landing, so it plays the splash.
    expect(resolveInitialScreen({ hash: "#/student", session: null })).toBe("splash");
  });

  it("sends a bare root URL to the splash intro, never a restored app or dashboard", () => {
    expect(resolveInitialScreen({ hash: "" })).toBe("splash");
    expect(resolveInitialScreen({ hash: "", session: { mode: "guest" } })).toBe("splash");
    // A stored screen must NOT pull a bare root back into the app — root is the front door.
    expect(resolveInitialScreen({ hash: "", storedScreen: "app", session: { mode: "guest" } })).toBe("splash");
    expect(resolveInitialScreen({ hash: "", storedScreen: "bankDash" })).toBe("splash");
  });

  it("plays the splash intro before landing rather than showing it cold", () => {
    expect(resolveInitialScreen({ hash: "#/landing" })).toBe("splash");
    expect(resolveInitialScreen({ hash: "#/landing", session: { mode: "guest" } })).toBe("splash");
  });
});
