import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const EMOJI_PATTERN =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]\uFE0F?|\u00A9\uFE0F|\u00AE\uFE0F/gu;
const SKIP_DIRS = new Set([
  ".agents",
  ".claude",
  ".git",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const TEXT_FILE_PATTERN = /\.(css|html|jsx?|json|md|tsx?|webmanifest)$/;

function collectTextFiles(dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        files.push(...collectTextFiles(resolve(dir, entry.name)));
      }
      continue;
    }

    if (TEXT_FILE_PATTERN.test(entry.name)) {
      files.push(resolve(dir, entry.name));
    }
  }

  return files;
}

describe("emoji usage", () => {
  test("first-party project files use SVG icons instead of raw emoji glyphs", () => {
    const root = resolve(process.cwd());
    const offenders = collectTextFiles(root)
      .map((file) => ({ file, matches: readFileSync(file, "utf8").match(EMOJI_PATTERN) }))
      .filter(({ matches }) => matches?.length);

    expect(offenders).toEqual([]);
  });
});
