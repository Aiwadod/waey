import { GoogleGenAI } from "@google/genai";

const DEFAULT_FAST_MODEL = "gemini-2.5-flash";

export function isGeminiRateLimitError(error) {
  return Number(error?.status ?? error?.code) === 429;
}

function isRetriableModelError(error) {
  const status = Number(error?.status ?? error?.code);
  return status === 404 || status >= 500;
}

function isAbortError(error, signal) {
  return signal?.aborted || error?.name === "AbortError";
}

export async function generateGeminiText({
  apiKey,
  fastModel = DEFAULT_FAST_MODEL,
  fallbackModel,
  systemInstruction,
  messages,
  maxOutputTokens,
  signal,
  createClient = (key) => new GoogleGenAI({ apiKey: key }),
}) {
  const client = createClient(apiKey);
  const models = [...new Set([fastModel || DEFAULT_FAST_MODEL, fallbackModel].filter(Boolean))];
  const contents = messages.map(({ role, content }) => ({
    role: role === "assistant" ? "model" : "user",
    parts: [{ text: content }],
  }));

  let lastError;
  for (let index = 0; index < models.length; index += 1) {
    try {
      const response = await client.models.generateContent({
        model: models[index],
        contents,
        config: {
          systemInstruction,
          maxOutputTokens,
          abortSignal: signal,
        },
      });
      const text = typeof response?.text === "string" ? response.text.trim() : "";
      return text || null;
    } catch (error) {
      lastError = error;
      const hasFallback = index < models.length - 1;
      if (!hasFallback || isAbortError(error, signal) || isGeminiRateLimitError(error) || !isRetriableModelError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}
