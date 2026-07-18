# Gemini Runtime Integration Design

## Goal

Replace the Anthropic implementation behind Waey's existing `/api/ai` serverless endpoint with Google Gemini while preserving the current browser contract, server-side prompts, safeguards, and offline fallback behavior.

## Scope

- Keep React calls targeting `VITE_AI_ENDPOINT`, which defaults to `/api/ai`.
- Keep `GEMINI_API_KEY` server-side and never expose it through a `VITE_` variable.
- Use the existing Google GenAI SDK from the Vercel function.
- Remove the Anthropic runtime dependency after confirming it has no remaining consumers.
- Document local and Vercel environment configuration.

The image-generation script remains independent. It may continue using the same server-side environment key at design time, but it is not part of the runtime chat flow.

## Architecture

The browser sends the existing validated payload to `/api/ai`. The Vercel function validates the request, selects the student, university, or bank system instruction, and converts the chat history into Gemini content. Gemini returns text to the function, which normalizes the result to the existing `{ "text": string | null }` response consumed by the app.

No Gemini credential or vendor endpoint is sent to the browser.

## Model Configuration

- `GEMINI_API_KEY` is required for live responses.
- `GEMINI_FAST_MODEL` selects the primary chat model.
- `GEMINI_FALLBACK_MODEL` may be used for one retry when the primary model is unavailable.
- Safe defaults are used when model variables are absent.

## Preserved Safeguards

- POST-only endpoint.
- Allowed `kind` values: `student`, `uni`, and `bank`.
- Message, snapshot, and output-size limits.
- Per-IP best-effort rate limiting and concurrency limits.
- Server-owned system instructions.
- Request cancellation when the client disconnects where supported.
- Generic public errors that do not leak credentials or upstream details.

## Error and Fallback Behavior

Missing configuration returns `503 ai_not_configured`. Rate limiting returns `429`. Invalid requests retain the current `400` responses. Gemini quota or throttling maps to `429`; other upstream failures map to `502`. The React client treats non-success responses as unavailable and continues using its existing offline demo responses.

## Testing

- Unit-test successful Gemini text normalization.
- Verify the key is read only from server environment variables.
- Verify missing-key, invalid-payload, throttling, and upstream-error responses.
- Verify model fallback behavior.
- Run the repository's unit tests and production build.
- Run focused browser tests for Waey AI if the local serverless runtime is available; otherwise verify the existing offline fallback flow.

## Deployment

Add `GEMINI_API_KEY`, and optionally the model variables, to the Vercel project environment. `.env.local` remains ignored by Git and is used only for local development. No secret value is committed or printed.
