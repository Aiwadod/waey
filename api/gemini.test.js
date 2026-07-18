import { describe, expect, it, vi } from "vitest";
import { generateGeminiText, isGeminiRateLimitError } from "./gemini.js";

function clientWith(generateContent) {
  return () => ({ models: { generateContent } });
}

describe("Gemini server adapter", () => {
  it("converts Waey messages and forwards server-only generation config", async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: "  live reply  " });
    const controller = new AbortController();

    const text = await generateGeminiText({
      apiKey: "test-key",
      fastModel: "gemini-fast",
      fallbackModel: "gemini-fallback",
      systemInstruction: "Waey system prompt",
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi" },
      ],
      maxOutputTokens: 1500,
      signal: controller.signal,
      createClient: clientWith(generateContent),
    });

    expect(text).toBe("live reply");
    expect(generateContent).toHaveBeenCalledWith({
      model: "gemini-fast",
      contents: [
        { role: "user", parts: [{ text: "Hello" }] },
        { role: "model", parts: [{ text: "Hi" }] },
      ],
      config: {
        systemInstruction: "Waey system prompt",
        maxOutputTokens: 1500,
        abortSignal: controller.signal,
      },
    });
  });

  it("normalizes a blank Gemini response to null", async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: "   " });

    await expect(generateGeminiText({
      apiKey: "test-key",
      messages: [{ role: "user", content: "Hello" }],
      createClient: clientWith(generateContent),
    })).resolves.toBeNull();
  });

  it("uses a distinct fallback model after a retriable primary failure", async () => {
    const generateContent = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error("unavailable"), { status: 503 }))
      .mockResolvedValueOnce({ text: "fallback reply" });

    const text = await generateGeminiText({
      apiKey: "test-key",
      fastModel: "gemini-fast",
      fallbackModel: "gemini-fallback",
      messages: [{ role: "user", content: "Hello" }],
      createClient: clientWith(generateContent),
    });

    expect(text).toBe("fallback reply");
    expect(generateContent.mock.calls.map(([request]) => request.model)).toEqual([
      "gemini-fast",
      "gemini-fallback",
    ]);
  });

  it("does not retry throttled or aborted requests", async () => {
    for (const error of [
      Object.assign(new Error("quota"), { status: 429 }),
      Object.assign(new Error("aborted"), { name: "AbortError" }),
    ]) {
      const generateContent = vi.fn().mockRejectedValue(error);

      await expect(generateGeminiText({
        apiKey: "test-key",
        fastModel: "gemini-fast",
        fallbackModel: "gemini-fallback",
        messages: [{ role: "user", content: "Hello" }],
        createClient: clientWith(generateContent),
      })).rejects.toBe(error);

      expect(generateContent).toHaveBeenCalledTimes(1);
    }
  });

  it("classifies Gemini quota errors", () => {
    expect(isGeminiRateLimitError({ status: 429 })).toBe(true);
    expect(isGeminiRateLimitError({ code: "429" })).toBe(true);
    expect(isGeminiRateLimitError({ status: 500 })).toBe(false);
  });
});
