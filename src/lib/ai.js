const VENDOR_HOSTS = ["generativelanguage.googleapis.com", "api.anthropic.com", "api.openai.com"];

export async function callConfiguredAi({ endpoint, fetcher = fetch, payload, signal }) {
  const cleanEndpoint = String(endpoint ?? "").trim();
  if (!cleanEndpoint || isVendorEndpoint(cleanEndpoint)) return null;

  const response = await fetcher(cleanEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
    signal,
  });

  if (!response?.ok) return null;
  const data = await response.json();
  return extractText(data);
}

export function isVendorEndpoint(endpoint) {
  try {
    const url = new URL(endpoint, "http://waey.local");
    return VENDOR_HOSTS.includes(url.hostname);
  } catch {
    return true;
  }
}

function extractText(data) {
  if (typeof data?.text === "string") return data.text.trim() || null;
  if (typeof data?.content === "string") return data.content.trim() || null;
  if (Array.isArray(data?.content)) {
    const text = data.content
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n")
      .trim();
    return text || null;
  }
  return null;
}
