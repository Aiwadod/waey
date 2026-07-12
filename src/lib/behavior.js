// Waey behavioral-finance engine — the single, testable source of truth for the
// research-led journey. Pure data + functions (no React, no import.meta), so
// vitest can exercise the scoring and plan logic directly.
//
// Method (from the reference assessment, remixed-a42aaa1f.tsx):
//   Phase 1 — Klontz et al. (2011) money scripts: 10 items over 4 dimensions.
//   Phase 2 — COM-B (Michie et al., 2011): 6 items over capability/opportunity/motivation.
//   Dominant Klontz dimension → financial personality type.
//   Weakest COM-B dimension → the main behaviour-change obstacle (the lever).
//
// The question texts and 5-point scale are taken verbatim from the reference file;
// English strings, the Financial Fitness formula, the 30-day plan, and the
// gamification thresholds are Waey's own design (documented in
// docs/requirements/research-led-user-journey-upgrade.md), grounded in the same models.

/* ------------------------------- questions ------------------------------- */

export const KLONTZ_QUESTIONS = [
  { id: "k1", dim: "avoidance", ar: "أتجنب مراجعة رصيدي أو حسابي البنكي لفترات طويلة", en: "I avoid checking my balance or bank account for long stretches" },
  { id: "k2", dim: "avoidance", ar: "أؤجل التعامل مع أموري المالية (فواتير، ميزانية) لآخر لحظة", en: "I put off dealing with my finances (bills, budgeting) until the last minute" },
  { id: "k3", dim: "status", ar: "أشتري أشياء معينة لأظهر بمظهر لائق أمام أصدقائي", en: "I buy certain things to look good in front of my friends" },
  { id: "k4", dim: "status", ar: "أشعر بضغط لمواكبة أسلوب حياة من حولي حتى لو تجاوزت ميزانيتي", en: "I feel pressure to keep up with the lifestyle around me, even beyond my budget" },
  { id: "k5", dim: "status", ar: "قيمتي كشخص ترتبط بشكل ما بما أملكه من أغراض", en: "My worth as a person is tied somehow to the things I own" },
  { id: "k6", dim: "worship", ar: "أشتري أشياء لم أخطط لها بدافع اللحظة", en: "I buy things I hadn't planned on, on impulse" },
  { id: "k7", dim: "worship", ar: "أنفق فجأة عندما أشعر بالتوتر أو الحزن لأشعر بتحسّن", en: "I spend suddenly when I feel stressed or sad, to feel better" },
  { id: "k8", dim: "worship", ar: "أعتقد أن امتلاك مزيد من المال سيحل معظم مشاكلي", en: "I believe having more money would solve most of my problems" },
  { id: "k9", dim: "vigilance", ar: "أراجع مصاريفي بانتظام وأعرف أين يذهب كل ريال", en: "I review my spending regularly and know where every riyal goes" },
  { id: "k10", dim: "vigilance", ar: "أفضّل الادخار على الإنفاق حتى لو كان بإمكاني الشراء", en: "I prefer saving over spending, even when I could buy" },
];

export const COMB_QUESTIONS = [
  { id: "c1", dim: "capability", ar: "أعرف كيف أسوي ميزانية شهرية بسيطة", en: "I know how to make a simple monthly budget" },
  { id: "c2", dim: "capability", ar: "أفرّق بوضوح بين مصاريفي الأساسية ومصاريف الكماليات", en: "I clearly tell the difference between my essential spending and my extras" },
  { id: "c3", dim: "opportunity", ar: "محيطي (أصدقائي وعائلتي) يشجعني على الادخار لا الصرف", en: "The people around me (friends and family) encourage me to save, not spend" },
  { id: "c4", dim: "opportunity", ar: "عندي طريقة سهلة أتابع فيها مصروفي يومياً", en: "I have an easy way to track my spending daily" },
  { id: "c5", dim: "motivation", ar: "أشعر بحافز حقيقي إني أوصل لهدف مالي واضح", en: "I feel real motivation to reach a clear financial goal" },
  { id: "c6", dim: "motivation", ar: "أصدق إن قراراتي المالية الحين تؤثر على مستقبلي فعلاً", en: "I truly believe my money decisions now affect my future" },
];

export const CHOICES = [
  { v: 1, ar: "لا أتفق إطلاقاً", en: "Strongly disagree" },
  { v: 2, ar: "لا أتفق", en: "Disagree" },
  { v: 3, ar: "محايد", en: "Neutral" },
  { v: 4, ar: "أتفق", en: "Agree" },
  { v: 5, ar: "أتفق تماماً", en: "Strongly agree" },
];

export const KLONTZ_LABELS = {
  avoidance: { ar: "تجنب المال", en: "Money Avoidance" },
  status: { ar: "المكانة المالية", en: "Money Status" },
  worship: { ar: "العبادة المالية", en: "Money Worship" },
  vigilance: { ar: "اليقظة المالية", en: "Money Vigilance" },
};

export const COMB_LABELS = {
  capability: { ar: "القدرة", en: "Capability" },
  opportunity: { ar: "الفرصة", en: "Opportunity" },
  motivation: { ar: "الدافع", en: "Motivation" },
};

/* ------------------------------ type content ----------------------------- */
// Names align with the reference material's fallback names and the results
// screenshot ("المتجنب المالي / Money Avoider").

export const TYPE_META = {
  avoidance: {
    ar: "المتجنّب المالي", en: "Money Avoider",
    summary: { ar: "تميل لتأجيل مواجهة أموالك، ما يصعّب عليك التخطيط ويجعلك تكتشف المشاكل متأخراً.", en: "You tend to put off facing your money, which makes planning harder and means you spot problems late." },
    strength: { ar: "قلة الإنفاق الاندفاعي مقارنة بغيرك.", en: "Less impulsive spending than most." },
    risk: { ar: "تراكم المصاريف والديون دون متابعة.", en: "Bills and debts piling up unwatched." },
  },
  status: {
    ar: "الباحث عن المكانة", en: "Status Seeker",
    summary: { ar: "إنفاقك متأثر بصورتك أمام الآخرين، وقد يدفعك لتجاوز ميزانيتك لمجاراة محيطك.", en: "Your spending is shaped by your image with others, which can push you past your budget to keep up." },
    strength: { ar: "طموح واهتمام بالصورة والتقديم.", en: "Ambition and attention to how you present." },
    risk: { ar: "إنفاق أعلى من الدخل لمجاراة الأقران.", en: "Spending above income to match peers." },
  },
  worship: {
    ar: "المنفق اللحظي", en: "Impulsive Spender",
    summary: { ar: "تربط المال بالراحة الفورية، فتنفق بدافع اللحظة أكثر من التخطيط المسبق.", en: "You link money to instant comfort, so you spend in the moment more than by plan." },
    strength: { ar: "تفاؤل وقدرة على الاستمتاع باللحظة.", en: "Optimism and the ability to enjoy the moment." },
    risk: { ar: "قرارات شراء سريعة تحت تأثير المزاج.", en: "Fast buying decisions driven by mood." },
  },
  vigilance: {
    ar: "المخطّط الحذر", en: "Vigilant Planner",
    summary: { ar: "منضبط ومتابع لأمورك المالية بدقة، وقد تميل أحياناً للقلق الزائد من الإنفاق.", en: "You're disciplined and precise with your money — sometimes prone to over-worrying about spending." },
    strength: { ar: "انضباط عالٍ وقدرة قوية على الادخار.", en: "High discipline and strong saving ability." },
    risk: { ar: "قلق مالي زائد أو حرمان النفس دون داعٍ.", en: "Excess money anxiety or needless self-denial." },
  },
};

/* ------------------------------ gap content ------------------------------ */
// The weakest COM-B dimension is the behaviour-change lever; each carries an
// explanation, a weekly AI-coach note, and a first mission.

export const GAP_META = {
  capability: {
    label: COMB_LABELS.capability,
    explanation: { ar: "تحتاج أدوات ومعرفة عملية أكثر من الحماس أو التذكير.", en: "You need practical tools and know-how more than motivation or reminders." },
    coachNote: { ar: "هذا الأسبوع نركّز على تعلّم مهارة مالية واحدة بسيطة بدل محاولة تغيير كل شي مرة واحدة.", en: "This week we focus on learning one simple money skill instead of trying to change everything at once." },
    mission: { ar: "اكتب ميزانيتك لهذا الأسبوع في ٣ بنود فقط: أساسيات، ادخار، مصروف شخصي.", en: "Write this week's budget in just 3 lines: essentials, savings, personal spending." },
  },
  opportunity: {
    label: COMB_LABELS.opportunity,
    explanation: { ar: "تعرف وتبي، لكن بيئتك وعاداتك اليومية ما تسهّل عليك الالتزام.", en: "You know and you want to, but your environment and daily habits don't make it easy to stick with." },
    coachNote: { ar: "هذا الأسبوع نبسّط بيئتك المالية بخطوة عملية واحدة تقلل قرارات الإنفاق اليومية.", en: "This week we simplify your money environment with one practical step that cuts daily spending decisions." },
    mission: { ar: "فعّل تذكيراً يومياً بسيطاً لتسجيل مصروفك قبل النوم.", en: "Set a simple daily reminder to log your spending before bed." },
  },
  motivation: {
    label: COMB_LABELS.motivation,
    explanation: { ar: "تعرف وتقدر، لكن الحافز الحقيقي للاستمرار لسا ضعيف.", en: "You know and you can, but the real drive to keep going is still weak." },
    coachNote: { ar: "هذا الأسبوع نربط هدفك المالي بشي ملموس يهمك شخصياً، مو رقم مجرد.", en: "This week we tie your financial goal to something concrete you personally care about, not just a number." },
    mission: { ar: "اكتب هدفاً مالياً واحداً صغيراً تحققه خلال ٧ أيام واحتفل فيه لما توصله.", en: "Write one small financial goal to hit in 7 days, and celebrate when you reach it." },
  },
};

export const TIP = { ar: "ابدأ بخطوة واحدة صغيرة هذا الأسبوع بدل تغيير كل شي مرة واحدة.", en: "Start with one small step this week instead of changing everything at once." };

/* ------------------------------- 30-day plan ----------------------------- */
// A four-week plan keyed by the weakest COM-B gap (the behaviour lever),
// escalating from awareness to a durable habit.

export const PLANS = {
  capability: [
    { title: { ar: "أساسيات الميزانية", en: "Budget basics" }, task: { ar: "قسّم دخلك على ٣ بنود: أساسيات، ادخار، رغبات.", en: "Split your income into 3 buckets: essentials, savings, wants." } },
    { title: { ar: "تتبّع يومي", en: "Daily tracking" }, task: { ar: "سجّل كل مصروف لمدة أسبوع بدون حكم على نفسك.", en: "Log every expense for a week — no judgment." } },
    { title: { ar: "احتياج أم رغبة", en: "Need vs want" }, task: { ar: "صنّف كل مشترياتك: ضروري أو كمالي، قبل الشراء.", en: "Label each purchase need or want, before buying." } },
    { title: { ar: "ميزانية شهرية", en: "A monthly budget" }, task: { ar: "ابنِ ميزانية شهر كامل بناءً على أرقامك الحقيقية.", en: "Build a full monthly budget from your real numbers." } },
  ],
  opportunity: [
    { title: { ar: "عادة التسجيل", en: "The logging habit" }, task: { ar: "فعّل تذكيراً يومياً وسجّل مصروفك قبل النوم.", en: "Set a daily reminder and log your spending before bed." } },
    { title: { ar: "ادخار تلقائي", en: "Automate savings" }, task: { ar: "حوّل مبلغ ادخارك تلقائياً أول ما يجيك الدخل.", en: "Auto-move your savings the moment income arrives." } },
    { title: { ar: "قلّل الاحتكاك", en: "Cut the friction" }, task: { ar: "ألغِ اشتراكاً ما تستخدمه، وضع حدّاً لطلبات التوصيل.", en: "Cancel one unused subscription and cap your delivery orders." } },
    { title: { ar: "بيئة داعمة", en: "A supportive setup" }, task: { ar: "رتّب محيطك: قائمة تسوّق ثابتة وقاعدة انتظار قبل الشراء.", en: "Shape your environment: a fixed shopping list and a wait-before-buying rule." } },
  ],
  motivation: [
    { title: { ar: "هدف ملموس", en: "A concrete goal" }, task: { ar: "اكتب هدفاً مالياً واحداً يهمك، ولماذا يهمك.", en: "Write one financial goal that matters to you, and why." } },
    { title: { ar: "اربطه بمستقبلك", en: "Tie it to your future" }, task: { ar: "تخيّل نفسك بعد سنة وقد حققت هذا الهدف.", en: "Picture yourself a year from now, goal achieved." } },
    { title: { ar: "انتصارات صغيرة", en: "Small wins" }, task: { ar: "حقّق ادخاراً صغيراً هذا الأسبوع واحتفل به.", en: "Hit a small saving this week and celebrate it." } },
    { title: { ar: "التزام مستمر", en: "Lasting commitment" }, task: { ar: "راجع تقدمك واضبط هدفك للشهر القادم.", en: "Review your progress and set next month's goal." } },
  ],
};

/* ------------------------------- levels ---------------------------------- */

export const LEVELS = [
  { key: "bronze", ar: "برونزي", en: "Bronze", min: 0 },
  { key: "silver", ar: "فضّي", en: "Silver", min: 40 },
  { key: "gold", ar: "ذهبي", en: "Gold", min: 70 },
  { key: "elite", ar: "النخبة", en: "Elite", min: 90 },
];

export function levelFor(fitness) {
  const f = clamp(Number(fitness) || 0, 0, 100);
  let out = LEVELS[0];
  for (const lvl of LEVELS) if (f >= lvl.min) out = lvl;
  return out;
}

/* ------------------------------- scoring --------------------------------- */

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
// Map a 1..5 Likert answer to a 0..100 percentage (1→0, 3→50, 5→100).
function pct5(v) { return (clamp(Number(v) || 1, 1, 5) - 1) / 4 * 100; }

// Average the answers of each dimension for a question set. Missing answers
// default to the neutral midpoint (3) so a skipped item never crashes scoring.
export function scoreDimensions(answers, questions) {
  const groups = {};
  for (const q of questions) {
    const v = answers[q.id] == null ? 3 : answers[q.id];
    (groups[q.dim] ||= []).push(clamp(Number(v) || 3, 1, 5));
  }
  const out = {};
  for (const dim of Object.keys(groups)) {
    const arr = groups[dim];
    out[dim] = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
  }
  return out;
}

export function dominantType(klontz) {
  const order = ["avoidance", "status", "worship", "vigilance"];
  return order.reduce((best, d) => ((klontz[d] ?? 0) > (klontz[best] ?? 0) ? d : best), order[0]);
}

export function weakestGap(comb) {
  const order = ["capability", "opportunity", "motivation"];
  return order.reduce((worst, d) => ((comb[d] ?? 5) < (comb[worst] ?? 5) ? d : worst), order[0]);
}

// Financial Fitness (0-100): 60% "healthy money scripts" + 40% "COM-B readiness".
// Vigilance is protective; avoidance/status/worship are risks scored as their inverse.
export function financialFitness(klontz, comb) {
  const vig = pct5(klontz.vigilance), avo = pct5(klontz.avoidance), sta = pct5(klontz.status), wor = pct5(klontz.worship);
  const health = vig * 0.4 + (100 - avo) * 0.2 + (100 - sta) * 0.2 + (100 - wor) * 0.2;
  const readiness = (pct5(comb.capability) + pct5(comb.opportunity) + pct5(comb.motivation)) / 3;
  return clamp(Math.round(health * 0.6 + readiness * 0.4), 0, 100);
}

// Daily tracking nudges Financial Fitness: a committed day lifts it, a missed
// day dips it — bounded, so the score drifts with real behaviour, not fabricated.
export function nextFitness(current, committed) {
  const f = clamp(Number(current) || 0, 0, 100);
  return clamp(committed ? f + 2 : f - 1, 0, 100);
}

/* ------------------------------- budget ---------------------------------- */
// A suggested monthly split for a limited student income; adjusted by type.

export function budgetFor(type) {
  const rows = [
    { key: "essentials", cat: { ar: "الأساسيات", en: "Essentials" }, pct: 45, note: { ar: "سكن، مواصلات، طعام", en: "Housing, transport, food" } },
    { key: "savings", cat: { ar: "الادخار", en: "Savings" }, pct: 25, note: { ar: "تحويل تلقائي فور الاستلام", en: "Auto-transfer on payday" } },
    { key: "wants", cat: { ar: "الرغبات", en: "Wants" }, pct: 20, note: { ar: "ترفيه ومشتريات شخصية", en: "Fun & personal purchases" } },
    { key: "emergency", cat: { ar: "الطوارئ", en: "Emergency" }, pct: 10, note: { ar: "صندوق طوارئ منفصل", en: "A separate emergency fund" } },
  ];
  if (type === "vigilance") { rows[1].pct = 30; rows[2].pct = 15; }
  if (type === "worship") { rows[2].note = { ar: "مع قاعدة انتظار 24 ساعة قبل الشراء", en: "With a 24-hour wait rule before buying" }; }
  return rows;
}

/* ------------------------------- analyze --------------------------------- */
// One call turns raw answers (+ monthly income) into the full journey profile
// used by the results screen, the dashboard, and the progress page.

export function analyze(answers, monthlyIncome = 1000) {
  const klontz = scoreDimensions(answers, KLONTZ_QUESTIONS);
  const comb = scoreDimensions(answers, COMB_QUESTIONS);
  const type = dominantType(klontz);
  const gap = weakestGap(comb);
  const fitness = financialFitness(klontz, comb);
  const budget = budgetFor(type);
  const savingsPct = budget.find((b) => b.key === "savings").pct;
  const monthlyGoal = Math.round((Number(monthlyIncome) || 1000) * savingsPct / 100);
  const answeredCount = KLONTZ_QUESTIONS.concat(COMB_QUESTIONS).filter((q) => answers[q.id] != null).length;
  return {
    klontz, comb, type, gap, fitness,
    monthlyGoal,
    dailyTarget: Math.max(1, Math.round(monthlyGoal / 30)),
    plan: PLANS[gap],
    budget,
    answeredCount,
    totalQ: KLONTZ_QUESTIONS.length + COMB_QUESTIONS.length,
    // Deterministic, model-based analysis text (used offline; an AI endpoint may
    // replace `summary`/`coachNote`/`mission` when configured).
    analysis: {
      type: TYPE_META[type],
      strength: TYPE_META[type].strength,
      risk: TYPE_META[type].risk,
      summary: TYPE_META[type].summary,
      gap: GAP_META[gap],
      tip: TIP,
    },
  };
}
