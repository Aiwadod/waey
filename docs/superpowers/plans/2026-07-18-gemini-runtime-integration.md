# Gemini Runtime Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Anthropic-backed `/api/ai` runtime with a secure Gemini-backed implementation without changing the React client contract.

**Architecture:** Keep `/api/ai` as the server-side boundary and preserve its validation, prompts, throttling, and `{ text }` response. Add a focused Gemini adapter that converts Waey messages to Gemini content, selects the configured primary/fallback model, and normalizes errors for the existing endpoint.

**Tech Stack:** Vercel Functions, Node.js ESM, `@google/genai`, Vitest, React/Vite

---

## File Structure

- Create `api/gemini.js`: Gemini-specific model selection, message conversion, generation, fallback, and error classification.
- Create `api/gemini.test.js`: focused adapter tests using an injected fake SDK client.
- Modify `api/ai.js`: replace Anthropic calls with the adapter while preserving Waey's HTTP contract and safeguards.
- Create `api/ai.test.js`: endpoint-level tests for configuration, validation, success, throttling, and upstream failures.
- Modify `vite.config.js`: include serverless API tests in Vitest's test discovery.
- Modify `package.json` and `package-lock.json`: make `@google/genai` a runtime dependency and remove `@anthropic-ai/sdk`.
- Modify `.env.example`: document Gemini runtime configuration and remove Anthropic instructions.

### Task 1: Add the Gemini adapter with test-first coverage

**Files:**
- Create: `api/gemini.js`
- Create: `api/gemini.test.js`
- Modify: `vite.config.js`

- [ ] **Step 1: Write adapter tests that define the provider contract**

Test that assistant roles become Gemini `model` roles, `systemInstruction`, `maxOutputTokens`, and `abortSignal` are passed in config, blank responses normalize to `null`, the fallback model is attempted after a retriable primary failure, and status `429` is classified as throttling. Use an injected client factory:

```js
const createClient = () => ({
  models: {
    generateContent: vi.fn().mockResolvedValue({ text: "  live reply  " }),
  },
});

const text = await generateGeminiText({
  apiKey: "test-key",
  fastModel: "gemini-fast",
  fallbackModel: "gemini-fallback",
  systemInstruction: "Waey system prompt",
  messages: [{ role: "user", content: "Hello" }, { role: "assistant", content: "Hi" }],
  maxOutputTokens: 1500,
  createClient,
});

expect(text).toBe("live reply");
```

- [ ] **Step 2: Run the adapter test and verify it fails**

Run: `npx vitest run api/gemini.test.js`

Expected: FAIL because `api/gemini.js` does not exist and API tests are not yet included.

- [ ] **Step 3: Implement the adapter minimally**

Implement these exported boundaries:

```js
export async function generateGeminiText({
  apiKey,
  fastModel = "gemini-2.5-flash",
  fallbackModel,
  systemInstruction,
  messages,
  maxOutputTokens,
  signal,
  createClient = (key) => new GoogleGenAI({ apiKey: key }),
})

export function isGeminiRateLimitError(error) {
  return Number(error?.status ?? error?.code) === 429;
}
```

Use `contents: messages.map(({ role, content }) => ({ role: role === "assistant" ? "model" : "user", parts: [{ text: content }] }))`. Pass `systemInstruction`, `maxOutputTokens`, and `abortSignal: signal` inside `config`. Retry only once with a distinct fallback model when the first error has status `404` or `>=500`; never retry aborted or throttled requests.

- [ ] **Step 4: Include API tests in Vitest discovery**

Change `vite.config.js` test inclusion to:

```js
include: ["src/**/*.test.{js,jsx,ts,tsx}", "api/**/*.test.{js,ts}"],
```

- [ ] **Step 5: Run the adapter tests and verify they pass**

Run: `npx vitest run api/gemini.test.js`

Expected: all Gemini adapter tests PASS.

- [ ] **Step 6: Commit the adapter and focused tests**

```bash
git add api/gemini.js api/gemini.test.js vite.config.js
git commit -m "feat: add Gemini server adapter"
```

### Task 2: Replace the serverless endpoint provider

**Files:**
- Modify: `api/ai.js`
- Create: `api/ai.test.js`

- [ ] **Step 1: Write endpoint tests against an injected generator**

Create request/response fakes and test the exported handler boundary:

```js
const generateText = vi.fn().mockResolvedValue("Gemini response");
await handleAiRequest(request({
  kind: "student",
  lang: "en",
  snapshot: {},
  messages: [{ role: "user", content: "Help me save" }],
}), response(), {
  env: { GEMINI_API_KEY: "test-key", GEMINI_FAST_MODEL: "gemini-fast" },
  generateText,
});
```

Assert `503 ai_not_configured` without `GEMINI_API_KEY`, existing `400` validation responses, successful `{ text: "Gemini response" }`, `429` for Gemini throttling, and `502` for other upstream failures.

- [ ] **Step 2: Run the endpoint tests and verify they fail**

Run: `npx vitest run api/ai.test.js`

Expected: FAIL because `handleAiRequest` and Gemini injection do not exist.

- [ ] **Step 3: Replace Anthropic with the Gemini adapter**

Replace the Anthropic import with:

```js
import { generateGeminiText, isGeminiRateLimitError } from "./gemini.js";
```

Export an injectable handler:

```js
export async function handleAiRequest(req, res, {
  env = process.env,
  generateText = generateGeminiText,
} = {})
```

Require `env.GEMINI_API_KEY`, and invoke:

```js
const text = await generateText({
  apiKey: env.GEMINI_API_KEY,
  fastModel: env.GEMINI_FAST_MODEL,
  fallbackModel: env.GEMINI_FALLBACK_MODEL,
  systemInstruction: buildSystem(kind, cleanLang, snapshot),
  messages: clean,
  maxOutputTokens: MAX_OUTPUT_TOKENS,
  signal: upstream.signal,
});
```

Return `{ text: text || null }`. Map `isGeminiRateLimitError(error)` to `429`, all other provider failures to `502`, and preserve the current abort behavior. Export the Vercel default as `export default function handler(req, res) { return handleAiRequest(req, res); }`.

- [ ] **Step 4: Run endpoint and adapter tests**

Run: `npx vitest run api/ai.test.js api/gemini.test.js`

Expected: all tests PASS.

- [ ] **Step 5: Commit the provider replacement**

```bash
git add api/ai.js api/ai.test.js
git commit -m "feat: run Waey AI on Gemini"
```

### Task 3: Update runtime dependencies and configuration documentation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.env.example`

- [ ] **Step 1: Move the Google SDK to runtime dependencies and remove Anthropic**

The resulting dependency ownership must be:

```json
"dependencies": {
  "@google/genai": "^2.10.0"
},
"devDependencies": {
}
```

Preserve every unrelated dependency and any pre-existing local edits. Regenerate only the matching lockfile dependency metadata with npm.

- [ ] **Step 2: Update environment documentation**

Document these server-side variables in `.env.example`:

```dotenv
# GEMINI_API_KEY=...
# GEMINI_FAST_MODEL=gemini-2.5-flash
# GEMINI_FALLBACK_MODEL=gemini-2.5-flash-lite
```

Keep `VITE_AI_ENDPOINT=/api/ai` documented as the browser-facing first-party endpoint and explicitly warn against any `VITE_GEMINI_API_KEY` variable.

- [ ] **Step 3: Confirm no runtime Anthropic references remain**

Run: `rg -n "Anthropic|ANTHROPIC_API_KEY|@anthropic-ai/sdk" api src .env.example package.json package-lock.json`

Expected: no matches.

- [ ] **Step 4: Commit dependency and environment changes without staging unrelated edits**

```bash
git add .env.example package.json package-lock.json
git commit -m "build: configure Gemini runtime"
```

Before committing, inspect the staged diff and unstage any unrelated user-owned lines.

### Task 4: Full verification and delivery

**Files:**
- Verify only; no planned source changes.

- [ ] **Step 1: Run focused server tests**

Run: `npx vitest run api/ai.test.js api/gemini.test.js`

Expected: PASS.

- [ ] **Step 2: Run the required repository check**

Run: `npm run check`

Expected: all unit tests pass and the Vite production build succeeds.

- [ ] **Step 3: Run relevant browser-flow tests**

Run: `npm run test:e2e -- --grep "AI|وعي"`

Expected: Waey AI flows pass, or the command reports no matching tests; if no tests match, run the AI-related specs by filename.

- [ ] **Step 4: Inspect secret safety and final changes**

Run `git diff --check`, confirm `.env.local` is untracked/ignored, and inspect `git status --short` to ensure only the user's pre-existing unrelated files remain outside the Gemini commits.

- [ ] **Step 5: Push the current `main` branch**

```bash
git push origin main
```

Expected: the Gemini commits are pushed to `origin/main` without force.
