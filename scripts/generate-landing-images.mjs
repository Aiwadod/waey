/**
 * Design-time landing image generator for Waey.
 *
 * Generates the four AI landing photos, converts them to .webp, and writes them
 * under public/images/landing/. This is a BUILD-TIME / DESIGN-TIME script only —
 * never imported by the app, never run in the browser, never bundling a key.
 * Run it locally, then commit the generated .webp files.
 *
 *   npm run gen:images
 *
 * Providers (auto-selected):
 *   - Default: Pollinations.ai (FLUX) — FREE, no API key, no billing.
 *   - If GEMINI_API_KEY is set: Google Gemini 2.5 "Nano Banana" (needs billing on the
 *     Google project; the free tier's image quota is 0 and returns HTTP 429).
 *       PowerShell:  $env:GEMINI_API_KEY="..."; npm run gen:images
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "landing");

const STYLE =
  "Photorealistic warm light editorial photograph. Saudi university student, Jeddah campus atmosphere, " +
  "modest contemporary clothing, natural daylight, premium student fintech mood, cream and beige light palette, " +
  "soft violet and terracotta accents, shallow depth of field, cinematic but bright and airy.";

const NEGATIVE =
  " Avoid entirely: gibberish text, fake app words, any on-screen UI text, distorted hands, extra fingers, " +
  "brand logos, bank card logos, watermarks, dark cyberpunk lighting, cold blue tones, Western corporate stock-photo look.";

const IMAGES = [
  {
    file: "waey-hero-student-phone.webp",
    w: 900,
    h: 1200,
    seed: 41,
    prompt:
      "A Saudi university student sitting in a bright, sunlit Jeddah campus cafe, holding a modern smartphone " +
      "up toward the camera. The phone screen is BLANK and softly glowing, no text and no UI. Warm morning light, " +
      "plants and light wood cafe interior, friendly confident expression. " + STYLE + NEGATIVE,
  },
  {
    file: "waey-campus-budgeting.webp",
    w: 1200,
    h: 800,
    seed: 42,
    prompt:
      "Two or three Saudi university students studying together at a light campus table with phones and a laptop, " +
      "a relaxed student-finance and budgeting mood, notebooks and coffee, bright daylight through large windows. " +
      "All screens are blank with no readable text. " + STYLE + NEGATIVE,
  },
  {
    file: "waey-cafe-insight.webp",
    w: 1200,
    h: 800,
    seed: 43,
    prompt:
      "A single Saudi university student in a warm daylit cafe, calmly reviewing something on a smartphone held in " +
      "both hands, a thoughtful satisfied expression. Premium fintech editorial framing, warm bokeh background. " +
      "The phone screen is blank, no readable text. " + STYLE + NEGATIVE,
  },
  {
    file: "waey-university-dashboard.webp",
    w: 1280,
    h: 720,
    seed: 44,
    prompt:
      "A bright, modern Saudi university student-services office, warm daylight, clean desks with laptops and " +
      "large monitors, a professional reviewing analytics. All screens are blank with no readable UI text. " + STYLE + NEGATIVE,
  },
];

async function fetchWithRetry(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180000), headers: { accept: "image/*" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000) throw new Error(`suspiciously small (${buf.length} bytes)`);
      return buf;
    } catch (e) {
      lastErr = e;
      process.stdout.write(`retry ${i + 1} … `);
    }
  }
  throw lastErr;
}

async function pollinations(img) {
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(img.prompt)}` +
    `?width=${img.w}&height=${img.h}&nologo=true&model=flux&enhance=true&seed=${img.seed}`;
  return fetchWithRetry(url);
}

async function gemini(img, apiKey) {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });
  const aspect = img.w > img.h ? (Math.abs(img.w / img.h - 16 / 9) < 0.2 ? "16:9" : "3:2") : "3:4";
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: img.prompt,
    config: { imageConfig: { aspectRatio: aspect } },
  });
  const part = (response?.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData?.data);
  if (!part) throw new Error("no image returned");
  return Buffer.from(part.inlineData.data, "base64");
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const useGemini = Boolean(apiKey);
  console.log(`Provider: ${useGemini ? "Gemini 2.5 Flash Image (Nano Banana)" : "Pollinations.ai (FLUX, free)"}\n`);

  await mkdir(OUT_DIR, { recursive: true });
  let ok = 0;
  for (const img of IMAGES) {
    process.stdout.write(`Generating ${img.file} (${img.w}x${img.h}) ... `);
    try {
      const raw = useGemini ? await gemini(img, apiKey) : await pollinations(img);
      const webp = await sharp(raw).resize({ width: img.w, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      await writeFile(path.join(OUT_DIR, img.file), webp);
      console.log(`ok (${Math.round(webp.length / 1024)} KB)`);
      ok++;
    } catch (e) {
      console.log(`FAILED: ${String(e?.message || e).slice(0, 120)}`);
    }
  }
  console.log(`\n${ok}/${IMAGES.length} written to ${OUT_DIR}`);
  if (ok) console.log(`Review, then: git add public/images/landing && git commit -m "assets: add AI landing imagery"`);
}

main().catch((err) => {
  console.error("Generation failed:", err?.message || err);
  process.exit(1);
});
