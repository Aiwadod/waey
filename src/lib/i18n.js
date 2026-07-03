export const LANGUAGE_META = {
  ar: {
    lang: "ar",
    dir: "rtl",
    title: "\u0648\u0639\u064a | Waey - \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0633\u0644\u0648\u0643\u064a \u0627\u0644\u0645\u0627\u0644\u064a",
  },
  en: {
    lang: "en",
    dir: "ltr",
    title: "Waey | Behavioral Money Intelligence",
  },
};

export function applyLanguageMetadata(lang, doc = document) {
  const meta = LANGUAGE_META[lang] ?? LANGUAGE_META.ar;
  doc.documentElement.lang = meta.lang;
  doc.documentElement.dir = meta.dir;
  doc.title = meta.title;
}

export function translateSystemMessages(messages, lang, dictionary) {
  return messages.map((message) => {
    if (!message.key) return message;
    const text = dictionary?.[lang]?.[message.key];
    return text ? { ...message, text } : message;
  });
}
