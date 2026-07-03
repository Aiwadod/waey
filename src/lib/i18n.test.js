import { describe, expect, it } from "vitest";
import {
  applyLanguageMetadata,
  translateSystemMessages,
} from "./i18n.js";

const messages = {
  ar: { hello: "Arabic hello" },
  en: { hello: "English hello" },
};

describe("language metadata and chat translation", () => {
  it("syncs document language, direction, and title", () => {
    applyLanguageMetadata("en", document);

    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.title).toContain("Waey");

    applyLanguageMetadata("ar", document);

    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("translates keyed system messages while preserving user text", () => {
    const next = translateSystemMessages(
      [
        { role: "assistant", key: "hello", text: "Arabic hello" },
        { role: "user", text: "do not translate me" },
        { role: "assistant", text: "custom assistant text" },
      ],
      "en",
      messages,
    );

    expect(next).toEqual([
      { role: "assistant", key: "hello", text: "English hello" },
      { role: "user", text: "do not translate me" },
      { role: "assistant", text: "custom assistant text" },
    ]);
  });
});
