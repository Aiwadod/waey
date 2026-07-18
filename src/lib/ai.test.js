import { describe, expect, it, vi } from "vitest";
import { callConfiguredAi, isVendorEndpoint } from "./ai.js";

describe("AI endpoint boundary", () => {
  it("does not call a vendor API when no endpoint is configured", async () => {
    const fetcher = vi.fn();

    await expect(callConfiguredAi({ endpoint: "", fetcher, payload: {} })).resolves.toBeNull();

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("calls only the configured first-party endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "hello" }),
    });

    const text = await callConfiguredAi({
      endpoint: "/api/waey-ai",
      fetcher,
      payload: { messages: [] },
    });

    expect(text).toBe("hello");
    expect(fetcher).toHaveBeenCalledWith(
      "/api/waey-ai",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("blocks direct Gemini vendor endpoints from the browser", () => {
    expect(isVendorEndpoint("https://generativelanguage.googleapis.com/v1beta/models/gemini:generateContent")).toBe(true);
    expect(isVendorEndpoint("https://generativelanguage.googleapis.com./v1beta/models/gemini:generateContent")).toBe(true);
  });
});
