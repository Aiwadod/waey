# Waey landing imagery

AI-generated, warm light-first, editorial photos used on the marketing landing page.

Generate them at design time (never from the browser app, never with a committed key):

```bash
# PowerShell
$env:GEMINI_API_KEY="..."; npm run gen:images
# bash
GEMINI_API_KEY=... npm run gen:images
```

`npm run gen:images` runs `scripts/generate-landing-images.mjs` (Gemini 2.5 "Nano Banana"),
converts the output to `.webp`, and writes the four files below into this folder. Review, then commit them.

> Note: Gemini image generation requires **billing enabled** on the Google Cloud / AI Studio
> project — the free tier's image quota is 0. A free key authenticates but returns HTTP 429.

Expected files (the app references these exact names; a warm-mesh fallback renders until they exist):

| File | Use |
|---|---|
| `waey-hero-student-phone.webp` | First-viewport hero — Saudi student holding a phone (blank/glowing screen; real Waey loading UI is overlaid in React). `fetchpriority="high"`. |
| `waey-campus-budgeting.webp` | Bento tile — students studying together, budgeting mood. |
| `waey-cafe-insight.webp` | Bento tile — student reviewing spending insights in a cafe. |
| `waey-university-dashboard.webp` | Partner band — university/admin environment (real dashboard cards overlaid in React). |
