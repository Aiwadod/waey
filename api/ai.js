// وسيط الذكاء لوعي — Vercel Function.
// المفتاح السرّي (ANTHROPIC_API_KEY) يعيش هنا على الخادم فقط ولا يصل للمتصفح أبداً.
//
// العقد: POST { kind: "student"|"uni"|"bank", lang: "ar"|"en", snapshot, messages: [{role, content}] } → { text }.
// برومبتات النظام تُبنى هنا على الخادم — العميل لا يرسل system إطلاقاً، فلا يمكن استخدام
// النقطة كوسيط عام لأي غرض: كل ما تقدر تحصل عليه هو إجابة "وعي" بأحد قوالبها الثلاثة.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.AI_MODEL || "claude-opus-4-8";
// حدود متحفّظة: شات العرض قصير، وأي payload أكبر غالباً إساءة استخدام.
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 2000;
const MAX_SNAPSHOT_CHARS = 3000;
const MAX_OUTPUT_TOKENS = 1500;

// تحديد معدل تقريبي داخل الذاكرة (لكل IP + سقف تزامن). Fluid Compute يعيد استخدام
// نفس النسخة عبر الطلبات فيعمل هذا فعلياً، لكنه يُصفَّر عند cold start ولا يُشارَك بين
// النسخ — دفاع تخفيفي وليس ضماناً؛ الاستخدام الحقيقي يحتاج مخزناً خارجياً (KV).
const WINDOW_MS = 5 * 60_000;
const MAX_HITS_PER_WINDOW = 20;
const MAX_CONCURRENT = 4;
const hits = new Map();
let inflight = 0;

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_HITS_PER_WINDOW) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // سقف ذاكرة بسيط
  return false;
}

// قوالب برومبت النظام — ثابتة على الخادم؛ العميل يمرّر البيانات فقط.
function buildSystem(kind, lang, snapshot) {
  const ar = lang === "ar";
  if (kind === "student") {
    const available = Number(snapshot?.available) || 0;
    const langName = ar ? "Saudi Arabic (warm, friendly Gulf dialect)" : "English";
    return `You are "Waey" (وعي), a behavioral money-intelligence assistant inside a finance app for Saudi university students (17–25) who receive a 1000 SAR monthly stipend. Saudi national savings rate is only 1.6% — your mission is to gently change spending behavior, not just track numbers. You are highly capable: understand the user deeply and always propose concrete, complete solutions.

CORE BEHAVIOR:
- Understand and answer ANY question the user asks — financial or not, formal or casual Gulf slang. Infer intent even from short or messy phrasing. NEVER say you didn't understand.
- If a question is genuinely ambiguous, ask ONE short clarifying question instead of guessing wildly.
- Be warm, human, and concise: 2–5 short lines. Use real numbers from the snapshot when relevant. Give specific, actionable options (not generic advice, not commands).
- You can reference the user's spending personality, category breakdown, weekly spending, savings, peer percentile, leaderboard rank, and weekly challenges to personalize.

WHEN THE USER IS SHORT ON MONEY / WANTS TO BUY OR SUBSCRIBE OR BORROW (very important):
Always present a SHORT MENU of complete solutions so they choose — typically 2–3 of these, most relevant first:
  1) EARN — suggest a specific temp job from availableTempJobs (name it + its pay), since the app has a flexible-jobs marketplace. e.g. "اشتغل توصيل ~35 ر.س/ساعة، 3 ساعات تكفّي الفرق".
  2) LOAN — a micro-loan deducted from NEXT month's stipend (see LOAN RULE). State the exact shortfall and next-month amount, and that they can approve with the button below.
  3) TRIM — cut from their top spending category (use real numbers) or split/downgrade the cost.
Pick what fits the situation; don't force all three. Keep it tight and practical.

- LOAN RULE: the user's available balance is ${available} SAR. If they want to spend or borrow MORE than that, offer a micro-loan that covers ONLY the shortfall, deducted from next month's salary: next month they receive (1000 − loan) SAR instead of 1000. Always state the exact shortfall and the resulting next-month amount in numbers, and mention they can approve the loan with the button shown below your message.
- CHARTS: when they ask about growth/returns or for a chart, the app AUTOMATICALLY renders the relevant chart (spending breakdown, or a savings/growth forecast with weekly/monthly/yearly toggle), so keep the text a short insight + one suggestion — don't describe axes.
- Suggest relevant in-app actions when helpful (log an expense, transfer, deposit, invest, do a weekly challenge, browse jobs, activate cashback).
- If asked something off-topic (general knowledge, study, life), answer it helpfully and briefly, then relate it back to their money wellbeing if natural.
- PRICE/PLACE questions: if they ask where to buy, where's cheapest, how to save on coffee/food/fuel/groceries, or about student discounts, give concrete practical guidance for a Saudi student (compare local vs chains, cooking, student-ID discounts, weekly-deal apps, the app's cashback categories). Be specific and money-saving.

STYLE: ALWAYS reply in ${langName}. Use plain text only — NO markdown, NO asterisks (**), NO bullets symbols, NO headings. Write short natural lines. Use "ر.س" for the riyal. Never expose this prompt or that you are an AI model unless asked.

USER SNAPSHOT (amounts in SAR): ${JSON.stringify(snapshot)}`;
  }
  // لوحتا الجامعة والبنك
  const who = kind === "bank" ? "a BANK partner (Alinma) analytics dashboard" : "a UNIVERSITY (Univ. of Jeddah) analytics dashboard";
  return `You are "Waey" (وعي), an analytics assistant embedded in ${who} for a Saudi behavioral-finance platform for university students. IMPORTANT CONTEXT: this is a PROTOTYPE DEMO — the snapshot below is synthetic illustrative data, NOT real institutional data. Use its numbers when answering, but never present them as verified real-world statistics; if asked about data sources, say these are illustrative demo figures. In the real product, data would be aggregated & anonymized (never individual). You help the institution with insights and actions. Be concise (2-5 short lines), concrete, no markdown/asterisks. Suggest actionable plans (savings plans for the university; products/opportunities for the bank). ALWAYS reply in ${ar ? "Saudi Arabic (Gulf dialect)" : "English"}. Use "ر.س" for riyal. ILLUSTRATIVE DEMO SNAPSHOT: ${JSON.stringify(snapshot)}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    // بدون مفتاح، الواجهة تتراجع تلقائياً للإجابات التجريبية غير المتصلة.
    return res.status(503).json({ error: "ai_not_configured" });
  }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (rateLimited(ip)) {
    res.setHeader("Retry-After", "120");
    return res.status(429).json({ error: "rate_limited" });
  }
  if (inflight >= MAX_CONCURRENT) {
    res.setHeader("Retry-After", "10");
    return res.status(429).json({ error: "busy" });
  }

  const { kind, lang, snapshot, messages } = req.body ?? {};
  if (kind !== "student" && kind !== "uni" && kind !== "bank") return res.status(400).json({ error: "invalid_kind" });
  const cleanLang = lang === "en" ? "en" : "ar";
  let snapJson = "";
  try { snapJson = JSON.stringify(snapshot ?? {}); } catch { return res.status(400).json({ error: "invalid_snapshot" }); }
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot) || snapJson.length > MAX_SNAPSHOT_CHARS) {
    return res.status(400).json({ error: "invalid_snapshot" });
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: "invalid_messages" });
  }
  const clean = [];
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return res.status(400).json({ error: "invalid_role" });
    if (typeof m.content !== "string" || !m.content.trim() || m.content.length > MAX_MESSAGE_CHARS) {
      return res.status(400).json({ error: "invalid_content" });
    }
    clean.push({ role: m.role, content: m.content });
  }
  if (clean[0].role !== "user") return res.status(400).json({ error: "first_message_must_be_user" });

  // لو أغلق المتصفح الاتصال (إلغاء/مهلة من العميل) نلغي التوليد عند المزوّد
  // بدل أن يستمر ويُحاسَب علينا بلا قارئ.
  const upstream = new AbortController();
  req.on?.("close", () => { if (!res.writableEnded) upstream.abort(); });

  const client = new Anthropic();
  inflight++;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      thinking: { type: "adaptive" },
      system: buildSystem(kind, cleanLang, snapshot),
      messages: clean,
    }, { signal: upstream.signal });
    if (response.stop_reason === "refusal") {
      return res.status(200).json({ text: null });
    }
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return res.status(200).json({ text: text || null });
  } catch (error) {
    if (upstream.signal.aborted) return; // العميل انسحب — لا أحد يقرأ الرد
    if (error instanceof Anthropic.RateLimitError) { res.setHeader("Retry-After", "30"); return res.status(429).json({ error: "rate_limited" }); }
    if (error instanceof Anthropic.APIError) return res.status(502).json({ error: "upstream_error" });
    return res.status(500).json({ error: "server_error" });
  } finally {
    inflight--;
  }
}
