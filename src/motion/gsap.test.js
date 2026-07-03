import { afterEach, describe, expect, it, vi } from "vitest";
import { motionDuration, prefersReducedMotion } from "./gsap.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubReducedMotion(matches) {
  vi.stubGlobal("window", {
    matchMedia: vi.fn(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

describe("GSAP motion helpers", () => {
  it("detects reduced motion from matchMedia", () => {
    stubReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
  });

  it("keeps normal durations when reduced motion is off", () => {
    stubReducedMotion(false);
    expect(motionDuration(0.7)).toBe(0.7);
  });

  it("shrinks durations when reduced motion is on", () => {
    stubReducedMotion(true);
    expect(motionDuration(0.7)).toBe(0.01);
  });
});
