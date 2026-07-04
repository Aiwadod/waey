/**
 * Design-time landing image generator for Waey.
 *
 * Generates the four AI landing photos with Gemini 2.5 Flash Image ("Nano Banana"),
 * converts them to .webp, and writes them under public/images/landing/.
 *
 * This is a BUILD-TIME / DESIGN-TIME script only. It is never imported by the app,
 * never runs in the browser, and never bundles the key. Run it locally, then commit
 * the generated .webp files.
 *
 *   Windows PowerShell:  $env:GEMINI_API_KEY="..."; node scripts/generate-landing-images.mjs
 *   bash:                GEMINI_API_KEY=... node scripts/generate-landing-images.mjs
 *
 * Get a key at https://aistudio.google.com/apikey (free tier includes image gen).
 * Do NOT commit the key; do NOT put it in any VITE_* variable.
 */
import { GoogleGenAI } from "@google/genai";
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
  "Avoid entirely: gibberish text, fake app words, any on-screen UI text, distorted hands, extra fingers, " +
  "brand logos, bank card logos, watermarks, dark cyberpunk lighting, cold blue tones, Western corporate stock-photo look.";

const IMAGES = [
  {
    file: "waey-hero-student-phone.webp",
    aspect: "3:4",
    width: 1200,
    prompt:
      "A Saudi university student sitting in a bright, sunlit Jeddah campus cafe, holding a modern smartphone " +
      "up toward the camera. The phone screen is BLANK and softly glowing (no text, no UI) — leave it clean so " +
      "real interface art can be composited on top later. Warm morning light, plants and light wood cafe interior, " +
      "friendly confident expression. " + STYLE + " " + NEGATIVE,
  },
  {
    file: "waey-campus-budgeting.webp",
    aspect: "3:2",
    width: 1400,
    prompt:
      "Two or three Saudi university students studying together at a light campus table with phones and a laptop, " +
      "a relaxed student-finance and budgeting mood, notebooks and coffee, bright daylight through large windows. " +
      "All screens are blank/soft-glow with no readable text. " + STYLE + " " + NEGATIVE,
  },
  {
    file: "waey-cafe-insight.webp",
    aspect: "3:2",
    width: 1400,
    prompt:
      "A single Saudi university student in a warm daylit cafe, calmly reviewing their spending insights on a " +
      "smartphone held in both hands, a thoughtful satisfied expression. Premium fintech editorial framing, " +
      "warm bokeh background. The phone screen is blank/soft-glow, no readable text. " + STYLE + " " + NEGATIVE,
  },
  {
    file: "waey-university-dashboard.webp",
    aspect: "16:9",
    width: 1600,
    prompt:
      "A bright, modern Saudi university administration or student-services office environment, warm daylight, " +
      "clean desks with laptops and large monitors, a professional reviewing anonymized analytics. All screens " +
      "are blank/soft-glow with NO readable UI text (real dashboard cards will be composited later). " + STYLE + " " + NEGATIVE,
  },
];

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(
      "\n  Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in the environment.\n" +
        "  PowerShell:  $env:GEMINI_API_KEY=\"...\"; node scripts/generate-landing-images.mjs\n" +
        "  bash:        GEMINI_API_KEY=... node scripts/generate-landing-images.mjs\n",
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const ai = new GoogleGenAI({ apiKey });

  for (const img of IMAGES) {
    process.stdout.write(`Generating ${img.file} (${img.aspect}) ... `);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: img.prompt,
      config: { imageConfig: { aspectRatio: img.aspect } },
    });

    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart) {
      console.log("FAILED (no image returned)");
      const textPart = parts.find((p) => p.text);
      if (textPart) console.log("   model said:", textPart.text.slice(0, 200));
      continue;
    }

    const raw = Buffer.from(imagePart.inlineData.data, "base64");
    const webp = await sharp(raw)
      .resize({ width: img.width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(path.join(OUT_DIR, img.file), webp);
    console.log(`ok (${Math.round(webp.length / 1024)} KB)`);
  }

  console.log(`\nDone. Wrote images to ${OUT_DIR}\n  Review them, then: git add public/images/landing && git commit -m "assets: add AI landing imagery"`);
}

main().catch((err) => {
  console.error("Generation failed:", err?.message || err);
  process.exit(1);
});
