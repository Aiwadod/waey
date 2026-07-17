import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "");

describe("site-wide visual system", () => {
  it("enforces IBM Plex Sans Arabic across the document and controls", () => {
    const css = read("src/styles/waey-theme.css");

    expect(css).toContain("--waey-font-family: 'IBM Plex Sans Arabic'");
    expect(css).toMatch(/html,[\s\S]*body,[\s\S]*#root[\s\S]*font-family: var\(--waey-font-family\)/);
    expect(css).toMatch(/button,[\s\S]*input,[\s\S]*select,[\s\S]*textarea[\s\S]*font-family: inherit/);
  });

  it("provides shared backdrop and page-motion primitives with stable hooks", () => {
    const backdrop = read("src/components/motion/AmbientBackdrop.jsx");
    const motionPage = read("src/components/motion/MotionPage.jsx");

    expect(backdrop).toContain("data-waey-backdrop");
    expect(backdrop).toContain("WaeyFlowField");
    expect(motionPage).toContain("data-waey-motion-page");
    expect(motionPage).toContain("useReducedMotion");
  });
});
