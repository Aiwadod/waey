import { describe, expect, it } from "vitest";
import { applyThemeVars, contrastRatio, hexToRgb, themes } from "./theme.js";

const THEME_NAMES = Object.keys(themes);

describe("theme token contract", () => {
  it("light and dark expose the same token keys", () => {
    const [a, b] = THEME_NAMES.map((n) => Object.keys(themes[n]).sort().join(","));
    expect(a).toBe(b);
  });

  it("the warm light palette stays the locked default page tone", () => {
    expect(themes.light.bg0).toBe("#F1EFE9");
    expect(themes.light.page).toContain("#ECEAE3");
  });

  it("every solid color token parses as hex", () => {
    const solidKeys = ["bg0", "bg1", "card", "card2", "text", "textSoft", "muted", "accent", "accentText", "onAccent", "terra", "terraText", "onTerra", "green", "warn", "focus", "statusText", "bezel1", "bezel2"];
    for (const name of THEME_NAMES) {
      for (const key of solidKeys) {
        expect(hexToRgb(themes[name][key]), `${name}.${key}`).not.toBeNull();
      }
    }
  });
});

describe("WCAG 2.2 AA contrast (>= 4.5:1 for the pairs Waey renders as normal-size text)", () => {
  // [foreground token, background token]
  const PAIRS = [
    ["text", "card"], ["text", "card2"], ["text", "bg0"], ["text", "bg1"],
    ["textSoft", "card"], ["textSoft", "card2"],
    ["muted", "card"], ["muted", "card2"], ["muted", "bg0"],
    ["accentText", "card"], ["accentText", "card2"], ["accentText", "bg0"],
    ["terraText", "card"],
    ["green", "card"], ["green", "card2"],
    ["warn", "card"], ["warn", "card2"],
    ["onAccent", "accent"],
    ["onAccent", "accentText"], // accent -> accentText gradients carry onAccent text
    ["onTerra", "terra"],
    ["onTerra", "terraText"], // terra -> terraText gradients carry onTerra text
    ["onGreen", "green"],
  ];

  for (const name of THEME_NAMES) {
    for (const [fg, bg] of PAIRS) {
      it(`${name}: ${fg} on ${bg}`, () => {
        const ratio = contrastRatio(themes[name][fg], themes[name][bg]);
        expect(ratio, `${name} ${fg}(${themes[name][fg]}) on ${bg}(${themes[name][bg]}) = ${ratio?.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  // Waey renders accent/green text on 10%-alpha tints of the same hue
  // (e.g. background: c.green + "1A" chips). Verify against the blended color.
  function blendHex(fgHex, bgHex, alpha) {
    const f = hexToRgb(fgHex);
    const b = hexToRgb(bgHex);
    const mix = f.map((ch, i) => Math.round(alpha * ch + (1 - alpha) * b[i]));
    return `#${mix.map((ch) => ch.toString(16).padStart(2, "0")).join("")}`;
  }
  const TINT_PAIRS = [["green", "green"], ["accentText", "accent"], ["terraText", "terra"]];
  for (const name of THEME_NAMES) {
    for (const [fg, tintOf] of TINT_PAIRS) {
      it(`${name}: ${fg} on 10% ${tintOf} tint over card`, () => {
        const bg = blendHex(themes[name][tintOf], themes[name].card, 0.102);
        const ratio = contrastRatio(themes[name][fg], bg);
        expect(ratio, `${name} ${fg} on tint(${bg}) = ${ratio?.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe("applyThemeVars", () => {
  function fakeDoc() {
    const style = (vars) => ({
      vars,
      setProperty(k, v) { vars[k] = v; },
      set colorScheme(v) { vars.colorScheme = v; },
      get colorScheme() { return vars.colorScheme; },
      set background(v) { vars.background = v; },
      get background() { return vars.background; },
    });
    return { documentElement: { style: style({}) }, body: { style: style({}) } };
  }

  it("mirrors tokens onto :root and sets color-scheme + body background", () => {
    const doc = fakeDoc();
    applyThemeVars("dark", doc);
    expect(doc.documentElement.style.vars.colorScheme).toBe("dark");
    expect(doc.documentElement.style.vars["--waey-page"]).toBe(themes.dark.bg0);
    expect(doc.documentElement.style.vars["--waey-focus"]).toBe(themes.dark.focus);
    expect(doc.documentElement.style.vars["--waey-card"]).toBe(themes.dark.card);
    expect(doc.body.style.vars.background).toBe(themes.dark.bg0);
  });

  it("falls back to light for unknown themes", () => {
    const doc = fakeDoc();
    applyThemeVars("nope", doc);
    expect(doc.documentElement.style.vars.colorScheme).toBe("light");
    expect(doc.documentElement.style.vars["--waey-page"]).toBe(themes.light.bg0);
  });
});
