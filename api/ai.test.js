import { describe, expect, it, vi } from "vitest";
import { handleAiRequest } from "./ai.js";

function request(body, { method = "POST", ip = "127.0.0.1" } = {}) {
  return {
    method,
    body,
    headers: { "x-forwarded-for": ip },
    socket: { remoteAddress: ip },
    on: vi.fn(),
  };
}

function response() {
  const res = {
    writableEnded: false,
    headers: {},
    statusCode: 200,
    payload: undefined,
    setHeader: vi.fn((name, value) => { res.headers[name] = value; }),
    status: vi.fn((statusCode) => { res.statusCode = statusCode; return res; }),
    json: vi.fn((payload) => { res.payload = payload; res.writableEnded = true; return res; }),
  };
  return res;
}

function validBody(overrides = {}) {
  return {
    kind: "student",
    lang: "en",
    snapshot: {},
    messages: [{ role: "user", content: "Help me save" }],
    ...overrides,
  };
}

describe("Waey AI serverless endpoint", () => {
  it("returns 503 when the server-side Gemini key is absent", async () => {
    const res = response();
    const generateText = vi.fn();

    await handleAiRequest(request(validBody()), res, { env: {}, generateText });

    expect(res.statusCode).toBe(503);
    expect(res.payload).toEqual({ error: "ai_not_configured" });
    expect(generateText).not.toHaveBeenCalled();
  });

  it("preserves request validation before calling Gemini", async () => {
    const res = response();
    const generateText = vi.fn();

    await handleAiRequest(request(validBody({ kind: "admin" })), res, {
      env: { GEMINI_API_KEY: "test-key" },
      generateText,
    });

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ error: "invalid_kind" });
    expect(generateText).not.toHaveBeenCalled();
  });

  it("returns Gemini text through the existing browser contract", async () => {
    const res = response();
    const generateText = vi.fn().mockResolvedValue("Gemini response");

    await handleAiRequest(request(validBody(), { ip: "127.0.0.3" }), res, {
      env: {
        GEMINI_API_KEY: "test-key",
        GEMINI_FAST_MODEL: "gemini-fast",
        GEMINI_FALLBACK_MODEL: "gemini-fallback",
      },
      generateText,
    });

    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({ text: "Gemini response" });
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: "test-key",
      fastModel: "gemini-fast",
      fallbackModel: "gemini-fallback",
      messages: validBody().messages,
      maxOutputTokens: 1500,
    }));
    expect(generateText.mock.calls[0][0].systemInstruction).toContain("Waey");
  });

  it("maps Gemini throttling to 429", async () => {
    const res = response();
    const generateText = vi.fn().mockRejectedValue(Object.assign(new Error("quota"), { status: 429 }));

    await handleAiRequest(request(validBody(), { ip: "127.0.0.4" }), res, {
      env: { GEMINI_API_KEY: "test-key" },
      generateText,
    });

    expect(res.statusCode).toBe(429);
    expect(res.payload).toEqual({ error: "rate_limited" });
    expect(res.headers["Retry-After"]).toBe("30");
  });

  it("maps other Gemini failures to a generic upstream error", async () => {
    const res = response();
    const generateText = vi.fn().mockRejectedValue(Object.assign(new Error("provider detail"), { status: 500 }));

    await handleAiRequest(request(validBody(), { ip: "127.0.0.5" }), res, {
      env: { GEMINI_API_KEY: "test-key" },
      generateText,
    });

    expect(res.statusCode).toBe(502);
    expect(res.payload).toEqual({ error: "upstream_error" });
  });
});
