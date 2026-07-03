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

  it("prefers a valid direct hash over stored screen state", () => {
    expect(resolveInitialScreen({ hash: "#/university", storedScreen: "bankDash" })).toBe("uniDash");
  });

  it("restores stored screens safely when there is no hash", () => {
    expect(resolveInitialScreen({ hash: "", storedScreen: "bankDash" })).toBe("bankDash");
    expect(resolveInitialScreen({ hash: "", storedScreen: "app", session: { mode: "guest" } })).toBe("app");
    expect(resolveInitialScreen({ hash: "", storedScreen: "app", session: null })).toBe("landing");
  });
});
