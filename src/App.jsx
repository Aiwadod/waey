import { Fragment, useState, useEffect, useRef, createContext, useContext } from "react";
import { callConfiguredAi } from "./lib/ai.js";
import { applyAcceptedSpend, evaluateSpend } from "./lib/finance.js";
import { applyLanguageMetadata, translateSystemMessages } from "./lib/i18n.js";
import { resolveInitialScreen, sanitizeScreen, screenForHash, SCREEN_HASHES } from "./lib/routing.js";
import { clearSession, createGuestSession, createLoginSession, loadSession, saveScreen, saveSession } from "./lib/session.js";
import {
  Home, BarChart3, Sparkles, TrendingUp, Bell, Plus, ChevronLeft, ChevronRight, Wallet, Trophy,
  Users, Target, BookOpen, HelpCircle, Coins, Send, Sun, Moon, Bus, Gamepad2, Coffee,
  MoreHorizontal, FlaskConical, LayoutGrid, ArrowLeftRight, ArrowDownToLine, Gift, Percent,
  MapPin, Clock, Store, ChevronDown, Globe, Check, Users2, BarChart2, Crown, LogOut, Tag, Brain, Zap, ArrowRight, ArrowLeft,
  Flame, Heart, TriangleAlert, Lock, Landmark, Headphones, Film, Banknote, Tent, Bike,
  Laptop, Palette, Camera, School, Fuel, ShoppingCart, Pill, Lightbulb, Briefcase,
  GraduationCap, Building2, Medal, CircleDollarSign, Search, Utensils,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedNumber from "./components/motion/AnimatedNumber.jsx";
import ScreenTransition from "./components/motion/ScreenTransition.jsx";
import ScrollReveal from "./components/motion/ScrollReveal.jsx";
import WaeyFlowField from "./components/motion/WaeyFlowField.jsx";
import LandingImage from "./components/LandingImage.jsx";
import { easeOut, hoverLift, pressProps, revealContainer, revealItem, sheetVariants, toastVariants, viewportOnce } from "./motion/presets.js";
import { useGsap } from "./motion/gsap.js";

const LANDING_IMG = `${import.meta.env.BASE_URL}images/landing/`;

/*  وعي (Waey) — تطبيق الوعي المالي لطلاب الجامعات
    متجاوب لكل الأجهزة · عربي/إنجليزي · ألوان المسابقة: كحلي #002134 / بنفسجي #8685D8 / تراكوتا #CA6C46  */

const STIPEND = 1000, SPENDABLE = 800, WEEK_LIMIT = 200;
const fmt = (n) => new Intl.NumberFormat("en-US").format(Math.round(n));

const themes = {
  dark: {
    page: "radial-gradient(120% 80% at 50% 0%, #0A2233 0%, #00121C 60%)",
    bg0: "#00121C", bg1: "#002134", card: "#072A3D", card2: "#0B3346",
    line: "rgba(255,255,255,0.08)", text: "#FFFFFF", textSoft: "#E8F0F4", muted: "#7E97A6",
    accent: "#8685D8", accentText: "#A8A6F2", onAccent: "#0A1822",
    terra: "#CA6C46", terraText: "#E08A63", onTerra: "#FFFFFF", green: "#5FCB8E",
    inputBg: "rgba(255,255,255,0.05)", statusText: "#FFFFFF", bezel1: "#04161F", bezel2: "#0A2A3D",
    shadow: "0 24px 70px -48px rgba(0,0,0,0.9)",
  },
  light: {
    page: "radial-gradient(120% 80% at 50% 0%, #FFFFFF 0%, #ECEAE3 70%)",
    bg0: "#F1EFE9", bg1: "#FFFFFF", card: "#FFFFFF", card2: "#F5F3EE",
    line: "rgba(0,33,52,0.10)", text: "#0F2230", textSoft: "#243744", muted: "#6A7884",
    accent: "#6F6DD0", accentText: "#5F5DBE", onAccent: "#FFFFFF",
    terra: "#C2603A", terraText: "#A84E2C", onTerra: "#FFFFFF", green: "#2E9E68",
    inputBg: "#F1EFE9", statusText: "#0F2230", bezel1: "#DAD7CF", bezel2: "#C7C3BA",
    shadow: "0 24px 70px -48px rgba(15,34,48,0.45)",
  },
};

function IconBubble({ icon: Icon, color, bg, size = 22, box = 46, radius = 14 }) {
  return (
    <div style={{ width: box, height: box, borderRadius: radius, background: bg, color, display: "grid", placeItems: "center", flexShrink: 0 }}>
      <Icon size={size} color={color} aria-hidden="true" />
    </div>
  );
}

function InlineIcon({ icon: Icon, color, size = 15 }) {
  return <Icon size={size} color={color} aria-hidden="true" style={{ flexShrink: 0 }} />;
}

function PrivacyNote({ children, c, style }) {
  return (
    <div style={{ background: c.card2, border: `1px dashed ${c.line}`, borderRadius: 16, padding: 14, fontSize: 12, color: c.textSoft, lineHeight: 1.7, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center", ...style }}>
      <Lock size={15} color={c.accentText} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/* ===================== الترجمة ===================== */
const L = {
  ar: {
    brand: "وعــــــي", name: "وَدود", handle: "@wadod · جامعة جدة",
    nav: { home: "الرئيسية", analytics: "التحليلات", ai: "وعي", invest: "الاستثمار", more: "المزيد" },
    pts: "نقطة",
    stats: { adhere: "التزام", level: "المستوى", streak: "يوم متتالي" },
    balance: "رصيد الحساب", transfer: "تحويل", deposit: "إيداع", invest: "استثمار",
    friends: "الأصدقاء", online: "متّصل", keepUp: "واصل!", keepUpSub: "35 يوم بدون تجاوز ميزانيتك",
    weekly: "مصاريف أسابيع الشهر", tapWeek: "اضغط أسبوع للتفاصيل", week: (n) => `أسبوع ${n}`,
    leftSpend: "متبقّي للصرف", canSave: "ممكن توفّر",
    weekOrd: ["الأول", "الثاني", "الثالث", "الرابع"],
    weekDetails: (o) => `تفاصيل الأسبوع ${o}`, weekLimit: "حد الأسبوع",
    leftOfLimit: (x) => `باقي ${fmt(x)} من حد الأسبوع`, noExpenses: "لا توجد مصاريف في هذا الأسبوع بعد",
    today: "اليوم", now: "الآن", yourLoc: "موقعك الحالي",
    cats: { food: "مشروبات وأطعمة", transport: "مواصلات", fun: "ترفيه", other: "غير ذلك", transfer: "تحويل", topup: "إيداع" },
    analytics: "التحليلات", seg: ["يومي", "أسبوعي", "شهري"], totalSavings: "إجمالي المدّخرات", thisTerm: "هذا الفصل",
    income: "الدخل", monthlyStipend: "مكافأة شهرية", remaining: "المتبقّي", onTrack: "ضمن الخطة", over: "تجاوزت",
    whereSpent: (x) => `أين صرفت ${x}`, recent: "آخر العمليات",
    logExpense: "سجّل مصروف", everyRiyal: "كل ريال له سبب — هذا جوهر الوعي", amount: "المبلغ", reason: "السبب…", log: "تسجيل",
    badAmount: "اكتب مبلغ صحيح", askReason: "وش سبب الصرف؟", logged: (x) => `سُجّل · باقي ${fmt(x)} ر.س`,
    askWaey: "اسأل وعي", advisorSub: "مستشارك المالي · يعرف وضعك الحالي",
    hello: "هلا وَدود، أنا وعي، ذكاؤك المالي السلوكي. أحلّل شخصيتك الإنفاقية وأساعدك تغيّر عاداتك — مكافأتك 1,000 ر.س. اسألني أي شي: حلّل شخصيتي، وزّع مكافأتي، أو أبي أوفّر وأستثمر.",
    chips: ["وزّع لي المكافأة", "ارسم توقّع ادخاري", "وين راحت فلوسي؟", "أبي أستلف 500 ومعي 200"], msgPlaceholder: "اكتب لوعي…",
    portfolio: "محفظتك الاستثمارية", expRet: (x) => `عائد متوقّع +25% سنوياً ← ${x} ر.س`,
    journey: "رحلتك الجامعية", goal: "الهدف", now2: "الآن", suggested: "فرص مقترحة لك", inYear: (x) => `بعد سنة ≈ ${x} ر.س`, investBtn: "استثمر",
    invested: (x) => `استثمرت ${fmt(x)} ر.س`, tooMuch: "المبلغ أكبر من مدّخراتك",
    more: "المزيد", waeyPoints: "نقاط وعي", offers: "عروض حصرية", getIt: "احصل عليه", offerOn: "تم تفعيل العرض",
    pointsStore: "متجر النقاط", redeem: "استبدال", redeemed: (t) => `استبدلت «${t}»`, noPoints: "نقاطك ما تكفي بعد",
    settings: "الإعدادات", demoBtn: "محاكاة عملية دفع (تجريبي)", demoSub: "جرّب كيف يطلب وعي تصنيف كل عملية",
    appearance: "المظهر", dark: "الداكن", light: "الفاتح", language: "اللغة",
    learn: "تعلّم الإدارة المالية", help: "المساعدة", helpSoon: "مركز المساعدة قريباً",
    paidNow: (x) => `دفعت ${x} ر.س للتو`, categorize: "ساعدني أصنّفها — وش نوع الصرف؟", typeCat: "اكتب نوع الصرف…", confirm: "تأكيد",
    categorized: (x, l) => `صنّفنا ${fmt(x)} ر.س · ${l} (+5 نقاط)`,
    transferT: "تحويل", yourBal: (x) => `رصيدك ${x} ر.س`, sendNow: "تحويل الآن", sent: (x, to) => `حوّلت ${fmt(x)} ر.س لـ ${to}`, noBal: "الرصيد لا يكفي",
    people: ["أحمد", "سارة", "والدتي", "حساب آخر"],
    depositT: "إيداع", addFunds: "أضف رصيد لحسابك", deposited: (x) => `أودعت ${fmt(x)} ر.س`,
    loanTitle: "مصروفك يتجاوز المتاح", approve: "موافق، اعتمد القرض", noAdjust: "لا، بعدّل صرفي", loanDone: (x) => `اعتمد قرض ${fmt(x)} ر.س`,
    portfolioGrowth: "نمو المحفظة خلال 12 شهر", howSaveMore: "كيف توفّر أكثر:", disclaimer: "* أرقام تقديرية للتوضيح، العوائد غير مضمونة.",
    persona: "شخصيتك المالية", personaBy: "حلّلها وعي بالذكاء الاصطناعي السلوكي", reanalyze: "حلّل من جديد",
    personalities: [
      { name: "منفق اجتماعي", icon: Users2, desc: "أغلب صرفك مع الأصدقاء والمناسبات", traits: ["مطاعم", "ترفيه", "مناسبات"] },
      { name: "منفق عاطفي", icon: Heart, desc: "تصرف أكثر وقت التوتر أو الفرح", traits: ["تسوّق مزاجي", "قهوة", "حلويات"] },
      { name: "منفق اندفاعي", icon: Zap, desc: "قرارات شراء سريعة بدون تخطيط", traits: ["عروض", "إلكترونيات", "توصيل"] },
    ],
    peer: "مقارنتك مع أقرانك", peerDesc: "مقارنة مجهولة — بدون أي بيانات شخصية", peerLine: (p) => `تدّخر أكثر من ${p}% من طلاب جدة بفئتك`, peerYou: "أنت",
    challenges: "تحديات الأسبوع", challengesSub: "مخصّصة لشخصيتك المالية", chProgress: (a, b) => `${a}/${b} مكتمل`,
    challengeList: [{ t: "لا تطلب توصيل طعام 3 أيام", pts: 50 }, { t: "ادّخر 50 ر.س هذا الأسبوع", pts: 40 }, { t: "سجّل كل مصاريفك 5 أيام", pts: 30 }],
    chDoneMsg: (p) => `أحسنت! +${p} نقطة`,
    leader: "لوحة الالتزام", leaderSub: "التنافس على الالتزام لا على المبالغ · خصوصيتك محفوظة", commit: "التزام",
    stuPrefix: "طالب#", lbMetric: "حسب نسبة إكمال التحديات", periodW: "أسبوعي", periodM: "شهري", viewAll: "عرض اللوحة كاملة",
    yourRank: "ترتيبك", ofN: (n) => `من ${n}`, lbGap: (d, r) => `يفصلك ${d}% عن المركز ${r}`, lbTop: "أنت في الصدارة!", chDoneLabel: "تحديات",
    periodY: "سنوي", projTitle: "توقّع الادخار والنمو", breakdownTitle: "توزيع صرفك حسب الفئة",
    projW: (v) => `وفّر 50 ر.س أسبوعياً (قهوة أقل) → خلال شهرين ~${fmt(v)} ر.س.`,
    projM: (v) => `حوّل 200 ر.س ادخار أول كل شهر مع استثمار ~10% → بعد سنة ~${fmt(v)} ر.س.`,
    projY: (v) => `استمر على 200 ر.س شهرياً مستثمرة → عند التخرّج (4 سنوات) ~${fmt(v)} ر.س.`,
    jobsTitle: "وظائف مؤقتة · دخل إضافي", jobsSub: "اشتغل وقت فراغك وادّخر من دخلك", jobsPageSub: "وعي يدّخر لك 20% من كل دخل تلقائياً",
    jobAvg: "متوسط دخل الطلاب على وعي ~600 ر.س/شهر", jobApply: "اشتغلها", jobEarned: (p, sv) => `كسبت ${fmt(p)} ر.س · ادّخرنا لك ${fmt(sv)} ر.س`,
    jobDetails: "التفاصيل", jobAbout: "عن الوظيفة", jobReqs: "المتطلبات", jobHow: "طريقة التقديم", jobLoc: "الموقع", jobSlots: (n) => `${n} مقاعد متاحة`,
    jobSteps: ["أكمل ملفك (الاسم · الجامعة · التخصص)", "أرفق سيرتك أو نماذج أعمالك", "أرسل الطلب — يصلك رد خلال 48 ساعة"],
    jobApplyNow: "قدّم الآن", jobApplied: "تم إرسال طلبك، بنوافيك خلال 48 ساعة", jobBack: "رجوع للوظائف",
    roundTitle: "كنز الفكّة", roundSub: "نقرّب كل عملية ونوفّر الباقي تلقائياً",
    roundGoal: "الهدف: توفير بدون ما تحس — لوقت الزنقة",
    roundHowTitle: "كيف يشتغل؟", roundExA: "تدفع 5.40 ر.س", roundExB: "نسحب 6.00 ر.س", roundExC: "0.60 ر.س تروح لكنزك",
    roundWhy: "الفكّة الصغيرة تتجمّع بدون ما تأثر عليك، وبوقت الحاجة تلقى مبلغ جاهز ادّخرته بنفسك.",
    roundOn: "مفعّل", roundCollected: "تجمّع لك", roundMult: "مضاعف التقريب", roundConvert: "حوّل للادخار",
    roundConverted: (x) => `حوّلنا ${fmt(x)} ر.س فكّة لمدّخراتك`, roundEmpty: "ما تجمّع فكّة بعد — اصرف وبتشوفها تكبر",
    roundAdded: (x) => `+${x.toFixed(2)} ر.س فكّة`,
    cashOffersSub: "العروض المتاحة في هذه الفئة", cashOffersList: "العروض المتاحة", cashOffersCount: "عروض", 
    as: {
      introTitle: ["اكتشف لماذا تنفق — مو بس كم تنفق", "أجب أسئلة بسيطة ← اكتشف شخصيتك ← احصل على قرارك", "بياناتك آمنة — ما نحتاج حساب بنكي"],
      introSub: ["وعي يفهم سلوكك المالي قبل ما يوجّهك", "أقل من 3 دقائق وتطلع تعرف نفسك مالياً", "كل البيانات تدخلها أنت، ولا نشاركها أبداً"],
      next: "التالي", start: "ابدأ التجربة",
      profileTitle: "عرّفنا على نفسك", profileSub: "معلومات سريعة تساعد وعي يفهمك",
      age: "العمر", uni: "الجامعة", city: "المدينة", income: "الدخل الشهري", source: "مصدر الدخل", goal: "هدفك المالي",
      ages: ["18–21", "22–24", "25+"], unis: ["جامعة جدة", "جامعة الملك عبدالعزيز", "أخرى"], cities: ["جدة", "الرياض", "الدمام", "أخرى"],
      incomes: [["<1000", "أقل من 1000"], ["1000-2000", "1000–2000"], ["2000-4000", "2000–4000"], [">4000", "أكثر من 4000"]],
      sources: ["مكافأة", "الأهل", "عمل جزئي", "راتب"], goals: ["ادخار", "تقليل إنفاق", "فهم سلوكي"],
      continue: "متابعة", qOf: (a, b) => `سؤال ${a} من ${b}`,
      analyzing: "وَعي يحلّل سلوكك المالي…",
      yourPersona: "شخصيتك المالية", dna: "الحمض السلوكي", dnaPlanning: "التخطيط", dnaSocial: "الاجتماعي", dnaEmotional: "العاطفي", dnaImpulsive: "الاندفاع",
      awareness: "درجة وعيك المالي", confidence: "ثقة الذكاء", seeDecision: "شوف قرارك المالي",
      decisionTitle: "قرارك المالي", decisionText: (x) => `تقدر تحوّل ${fmt(x)} ر.س هذا الشهر للادخار بدون ما تغيّر نمط حياتك`,
      decisionHow: "كيف؟ بتعديل بسيط في عاداتك الأكثر صرفاً", challengeTitle: "تحدّيك الأسبوعي", points: "نقطة وعي", acceptCh: "قبلت التحدي، ابدأ",
      retake: "أعد التقييم", skip: "تجاوز",
      betterThan: (p) => `أنت أفضل في التخطيط من ${p}% من الطلاب`,
      identity: "تعرّف على هويتك المالية", meetJourney: "أكمل رحلتك",
    },
    splash: { tagline: "ابنِ عادات مالية أفضل", start: "ابدأ" },
    calc: {
      title: "حاسبة الاستثمار", sub: "ازرع بذرة اليوم تكسب ثمرتها بالغد",
      portfolio: "نوع المحفظة", portfolios: ["هادئة", "متوازنة", "نشطة"],
      savings: "مبلغ البداية", monthly: "الدفعة الشهرية", years: "المدة",
      yearsUnit: (n) => `${n} سنة`, withWaey: "استثمارك مع وعي", noInvest: "ادخار بدون استثمار",
      afterYears: (n) => `بعد ${n} سنة`, result: "النتيجة المتوقّعة", note: "أرقام تقديرية للتوعية — ليست وعداً بعائد",
      diff: "الفرق لصالحك",
    },
    coach: {
      title: "مدرّب وعي", sub: "اختر ما تحتاجه أو اسأل أي شيء",
      analyze: "حلّل سلوكي", save: "ساعدني أوفّر", explain: "فسّر درجتي", suggest: "اقترح تحدّي",
      analyzeR: "شخصيتك المالية اجتماعية-مخطّطة: تخطّط قبل الشراء لكن الإنفاق الاجتماعي يرتفع بالإجازات. ركّز على ميزانية أسبوعية للخروجات.",
      saveR: "قلّل صرف المطاعم 80 ر.س هذا الأسبوع → توفير محتمل 320 ر.س/شهر. فعّل كنز الفكّة عشان يدّخر تلقائياً.",
      explainR: ["تخطيط ممتاز قبل الشراء", "عادة ادخار جيدة", "إنفاق عاطفي في الإجازات"],
      suggestR: "تحدّي هذا الأسبوع: لا مطاعم بعد 8 مساءً لمدة 3 أيام → +5 نقاط. بسيط ويصنع فرق.",
      askMore: "أو اكتب سؤالك بالأسفل",
    },
    awarenessTitle: "درجة وعيك المالي", dnaTitle: "الحمض السلوكي", aiConf: "ثقة الذكاء",
    insightTitle: "رؤية اليوم من وعي", insightText: "صرفت على القهوة 3 مرات هالأسبوع — لو نزّلتها مرتين توفّر ~35 ر.س. جرّب تحدّي اليوم",
    progTitle: "تقدّمك", progWeeks: "الأسابيع", progChDone: "تحديات مكتملة", progScoreUp: "نمو الدرجة", progWeekLabel: (n) => `أسبوع ${n}`,
    rewardsTitle: "مكافآتك", rewLevel: "المستوى", rewBadges: "الشارات", rewFuture: "قريباً: مكافآت إنماء (Future Alinma Rewards)",
    badgeNames: ["أول تحدّي", "موفّر", "منتظم 7 أيام", "مستثمر مبتدئ"],
    plat: {
      title: "منصة وعي", sub: "مو مجرد تطبيق — منصة ذكاء سلوكي مالي بثلاث واجهات",
      tagline: "وعي طبقة سلوكية (Behavior Layer) بين الطالب والجامعة والبنك",
      archTitle: "المعمارية", layer: "طبقة الواجهات الآمنة (Secure APIs)",
      nodeStudent: "تطبيق الطالب", nodeUni: "بوابة الجامعة", nodeBank: "لوحة البنك",
      engBehavior: "محرك السلوك", engAI: "محرك الذكاء", engAnalytics: "محرك التحليلات",
      pStudent: "الطالب", pStudentD: "يجيب الأسئلة → يحصل على الحمض السلوكي، درجة الوعي، المدرّب، والتحدي. بدون حساب بنكي في الـMVP.",
      pUni: "جامعة جدة", pUniD: "شريك مؤسسي: تطلق البرنامج، وتتابع المشاركة والوعي — كله مجهّل بدون أفراد.",
      pBank: "بنك الإنماء", pBankD: "يحصل على تحليلات سلوكية مجمّعة فقط (أكثر الشخصيات، متوسط الوعي) لتصميم منتجات الشباب — بدون بيانات فردية.",
      uniDash: "لوحة الجامعة (عرض)", uniStudents: "طلاب مشاركون", uniAwareness: "متوسط الوعي المالي", uniComplete: "إكمال التحديات",
      bankDash: "لوحة البنك (عرض)", bankTopPersona: "أكثر شخصية انتشاراً", bankAvgAware: "متوسط الوعي", bankTopCh: "أنجح تحدّي", bankAnon: "كل البيانات مجمّعة ومجهّلة الهوية",
      apisTitle: "طبقة الـ APIs (خارطة التوسّع)", apiMock: "Mock",
      apis: [["AI API", "يعيد الحمض السلوكي للطالب"], ["University API", "التحقق من الجامعة والكلية (مستقبلاً)"], ["Alinma API", "العمليات والادخار — بعد موافقة المستخدم"], ["Analytics API", "تجميع بيانات مجهّلة للوحات"]],
      legalTitle: "الالتزام القانوني", legal: "أي تكامل مع الأنظمة البنكية يتم فقط بعد موافقة المستخدم ووفق متطلبات الجهات التنظيمية عبر واجهات رسمية. بيانات الاستخدام والتحليل تبقى مجهّلة الهوية.",
      enter: "استعرض المنصة (للمحكّمين)",
    },
    role: {
      title: "من أنت؟", sub: "وعي منصة بثلاث واجهات — اختر تجربتك",
      student: "طالب", studentD: "جرّب التقييم السلوكي، المدرّب، والتحديات",
      uni: "جامعة جدة", uniD: "لوحة المشاركة والوعي — بيانات مجهّلة",
      bank: "بنك الإنماء", bankD: "تحليلات سلوكية مجمّعة لتصميم منتجات الشباب",
      enter: "ادخل", back: "تغيير الدور",
    },
    dash: {
      period: ["أسبوع", "شهر", "فصل"],
      tabsUni: ["نظرة عامة", "الشخصيات", "التحديات", "الكليات"],
      tabsBank: ["نظرة عامة", "الشخصيات", "العادات", "الفرص"],
      college: "الكلية", allColleges: "كل الكليات",
      colleges: ["الحاسب", "الهندسة", "إدارة الأعمال", "الطب", "العلوم"],
      participation: "المشاركة", awareness: "متوسط الوعي", completion: "إكمال التحديات", activeUsers: "مستخدمون نشطون",
      personaMix: "توزيع الشخصيات المالية", tapForDetail: "اضغط للتفاصيل ←",
      chTitle: "التحديات الأكثر نجاحاً", chAccept: "نسبة القبول", chDone: "نسبة الإكمال",
      collegeTitle: "الوعي حسب الكلية", students: "طالب",
      habitsTitle: "أكثر العادات السلبية", oppTitle: "فرص للبنك", ageGroup: "الفئة العمرية",
      trend: "الاتجاه", growth: "النمو", vs: "مقابل الفصل السابق",
      detailFor: (n) => `تفاصيل: ${n}`, share: "من الطلاب", back: "رجوع",
      anon: "كل البيانات مجمّعة ومجهّلة الهوية — بدون أي معلومة فردية",
      insightUni: "معدل الوعي ارتفع 6% بعد إطلاق التحديات الأسبوعية.",
      insightBank: "62% من الطلاب يصرفون على القهوة يومياً — فرصة لمنتج ادخار تلقائي.",
      opps: [["منتج ادخار تلقائي للشباب", "استهداف 62% يصرفون يومياً على القهوة"], ["بطاقة طلابية بمكافآت سلوكية", "تحفيز الالتزام المالي"], ["حملة توعية بالتقسيط", "48% يشترون بالاندفاع عند الخصومات"], ["برنامج أول راتب", "جيل يتخرج بعادات مالية صحية"]],
      spendHeat: "خريطة الإنفاق (يوم × فئة)", days: ["سبت", "أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"],
      catFood: "طعام", catTrans: "تنقل", catFun: "ترفيه", catShop: "تسوّق", catBills: "فواتير",
      ranking: "ترتيب الجامعات", byMetric: "حسب", rankSavings: "الادخار", rankEngage: "التفاعل", rankAware: "الوعي",
      region: "المنطقة", allRegions: "كل المناطق", regions: ["مكة", "الرياض", "الشرقية"],
      savedTotal: "إجمالي المدخرات", avgSave: "متوسط الادخار/طالب", invPart: "مشاركة الاستثمار", litScore: "درجة الثقافة المالية",
      wellness: "مؤشر الصحة المالية", wellLow: "منخفض", wellMid: "متوسط", wellHigh: "مرتفع",
      unitK: "ألف", unitM: "مليون", uniList: ["جامعة جدة", "الملك عبدالعزيز", "أم القرى", "الملك سعود", "الإمام", "الملك فهد للبترول"],
    },
    cashTitle: "كاش باك وعروض", cashSub: "استرجع جزء من مصاريفك اليومية", cashPageSub: "فعّل فئاتك واسترجع كاش باك مع كل عملية",
    cashEarned: "كاش باك هذا الشهر", cashActivate: "تفعيل", cashActive: "مفعّل", cashOn: "تم تفعيل الكاش باك", backWord: "كاش باك",
    mk: {
      home: "الرئيسية", about: "عن وعي", login: "تسجيل الدخول", start: "ابدأ الآن", openApp: "افتح التطبيق",
      heroTitle: "وعيك المالي يبدأ من الجامعة",
      heroSub: "منصة ذكاء سلوكي تحوّل مصاريفك اليومية إلى عادات ادخار ذكية — تجربة مثل Duolingo لكن للمال.",
      ctaPrimary: "ابدأ مجاناً", ctaSecondary: "عندي حساب",
      pillarsTitle: "أربعة محاور تغيّر علاقتك بالمال",
      pillars: [
        { icon: Brain, t: "محرك الشخصية الإنفاقية", d: "يحدّد نمطك المالي من أول استخدام: اجتماعي، عاطفي، أو اندفاعي." },
        { icon: Users2, t: "المقارنة المجهولة", d: "اعرف أين أنت مقارنة بطلاب مدينتك — بدون أي بيانات شخصية." },
        { icon: Target, t: "تحديات أسبوعية مخصّصة", d: "مبنية على شخصيتك تحديداً، ترفع وعيك المالي تدريجياً." },
        { icon: Trophy, t: "لوحة الالتزام", d: "نافس على إتمام التحديات لا على المبالغ — خصوصيتك محفوظة." },
      ],
      stats: [{ v: "1.6%", l: "معدل ادخار السعوديين" }, { v: "2.2M", l: "طالب جامعي سنوياً" }, { v: "2030", l: "داعم لرؤية المملكة" }],
      howTitle: "كيف يشتغل وعي؟",
      steps: [
        { t: "حلّل شخصيتك", d: "وعي يقرأ نمط صرفك ويحدّد شخصيتك المالية." },
        { t: "تابع وأكمل", d: "تحديات أسبوعية ونقاط تبني عاداتك خطوة بخطوة." },
        { t: "نافس وادّخر", d: "تصدّر لوحة الالتزام وحوّل توفيرك إلى استثمار." },
      ],
      ctaTitle: "جاهز تغيّر علاقتك بالمال؟", ctaBtn: "ابدأ الآن مجاناً",
      rights: "© 2026 وعي · نموذج أولي",
      problemTitle: "المشكلة", problemText: "معدل ادخار السعوديين 1.6% فقط — أدنى معدل بين دول G20. وهذه ليست مشكلة دخل، بل مشكلة سلوك. يدخل 2.2 مليون طالب سنوياً أول تجربة مالية مستقلة بلا أي أداة تساعدهم يفهمون كيف يفكّرون في المال.",
      solutionTitle: "الحل", solutionText: "وعي منصة ذكاء سلوكي تحوّل بياناتك المالية اليومية إلى رؤى عملية تغيّر طريقة تفكيرك في المال — لا مجرد تتبّع أرقام.",
      visionTitle: "الرؤية", whyTitle: "لماذا الآن", whyText: "كل طالب يستخدم وعي اليوم هو عميل واعٍ ومستقر غداً — استثمار استراتيجي في جيل كامل قبل أي منافس.",
      lgTitle: "تسجيل الدخول", lgSub: "ادخل لحسابك في وعي", lgId: "البريد أو رقم الجوال", lgPass: "كلمة المرور",
      lgBtn: "دخول", lgGuest: "الدخول كضيف", lgNo: "ما عندك حساب؟", lgSignup: "أنشئ حساب", lgBack: "رجوع للرئيسية", lgOut: "تسجيل الخروج",
    },
    leaderRows: [{ h: "طالب#A12", pct: 94 }, { h: "طالب#K77", pct: 90 }, { you: true, pct: 85 }, { h: "طالب#M03", pct: 81 }, { h: "طالب#R56", pct: 78 }],
    about: "عن وعي", aboutMission: "نرفع وعي جيل كامل بالمال — تجربة مثل Duolingo لكن للمال.", aboutStat: "معدل ادخار السعوديين 1.6% فقط — وعي يغيّر السلوك من الجامعة، دعماً لرؤية 2030.", aboutPartner: "شريك استراتيجي مقترح: بنك إنماء",
    plus: "وعي بلس", plusSub: "افتح التحليل السلوكي المتقدم والتحديات الحصرية", plusPrice: "20 ر.س / شهر", upgrade: "ترقية", plusDone: "أهلاً بك في وعي بلس",
    revenue: "نموذج الإيراد", revenueText: "Freemium للطلاب · اشتراك 20 ر.س شهرياً للمزايا المتقدمة · شراكة بيانات مجهّلة مع إنماء · توسّع لاحق للمبتعثين.",
    tagline: "وعي لا تخبر الطلاب ماذا يفعلون بأموالهم — تبني الجيل الذي يحتاجه القطاع المصرفي.",
  },
  en: {
    brand: "Waey", name: "Wadod", handle: "@wadod · University of Jeddah",
    nav: { home: "Home", analytics: "Analytics", ai: "Waey", invest: "Invest", more: "More" },
    pts: "pts",
    stats: { adhere: "On budget", level: "Level", streak: "Day streak" },
    balance: "Account Balance", transfer: "Transfer", deposit: "Deposit", invest: "Invest",
    friends: "Friends", online: "online", keepUp: "Keep it up!", keepUpSub: "35 days within budget",
    weekly: "Weekly spending", tapWeek: "Tap a week for details", week: (n) => `Week ${n}`,
    leftSpend: "Left to spend", canSave: "Can save",
    weekOrd: ["1", "2", "3", "4"],
    weekDetails: (o) => `Week ${o} details`, weekLimit: "Weekly limit",
    leftOfLimit: (x) => `${fmt(x)} left of weekly limit`, noExpenses: "No expenses this week yet",
    today: "Today", now: "Now", yourLoc: "Your location",
    cats: { food: "Food & drinks", transport: "Transport", fun: "Entertainment", other: "Other", transfer: "Transfer", topup: "Deposit" },
    analytics: "Analytics", seg: ["Daily", "Weekly", "Monthly"], totalSavings: "Total savings", thisTerm: "this term",
    income: "Income", monthlyStipend: "Monthly stipend", remaining: "Remaining", onTrack: "On track", over: "Over budget",
    whereSpent: (x) => `Where did ${x} go?`, recent: "Recent activity",
    logExpense: "Log expense", everyRiyal: "Every riyal has a reason — that's awareness", amount: "Amount", reason: "Reason…", log: "Log",
    badAmount: "Enter a valid amount", askReason: "What's the reason?", logged: (x) => `Logged · ${fmt(x)} ر.س left`,
    askWaey: "Ask Waey", advisorSub: "Your financial advisor · knows your situation",
    hello: "Hi Wadod, I'm Waey, your behavioral money intelligence. I read your spending personality and help you change habits — stipend 1,000 ر.س. Ask me anything: analyze my personality, split my stipend, or save & invest.",
    chips: ["Split my stipend", "Chart my savings forecast", "Where did my money go?", "Lend me 500, I have 200"], msgPlaceholder: "Message Waey…",
    portfolio: "Your portfolio", expRet: (x) => `Expected +25%/yr → ${x} ر.س`,
    journey: "Your university journey", goal: "Goal", now2: "now", suggested: "Suggested for you", inYear: (x) => `In a year ≈ ${x} ر.س`, investBtn: "Invest",
    invested: (x) => `Invested ${fmt(x)} ر.س`, tooMuch: "Amount exceeds your savings",
    more: "More", waeyPoints: "Waey points", offers: "Exclusive offers", getIt: "Get it", offerOn: "Offer activated",
    pointsStore: "Points store", redeem: "Redeem", redeemed: (t) => `Redeemed "${t}"`, noPoints: "Not enough points yet",
    settings: "Settings", demoBtn: "Simulate a payment (demo)", demoSub: "See how Waey asks to categorize each payment",
    appearance: "Theme", dark: "Dark", light: "Light", language: "Language",
    learn: "Learn money management", help: "Help", helpSoon: "Help center coming soon",
    paidNow: (x) => `You just paid ${x} ر.س`, categorize: "Help me categorize it — what type?", typeCat: "Type the category…", confirm: "Confirm",
    categorized: (x, l) => `Categorized ${fmt(x)} ر.س · ${l} (+5 pts)`,
    transferT: "Transfer", yourBal: (x) => `Balance ${x} ر.س`, sendNow: "Send now", sent: (x, to) => `Sent ${fmt(x)} ر.س to ${to}`, noBal: "Insufficient balance",
    people: ["Ahmed", "Sara", "Mom", "Other account"],
    depositT: "Deposit", addFunds: "Add funds to your account", deposited: (x) => `Deposited ${fmt(x)} ر.س`,
    loanTitle: "This exceeds your available balance", approve: "Approve loan", noAdjust: "No, adjust spending", loanDone: (x) => `Loan approved ${fmt(x)} ر.س`,
    portfolioGrowth: "Portfolio growth over 12 months", howSaveMore: "How to save more:", disclaimer: "* Illustrative estimates, returns not guaranteed.",
    persona: "Your money personality", personaBy: "Analyzed by Waey behavioral AI", reanalyze: "Re-analyze",
    personalities: [
      { name: "Social spender", icon: Users2, desc: "Most of your spend is with friends & events", traits: ["Dining", "Fun", "Events"] },
      { name: "Emotional spender", icon: Heart, desc: "You spend more under stress or joy", traits: ["Mood shopping", "Coffee", "Sweets"] },
      { name: "Impulsive spender", icon: Zap, desc: "Quick, unplanned buying decisions", traits: ["Deals", "Electronics", "Delivery"] },
    ],
    peer: "How you compare", peerDesc: "Anonymous — no personal data", peerLine: (p) => `You save more than ${p}% of Jeddah students in your bracket`, peerYou: "You",
    challenges: "This week's challenges", challengesSub: "Tailored to your money personality", chProgress: (a, b) => `${a}/${b} done`,
    challengeList: [{ t: "No food delivery for 3 days", pts: 50 }, { t: "Save 50 ر.س this week", pts: 40 }, { t: "Log all expenses for 5 days", pts: 30 }],
    chDoneMsg: (p) => `Nice! +${p} pts`,
    leader: "Commitment leaderboard", leaderSub: "Compete on commitment, not amounts · privacy kept", commit: "commit",
    stuPrefix: "Student#", lbMetric: "By challenge completion", periodW: "Weekly", periodM: "Monthly", viewAll: "View full leaderboard",
    yourRank: "Your rank", ofN: (n) => `of ${n}`, lbGap: (d, r) => `${d}% behind rank ${r}`, lbTop: "You're #1!", chDoneLabel: "challenges",
    periodY: "Yearly", projTitle: "Savings & growth forecast", breakdownTitle: "Your spending by category",
    projW: (v) => `Save 50 ر.س weekly (less coffee) → in two months ~${fmt(v)} ر.س.`,
    projM: (v) => `Auto-save 200 ر.س monthly with ~10% investing → in a year ~${fmt(v)} ر.س.`,
    projY: (v) => `Keep investing 200 ر.س monthly → by graduation (4 years) ~${fmt(v)} ر.س.`,
    jobsTitle: "Side gigs · extra income", jobsSub: "Work your free time and save from it", jobsPageSub: "Waey auto-saves 20% of every income for you",
    jobAvg: "Students on Waey earn ~600 ر.س/mo on average", jobApply: "Earn it", jobEarned: (p, sv) => `Earned ${fmt(p)} ر.س · saved ${fmt(sv)} ر.س`,
    jobDetails: "Details", jobAbout: "About the role", jobReqs: "Requirements", jobHow: "How to apply", jobLoc: "Location", jobSlots: (n) => `${n} slots open`,
    jobSteps: ["Complete your profile (name · university · major)", "Attach your CV or portfolio", "Submit — you'll hear back within 48 hours"],
    jobApplyNow: "Apply now", jobApplied: "Application sent; we'll reply within 48 hours", jobBack: "Back to jobs",
    roundTitle: "Spare-change vault", roundSub: "We round up each purchase and save the change automatically",
    roundGoal: "Goal: save without noticing — for a rainy day",
    roundHowTitle: "How it works", roundExA: "You pay 5.40 ر.س", roundExB: "We take 6.00 ر.س", roundExC: "0.60 ر.س goes to your vault",
    roundWhy: "Tiny change adds up without hurting you, so when you're short you'll find a sum you saved yourself.",
    roundOn: "On", roundCollected: "Collected", roundMult: "Round-up multiplier", roundConvert: "Move to savings",
    roundConverted: (x) => `Moved ${fmt(x)} ر.س change to your savings`, roundEmpty: "No change yet — spend and watch it grow",
    roundAdded: (x) => `+${x.toFixed(2)} ر.س change`,
    cashOffersSub: "Offers available in this category", cashOffersList: "Available offers", cashOffersCount: "offers",
    as: {
      introTitle: ["Discover why you spend — not just how much", "Answer simple questions ← find your type ← get your decision", "Your data is safe — no bank account needed"],
      introSub: ["Waey understands your money behavior before guiding you", "Under 3 minutes to know yourself financially", "You enter all data yourself, never shared"],
      next: "Next", start: "Start",
      profileTitle: "Tell us about you", profileSub: "Quick info to help Waey understand you",
      age: "Age", uni: "University", city: "City", income: "Monthly income", source: "Income source", goal: "Your money goal",
      ages: ["18–21", "22–24", "25+"], unis: ["University of Jeddah", "King Abdulaziz University", "Other"], cities: ["Jeddah", "Riyadh", "Dammam", "Other"],
      incomes: [["<1000", "Under 1000"], ["1000-2000", "1000–2000"], ["2000-4000", "2000–4000"], [">4000", "Over 4000"]],
      sources: ["Allowance", "Family", "Part-time", "Salary"], goals: ["Save", "Spend less", "Understand behavior"],
      continue: "Continue", qOf: (a, b) => `Question ${a} of ${b}`,
      analyzing: "Waey is analyzing your financial behavior…",
      yourPersona: "Your financial personality", dna: "Behavior DNA", dnaPlanning: "Planning", dnaSocial: "Social", dnaEmotional: "Emotional", dnaImpulsive: "Impulsive",
      awareness: "Financial awareness score", confidence: "AI confidence", seeDecision: "See your decision",
      decisionTitle: "Your money decision", decisionText: (x) => `You can move ${fmt(x)} ر.س to savings this month without changing your lifestyle`,
      decisionHow: "How? A small tweak to your top spending habit", challengeTitle: "Your weekly challenge", points: "awareness pts", acceptCh: "Accept challenge, start",
      retake: "Retake assessment", skip: "Skip",
      betterThan: (p) => `You're better at planning than ${p}% of students`,
      identity: "Meet your financial identity", meetJourney: "Continue your journey",
    },
    splash: { tagline: "Build better money habits", start: "Start" },
    calc: {
      title: "Investment calculator", sub: "Plant a seed today, reap it tomorrow",
      portfolio: "Portfolio type", portfolios: ["Calm", "Balanced", "Active"],
      savings: "Starting amount", monthly: "Monthly deposit", years: "Duration",
      yearsUnit: (n) => `${n} yr`, withWaey: "With Waey investing", noInvest: "Saving without investing",
      afterYears: (n) => `After ${n} years`, result: "Projected result", note: "Estimates for awareness — not a return guarantee",
      diff: "Your gain",
    },
    coach: {
      title: "Waey Coach", sub: "Pick what you need or ask anything",
      analyze: "Analyze my behavior", save: "Help me save", explain: "Explain my score", suggest: "Suggest a challenge",
      analyzeR: "Your money personality is social-planner: you plan before buying but social spending rises on holidays. Set a weekly outings budget.",
      saveR: "Cut restaurant spending by 80 ر.س this week → potential saving 320 ر.س/month. Turn on the spare-change vault to auto-save.",
      explainR: ["Great planning before buying", "Good saving habit", "Emotional spending on holidays"],
      suggestR: "This week's challenge: no restaurants after 8 PM for 3 days → +5 pts. Simple but effective.",
      askMore: "Or type your question below",
    },
    awarenessTitle: "Financial awareness score", dnaTitle: "Behavior DNA", aiConf: "AI confidence",
    insightTitle: "Today's insight from Waey", insightText: "You spent on coffee 3× this week — drop it to twice and save ~35 ر.س. Try today's challenge",
    progTitle: "Your progress", progWeeks: "Weeks", progChDone: "Challenges done", progScoreUp: "Score growth", progWeekLabel: (n) => `Week ${n}`,
    rewardsTitle: "Your rewards", rewLevel: "Level", rewBadges: "Badges", rewFuture: "Coming soon: Future Alinma Rewards",
    badgeNames: ["First challenge", "Saver", "7-day streak", "First investor"],
    plat: {
      title: "Waey Platform", sub: "Not just an app — a behavioral finance platform with three interfaces",
      tagline: "Waey is a Behavior Layer between the student, university, and bank",
      archTitle: "Architecture", layer: "Secure APIs Layer",
      nodeStudent: "Student App", nodeUni: "University Portal", nodeBank: "Bank Dashboard",
      engBehavior: "Behavior Engine", engAI: "AI Engine", engAnalytics: "Analytics Engine",
      pStudent: "Student", pStudentD: "Answers questions → gets Behavior DNA, awareness score, coach, and challenge. No bank account in the MVP.",
      pUni: "University of Jeddah", pUniD: "Institutional partner: launches the program, tracks participation & awareness — all anonymized, no individuals.",
      pBank: "Bank Alinma", pBankD: "Receives only aggregated behavior analytics (top personas, avg awareness) to design youth products — no individual data.",
      uniDash: "University dashboard (demo)", uniStudents: "Participating students", uniAwareness: "Avg financial awareness", uniComplete: "Challenge completion",
      bankDash: "Bank dashboard (demo)", bankTopPersona: "Most common persona", bankAvgAware: "Avg awareness", bankTopCh: "Top challenge", bankAnon: "All data aggregated & anonymized",
      apisTitle: "API layer (scale roadmap)", apiMock: "Mock",
      apis: [["AI API", "Returns the student's Behavior DNA"], ["University API", "Verify university & college (future)"], ["Alinma API", "Transactions & savings — after user consent"], ["Analytics API", "Aggregate anonymized data for dashboards"]],
      legalTitle: "Legal compliance", legal: "Any banking integration happens only after user consent and per regulatory requirements via official APIs. Usage and analysis data stays anonymized.",
      enter: "Explore the platform (for judges)",
    },
    role: {
      title: "Who are you?", sub: "Waey is a platform with three interfaces — pick your experience",
      student: "Student", studentD: "Try the behavior assessment, coach, and challenges",
      uni: "University of Jeddah", uniD: "Participation & awareness dashboard — anonymized",
      bank: "Bank Alinma", bankD: "Aggregated behavior analytics to design youth products",
      enter: "Enter", back: "Change role",
    },
    dash: {
      period: ["Week", "Month", "Term"],
      tabsUni: ["Overview", "Personas", "Challenges", "Colleges"],
      tabsBank: ["Overview", "Personas", "Habits", "Opportunities"],
      college: "College", allColleges: "All colleges",
      colleges: ["Computer Science", "Engineering", "Business", "Medicine", "Science"],
      participation: "Participation", awareness: "Avg awareness", completion: "Challenge completion", activeUsers: "Active users",
      personaMix: "Financial personality mix", tapForDetail: "Tap for details ←",
      chTitle: "Most successful challenges", chAccept: "Accept rate", chDone: "Completion rate",
      collegeTitle: "Awareness by college", students: "students",
      habitsTitle: "Most common negative habits", oppTitle: "Opportunities for the bank", ageGroup: "Age group",
      trend: "Trend", growth: "Growth", vs: "vs last term",
      detailFor: (n) => `Details: ${n}`, share: "of students", back: "Back",
      anon: "All data aggregated & anonymized — no individual info",
      insightUni: "Awareness rose 6% after weekly challenges launched.",
      insightBank: "62% of students spend on coffee daily — a chance for an auto-savings product.",
      opps: [["Youth auto-savings product", "Target the 62% who spend daily on coffee"], ["Student card with behavior rewards", "Incentivize financial commitment"], ["Installment awareness campaign", "48% buy impulsively on discounts"], ["First-salary program", "A generation graduating with healthy habits"]],
      spendHeat: "Spending map (day × category)", days: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
      catFood: "Food", catTrans: "Transport", catFun: "Fun", catShop: "Shopping", catBills: "Bills",
      ranking: "University ranking", byMetric: "by", rankSavings: "Savings", rankEngage: "Engagement", rankAware: "Awareness",
      region: "Region", allRegions: "All regions", regions: ["Makkah", "Riyadh", "Eastern"],
      savedTotal: "Total saved", avgSave: "Avg savings/student", invPart: "Investment participation", litScore: "Financial literacy",
      wellness: "Financial wellness index", wellLow: "Low", wellMid: "Medium", wellHigh: "High",
      unitK: "K", unitM: "M", uniList: ["Univ. of Jeddah", "King Abdulaziz", "Umm Al-Qura", "King Saud", "Imam", "KFUPM"],
    },
    cashTitle: "Cashback & offers", cashSub: "Get part of your daily spending back", cashPageSub: "Activate your categories and earn cashback on every purchase",
    cashEarned: "Cashback this month", cashActivate: "Activate", cashActive: "Active", cashOn: "Cashback activated", backWord: "cashback",
    mk: {
      home: "Home", about: "About", login: "Sign in", start: "Get started", openApp: "Open app",
      heroTitle: "Money awareness starts at university",
      heroSub: "A behavioral AI platform that turns your daily spending into smart saving habits — a Duolingo for money.",
      ctaPrimary: "Start free", ctaSecondary: "I have an account",
      pillarsTitle: "Four pillars that reshape your money habits",
      pillars: [
        { icon: Brain, t: "Spending personality engine", d: "Identifies your money type from day one: social, emotional, or impulsive." },
        { icon: Users2, t: "Anonymous peer comparison", d: "See where you stand vs students in your city — no personal data." },
        { icon: Target, t: "Personalized weekly challenges", d: "Built for your personality, raising your money awareness step by step." },
        { icon: Trophy, t: "Commitment leaderboard", d: "Compete on completing challenges, not amounts — privacy kept." },
      ],
      stats: [{ v: "1.6%", l: "Saudi savings rate" }, { v: "2.2M", l: "students yearly" }, { v: "2030", l: "supports the Vision" }],
      howTitle: "How Waey works",
      steps: [
        { t: "Analyze your personality", d: "Waey reads your spending pattern and finds your money type." },
        { t: "Track & complete", d: "Weekly challenges and points build your habits step by step." },
        { t: "Compete & save", d: "Top the commitment leaderboard and turn savings into investing." },
      ],
      ctaTitle: "Ready to reshape your money habits?", ctaBtn: "Start now, free",
      rights: "© 2026 Waey · Prototype",
      problemTitle: "The problem", problemText: "Saudi savings rate is just 1.6% — the lowest among G20. It's not an income problem, it's behavior. 2.2M students enter their first independent money experience yearly with no tool to help them understand how they think about money.",
      solutionTitle: "The solution", solutionText: "Waey is a behavioral AI platform that turns your daily financial data into practical insights that change how you think about money — not just number tracking.",
      visionTitle: "The vision", whyTitle: "Why now", whyText: "Every student using Waey today is an aware, stable customer tomorrow — a strategic investment in a whole generation before any competitor.",
      lgTitle: "Sign in", lgSub: "Access your Waey account", lgId: "Email or phone", lgPass: "Password",
      lgBtn: "Sign in", lgGuest: "Continue as guest", lgNo: "No account?", lgSignup: "Create one", lgBack: "Back to home", lgOut: "Log out",
    },
    leaderRows: [{ h: "Student#A12", pct: 94 }, { h: "Student#K77", pct: 90 }, { you: true, pct: 85 }, { h: "Student#M03", pct: 81 }, { h: "Student#R56", pct: 78 }],
    about: "About Waey", aboutMission: "Raising a generation's money awareness — a Duolingo for money.", aboutStat: "Saudi savings rate is just 1.6% — Waey changes behavior from university, supporting Vision 2030.", aboutPartner: "Proposed strategic partner: Bank Alinma",
    plus: "Waey Plus", plusSub: "Unlock advanced behavioral insights & exclusive challenges", plusPrice: "20 ر.س / mo", upgrade: "Upgrade", plusDone: "Welcome to Waey Plus ",
    revenue: "Revenue model", revenueText: "Freemium for students · 20 ر.س/mo for advanced features · anonymized data partnership with Alinma · later expansion to scholarship students.",
    tagline: "Waey doesn't tell students what to do with their money — it builds the generation banking needs.",
  },
};
const offersData = [
  { ar: "قهوة وكافيهات", en: "Coffee & cafés", off: { ar: "خصم 15%", en: "15% off" }, icon: Coffee, ck: "terra" },
  { ar: "توصيل طعام", en: "Food delivery", off: { ar: "خصم 25%", en: "25% off" }, icon: Utensils, ck: "accent" },
  { ar: "كتب وقرطاسية", en: "Books & stationery", off: { ar: "خصم 20%", en: "20% off" }, icon: BookOpen, ck: "green" },
  { ar: "إلكترونيات", en: "Electronics", off: { ar: "خصم 10%", en: "10% off" }, icon: Headphones, ck: "accentText" },
];
const storeData = [
  { ar: "قسيمة قهوة", en: "Coffee voucher", cost: 300, icon: Coffee },
  { ar: "بطاقة متجر 50 ر.س", en: "50 ر.س gift card", cost: 1200, icon: Gift },
  { ar: "اشتراك شهر", en: "1-month subscription", cost: 800, icon: Film },
  { ar: "خصم رسوم تحويل", en: "Transfer-fee discount", cost: 200, icon: Banknote },
];
const LB = [
  { id: "A12", pct: 94, done: 5 }, { id: "L09", pct: 92, done: 5 }, { id: "K77", pct: 90, done: 4 },
  { id: "S20", pct: 88, done: 4 }, { you: true, pct: 85, done: 4 }, { id: "B31", pct: 83, done: 3 },
  { id: "M03", pct: 81, done: 3 }, { id: "R56", pct: 78, done: 3 }, { id: "T44", pct: 75, done: 2 },
  { id: "N18", pct: 70, done: 2 },
];
const LB_COLORS = ["#8685D8", "#CA6C46", "#5FCB8E", "#A8A6F2", "#E08A63"];
const JOBS = [
  { icon: Tent, t: { ar: "مساعد فعالية جامعية", en: "Campus event assistant" }, org: { ar: "نادي طلابي", en: "Student club" }, pay: 50, unit: { ar: "/ساعة", en: "/hr" }, dur: { ar: "4 ساعات · هذا الأسبوع", en: "4 hrs · this week" }, mode: { ar: "حضوري", en: "On-site" }, loc: { ar: "جامعة جدة", en: "University of Jeddah" },
    desc: { ar: "مساعدة فريق التنظيم في استقبال الحضور وتنسيق الفعالية داخل الحرم الجامعي.", en: "Help the organizing team welcome attendees and coordinate the campus event." },
    reqs: { ar: ["طالب جامعي حالي", "روح تعاونية", "حضور يوم الفعالية"], en: ["Current university student", "Team spirit", "Available on event day"] }, slots: 6 },
  { icon: Bike, t: { ar: "توصيل أوقات الفراغ", en: "Flexible delivery" }, org: { ar: "شريك توصيل", en: "Delivery partner" }, pay: 35, unit: { ar: "/ساعة", en: "/hr" }, dur: { ar: "مرن", en: "Flexible" }, mode: { ar: "ميداني", en: "Field" }, loc: { ar: "جدة", en: "Jeddah" },
    desc: { ar: "توصيل الطلبات في أوقاتك الفاضية، تختار الساعات اللي تناسبك بنفسك.", en: "Deliver orders in your free time — pick the hours that suit you." },
    reqs: { ar: ["عمر 18+", "وسيلة تنقل", "رخصة سارية"], en: ["18+", "A vehicle", "Valid license"] }, slots: 20 },
  { icon: Laptop, t: { ar: "إدخال بيانات عن بُعد", en: "Remote data entry" }, org: { ar: "شركة ناشئة", en: "Startup" }, pay: 40, unit: { ar: "/ساعة", en: "/hr" }, dur: { ar: "10 ساعات/أسبوع", en: "10 hrs/week" }, mode: { ar: "عن بُعد", en: "Remote" }, loc: { ar: "عن بُعد", en: "Remote" },
    desc: { ar: "إدخال وتنظيم بيانات في جداول، من البيت وبأوقات مرنة.", en: "Enter and organize data into sheets, from home on a flexible schedule." },
    reqs: { ar: ["إتقان الإكسل", "دقة وسرعة", "لابتوب وإنترنت"], en: ["Excel skills", "Accuracy & speed", "Laptop + internet"] }, slots: 8 },
  { icon: Palette, t: { ar: "تصميم سوشال ميديا", en: "Social media design" }, org: { ar: "متجر إلكتروني", en: "E-commerce" }, pay: 300, unit: { ar: "/مشروع", en: "/project" }, dur: { ar: "3 أيام", en: "3 days" }, mode: { ar: "عن بُعد", en: "Remote" }, loc: { ar: "عن بُعد", en: "Remote" },
    desc: { ar: "تصميم 10 منشورات سوشال ميديا لحملة متجر إلكتروني.", en: "Design 10 social posts for an e-commerce campaign." },
    reqs: { ar: ["معرفة بفوتوشوب/Canva", "نماذج أعمال سابقة", "التزام بالموعد"], en: ["Photoshop/Canva", "Portfolio", "Meet the deadline"] }, slots: 3 },
  { icon: Camera, t: { ar: "تصوير منتجات", en: "Product photography" }, org: { ar: "محل محلي", en: "Local shop" }, pay: 200, unit: { ar: "/مهمة", en: "/gig" }, dur: { ar: "يوم واحد", en: "1 day" }, mode: { ar: "حضوري", en: "On-site" }, loc: { ar: "حي السلامة، جدة", en: "Al Salamah, Jeddah" },
    desc: { ar: "تصوير 20 منتج بإضاءة احترافية في المحل وتسليم الصور معدّلة.", en: "Shoot 20 products with proper lighting in-store and deliver edited photos." },
    reqs: { ar: ["كاميرا/جوال جيد", "أساسيات التعديل", "خبرة بسيطة"], en: ["Good camera/phone", "Editing basics", "Some experience"] }, slots: 2 },
  { icon: School, t: { ar: "مدرّس أقران (مواد جامعية)", en: "Peer tutor" }, org: { ar: "منصة تعليم", en: "Edu platform" }, pay: 60, unit: { ar: "/ساعة", en: "/hr" }, dur: { ar: "مرن", en: "Flexible" }, mode: { ar: "عن بُعد", en: "Remote" }, loc: { ar: "عن بُعد", en: "Remote" },
    desc: { ar: "شرح مواد جامعية لطلاب أقل منك مستوى عبر جلسات أونلاين.", en: "Tutor juniors in university subjects via online sessions." },
    reqs: { ar: ["معدل تراكمي جيد", "إتقان المادة", "مهارات شرح"], en: ["Good GPA", "Subject mastery", "Explaining skills"] }, slots: 12 },
];
const CASH = [
  { icon: Coffee, cat: { ar: "كوفيهات", en: "Cafés" }, back: 10, ck: "terra", offers: [{ ar: "خصم 15% على القهوة المختصة", en: "15% off specialty coffee" }, { ar: "مشروب ثانٍ مجاني الثلاثاء", en: "Free 2nd drink on Tuesdays" }, { ar: "كاش باك 10% لطلاب الجامعات", en: "10% cashback for students" }] },
  { icon: Fuel, cat: { ar: "محطات الوقود", en: "Fuel stations" }, back: 5, ck: "accent", offers: [{ ar: "كاش باك 5% على كل تعبئة", en: "5% cashback on every fill-up" }, { ar: "غسيل سيارة مجاني كل 5 تعبئات", en: "Free car wash every 5 fill-ups" }, { ar: "نقاط مضاعفة نهاية الأسبوع", en: "Double points on weekends" }] },
  { icon: ShoppingCart, cat: { ar: "سوبرماركت", en: "Supermarkets" }, back: 7, ck: "green", offers: [{ ar: "كاش باك 7% على المشتريات", en: "7% cashback on groceries" }, { ar: "خصم 20 ر.س عند الصرف فوق 200", en: "20 ر.س off when you spend 200+" }, { ar: "عروض أسبوعية على الأساسيات", en: "Weekly deals on essentials" }] },
  { icon: Utensils, cat: { ar: "مطاعم", en: "Restaurants" }, back: 8, ck: "accentText", offers: [{ ar: "كاش باك 8% على الطلبات", en: "8% cashback on orders" }, { ar: "وجبة طالب بسعر مخفّض", en: "Discounted student meal" }, { ar: "توصيل مجاني فوق 50 ر.س", en: "Free delivery over 50 ر.س" }] },
  { icon: Headphones, cat: { ar: "إلكترونيات", en: "Electronics" }, back: 4, ck: "terraText", offers: [{ ar: "كاش باك 4% على الأجهزة", en: "4% cashback on devices" }, { ar: "تقسيط بدون فوائد للطلاب", en: "Interest-free installments for students" }, { ar: "ضمان ممتد مجاني", en: "Free extended warranty" }] },
  { icon: Pill, cat: { ar: "صيدليات", en: "Pharmacies" }, back: 6, ck: "green", offers: [{ ar: "كاش باك 6% على المشتريات", en: "6% cashback on purchases" }, { ar: "خصم 10% على العناية الشخصية", en: "10% off personal care" }, { ar: "توصيل مجاني للأدوية", en: "Free medication delivery" }] },
];

const Ctx = createContext(null);
const useCtx = () => useContext(Ctx);

// رمز الريال السعودي الرسمي (المسار الرسمي من ساما)
function RS({ size = "0.92em", color = "currentColor", style }) {
  return (
    <svg viewBox="0 0 1124.14 1256.39" width={size} height={size} fill={color} style={{ display: "inline-block", verticalAlign: "-0.04em", margin: "0 0.12em", ...style }} aria-label="SAR">
      <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
      <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
    </svg>
  );
}
function riyalText(str) {
  if (typeof str !== "string") return str;
  if (!str.includes("ر.س")) return str;
  const parts = str.split("ر.س");
  return parts.map((p, i) => (i < parts.length - 1 ? [<span key={i}>{p}</span>, <RS key={"r" + i} />] : <span key={i}>{p}</span>));
}

function injectAssets() {
  if (document.getElementById("waey-assets")) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.id = "waey-assets";
  // Reduced-motion is handled by src/styles/waey-theme.css + Framer/GSAP guards.
  // Only loader/overlay keyframes still in use remain here (wUp/wPop/wDot/wSpin/wLoad).
  s.textContent = `*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
    @keyframes wUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
    @keyframes wPop{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}
    @keyframes wDot{0%,80%,100%{opacity:.2}40%{opacity:1}}
    @keyframes wSpin{to{transform:rotate(360deg)}}
    @keyframes wLoad{from{width:0}to{width:100%}}
    .wscroll::-webkit-scrollbar{width:0;height:0}.whz::-webkit-scrollbar{height:0}`;
  document.head.appendChild(s);
}

/* ===================== محرك وعي ثنائي اللغة ===================== */
function fvSeries(monthly, annual, months) { const r = annual / 12; const a = []; let b = 0; for (let i = 0; i < months; i++) { b = b * (1 + r) + monthly; a.push(b); } return a; }
function weeklySeries(amt, n) { const a = []; let b = 0; for (let i = 0; i < n; i++) { b += amt; a.push(b); } return a; }
function pickChart(content, intent) {
  const x = toWest(content).toLowerCase();
  if (intent === "invest") return { kind: "invest" };
  if (/فئة|فئات|وين راح|أين صرف|وين صرف|توزيع|breakdown|categor|where.*money|على وش|وش صرفت/.test(x)) return { kind: "breakdown" };
  if (/سنه|سنة|سنوي|year|annual/.test(x)) return { kind: "projection", period: "year" };
  if (/اسبوع|أسبوع|week/.test(x)) return { kind: "projection", period: "week" };
  if (/توفير|ادخار|ادّخار|save|saving|نمو|forecast|توقّع|توقع|مستقبل|رسم|chart|graph|بياني|مخطط|شهري|month/.test(x)) return { kind: "projection", period: "month" };
  return null;
}
const toWest = (s) => s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
const nums = (s) => (toWest(s).match(/\d+(\.\d+)?/g) || []).map(Number);
function cleanMd(t) {
  return (t || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/(^|\n)\s*[*\-]\s+/g, "$1• ")
    .replace(/`/g, "")
    .trim();
}
function catFromText(t) {
  const x = (t || "").toLowerCase();
  if (/أكل|اكل|مطعم|قهوة|قهوه|كوفي|كافيه|كافي|وجبة|وجبه|برجر|شاورما|بقالة|بقاله|سوبر|طلبات|هنقر|جوع|عشاء|غداء|فطور|مقهى|ماك|كنتاكي|بيتزا|حلى|حلا|عصير|شاي|دجاج|مندي|كبسة|food|coffee|cafe|restaurant|burger|meal|lunch|dinner|breakfast|grocer|snack|pizza|eat|drink/.test(x)) return "food";
  if (/بنزين|وقود|محطة|محطه|تنقل|أوبر|اوبر|كريم|تاكسي|تكسي|سيارة|سياره|مواصلات|باص|رحلة|رحله|طلعة|طريق|gas|fuel|uber|careem|taxi|transport|bus|ride|car|commut/.test(x)) return "transport";
  if (/ترفيه|سينما|لعبة|لعبه|ألعاب|العاب|قيمنق|قيمنغ|اشتراك|نتفلكس|نتفليكس|حفلة|حفله|فعالية|فعاليه|تذكرة|تذكره|بلايستيشن|متعة|خروج|كوره|كرة|fun|game|cinema|movie|netflix|subscri|event|ticket|play|concert/.test(x)) return "fun";
  return "other";
}
function detectIntent(m) {
  const x = m.toLowerCase();
  if (/أرخص|ارخص|اوفر|أوفر|وين ألقى|وين الاقي|فين أرخص|خصم طلاب|خصم الطلاب|عروض|أوفّر مكان|cheap|cheapest|where.*buy|where.*cheap|discount|student.*deal|best price|deal/.test(x)) return "cheapest";
  if (/استثمر|استثمار|الذهب|ذهب|اسهم|أسهم|صناديق|اكسب|أكسب|عائد|محفظ|ارباح|أرباح|كل شهر|نمو|توفّر.*استثمر|invest|gold|stock|fund|return|portfolio|grow|compound|save.*invest|where.*put/.test(x)) return "invest";
  if (/وزّع|وزع|توزيع|قسّم|قسم|كيف (اصرف|أصرف|اوزع|أوزع)|خطة صرف|ميزاني|تنظيم.*مصاريف|split|budget|allocate|distribute|plan.*spend|how.*spend/.test(x)) return "budget";
  if (/قرض|سلفة|اقترض|استلف|أستلف|محتاج|ينقص|ما (تكفيني|يكفي)|أحتاج|ومعي|سلّفني|loan|borrow|need|short|can.?t afford/.test(x)) return "loan";
  return "general";
}
function cheapestLocal(st, lang) {
  return {
    text: lang === "ar"
      ? `عشان توفّر بدون ما تحرم نفسك\n• القهوة: حضّرها بالبيت أو كوفي محلي بدل السلاسل — توفّر 50–70%\n• الأكل: اطبخ مرتين بالأسبوع، وخصومات الطلاب في المطاعم (أظهر بطاقتك الجامعية)\n• البقالة: التطبيقات والعروض الأسبوعية + الماركات الاقتصادية\n• الوقود: عبّي كامل وقلّل التنقّل القصير\nوفعّل صفحة الكاش باك ترجع لك جزء من صرفك على الكوفي والسوبرماركت والمحطات.`
      : `To save without depriving yourself\n• Coffee: make it at home or a local shop instead of chains — saves 50–70%\n• Food: cook twice a week, and use student discounts (show your university ID)\n• Groceries: weekly-deal apps + value brands\n• Fuel: fill up fully, cut short trips\nAnd turn on the Cashback page to get part of your coffee, supermarket and fuel spend back.`,
  };
}
function investLocal(st, lang) {
  const monthly = 200, chart = fvSeries(monthly, 0.10, 12), contrib = monthly * 12;
  const T = {
    ar: [["صكوك ومرابحة", "مخاطر منخفضة"], ["ذهب", "متوسطة · تحوّط للتضخم"], ["صناديق مؤشرات (أسهم)", "أعلى · أفضل للمدى الطويل"], ["صناديق نمو", "الأعلى تذبذباً"]],
    en: [["Sukuk & Murabaha", "Low risk"], ["Gold", "Medium · inflation hedge"], ["Index funds (stocks)", "Higher · best long-term"], ["Growth funds", "Highest volatility"]],
  };
  const rates = [0.05, 0.09, 0.13, 0.20];
  const types = T[lang].map((t, i) => { const fv = fvSeries(monthly, rates[i], 12).at(-1); return { name: t[0], risk: t[1], r: rates[i], fv, profit: fv - contrib }; });
  const text = lang === "ar"
    ? `حلو إنك تفكّر بالاستثمار\nلو حوّلت ${monthly} ر.س ادخار تلقائي أول كل شهر (إجمالي ${fmt(contrib)} ر.س بالسنة)، هذا تقدير نمو محفظتك:`
    : `Great that you're thinking about investing\nIf you auto-save ${monthly} ر.س each month (${fmt(contrib)} ر.س/yr), here's an estimate of your portfolio growth:`;
  const tips = lang === "ar"
    ? [`قهوتك ومطاعمك ${st.cats.food} ر.س — قلّلها 30% توفّر ~${Math.round(st.cats.food * 0.3)} ر.س`, "فعّل تحويل 20% ادخار تلقائي أول الشهر", "ألغِ الاشتراكات اللي ما تستخدمها"]
    : [`Food & coffee is ${st.cats.food} ر.س — cut 30% to save ~${Math.round(st.cats.food * 0.3)} ر.س`, "Auto-transfer 20% to savings at month start", "Cancel subscriptions you don't use"];
  return { text, widget: { kind: "invest", monthly, chart, contrib, types, tips } };
}
function budgetLocal(lang) {
  return {
    text: lang === "ar"
      ? `توزيع صحي لمكافأتك 1,000 ر.س:\n• ضروريات (مواصلات + أكل): 500 ر.س\n• مصاريف شخصية مرنة: 300 ر.س\n• ادخار واستثمار: 200 ر.س\n\nثبّت الـ 200 ادخار أول الشهر قبل أي صرف.`
      : `A healthy split for your 1,000 ر.س:\n• Essentials (transport + food): 500 ر.س\n• Flexible personal spend: 300 ر.س\n• Save & invest: 200 ر.س\n\nLock the 200 savings at month start before spending.`,
  };
}
function loanLocal(st, msg, lang) {
  const n = nums(msg), have = n.length >= 2 ? Math.min(...n) : st.available, need = n.length ? Math.max(...n) : 0, gap = Math.max(0, need - have);
  if (gap > 0) {
    const offer = Math.min(250, Math.ceil(gap / 50) * 50);
    const hrs = Math.max(1, Math.ceil(gap / 35));
    return {
      text: lang === "ar"
        ? `محتاج ${fmt(need)} ومعك ${fmt(have)} → ينقصك ${fmt(gap)} ر.س. عندك 3 حلول:\n\n١) اشتغلها — توصيل أوقات الفراغ ~35 ر.س/ساعة، ${hrs} ساعات تغطّي الفرق (افتح صفحة الوظائف).\n٢) سلفة — وعي يعطيك ${fmt(offer)} ر.س تُخصم من راتب الشهر الجاي (بتنزل ${fmt(STIPEND - (st.loanTaken + offer))} بدل 1,000). اعتمدها بالزر تحت.\n٣) قلّلها — وفّر الفرق من القهوة والترفيه هالأسبوع.\n\nوش يناسبك؟`
        : `You need ${fmt(need)} but have ${fmt(have)} → short ${fmt(gap)} ر.س. You've got 3 options:\n\n1) Earn it — flexible delivery ~35 ر.س/hr, ${hrs} hrs covers the gap (open Jobs).\n2) Loan — Waey lends ${fmt(offer)} ر.س deducted from next month (drops to ${fmt(STIPEND - (st.loanTaken + offer))} instead of 1,000). Approve with the button below.\n3) Trim it — save the gap from coffee & fun this week.\n\nWhich works for you?`,
    };
  }
  return { text: lang === "ar" ? `وضعك يغطّي المبلغ من المتاح (${fmt(st.available)} ر.س). لا تحتاج قرض — بس خلّ لك هامش ادخار. ولو تبي تزيد دخلك، صفحة الوظائف فيها أعمال مؤقتة.` : `Your available balance covers it (${fmt(st.available)} ر.س). No loan needed — keep a savings buffer. To boost income, the Jobs page has flexible gigs.` };
}
function generalLocal(st, msg, lang) {
  const n = nums(msg);
  if (/اشترك|اشتراك|subscri/.test(msg.toLowerCase()) && n.length) {
    const cost = Math.max(...n), rest = STIPEND - cost;
    return {
      text: lang === "ar"
        ? `الاشتراك بـ ${fmt(cost)} ر.س يخلّيك بـ ${fmt(rest)} ر.س لبقية الشهر.\nلو مصاريفك الأساسية قريبة من ${fmt(rest)}، ما يتبقّى للادخار. اقتراحي:\n• شارك الاشتراك وقسّم التكلفة\n• أو باقة أرخص هالشهر\n• وثبّت ولو 50 ر.س ادخار.`
        : `A ${fmt(cost)} ر.س subscription leaves you ${fmt(rest)} ر.س for the month.\nIf your essentials are near ${fmt(rest)}, nothing's left to save. My take:\n• Split the subscription with a friend\n• Or pick a cheaper plan this month\n• And lock even 50 ر.س in savings.`,
    };
  }
  return {
    text: lang === "ar"
      ? `أنا وعي، مساعدك المالي. وضعك الحالي: متاح ${fmt(st.available)} ر.س، ومدّخرات ${fmt(st.savings)} ر.س.\nأقدر أساعدك في:\n• كيف أوزّع مصروفي الشهري\n• أرخص طريقة أوفّر على القهوة والأكل والوقود\n• كيف أبدأ استثمار بسيط\n• محتاج مبلغ زائد أو سلفة\nاكتب سؤالك بصياغتك وأجاوبك مباشرة.`
      : `I'm Waey, your money assistant. Your status: ${fmt(st.available)} ر.س available, ${fmt(st.savings)} ر.س saved.\nI can help with:\n• How to split my monthly budget\n• Cheapest ways to save on coffee, food & fuel\n• How to start simple investing\n• I need extra cash or a loan\nType your question in your own words and I'll answer directly.`,
  };
}

/* ===================== محرك الذكاء السلوكي (Rule-Based) ===================== */
const ASSESS_Q = [
  { q: { ar: "لما تستلم دخلك، أول شيء تسويه؟", en: "When you get your income, first thing you do?" }, o: [{ k: "save", ar: "أدخّر جزء فوراً", en: "Save part immediately" }, { k: "shopping", ar: "أروح أتسوّق", en: "Go shopping" }, { k: "friends", ar: "أطلب مع أصحابي", en: "Order out with friends" }, { k: "need", ar: "أصرف حسب الحاجة", en: "Spend as needed" }] },
  { q: { ar: "لما تكون مضغوط أو زعلان؟", en: "When you're stressed or down?" }, o: [{ k: "buy", ar: "أشتري شيء يسعدني", en: "Buy something that cheers me up" }, { k: "food", ar: "آكل برا أو أطلب", en: "Eat out or order in" }, { k: "friends", ar: "أطلع مع أصحابي", en: "Go out with friends" }, { k: "none", ar: "ما يأثّر على صرفي", en: "Doesn't affect my spending" }] },
  { q: { ar: "قبل شراء شيء فوق 100 ر.س؟", en: "Before buying something over 100 ر.س?" }, o: [{ k: "think_week", ar: "أفكّر أسبوع على الأقل", en: "Think at least a week" }, { k: "buy_now", ar: "أشتريه فوراً", en: "Buy it right away" }, { k: "ask_friends", ar: "أسأل أصحابي", en: "Ask my friends" }, { k: "check_budget", ar: "أشوف ميزانيتي", en: "Check my budget" }] },
  { q: { ar: "وين يروح معظم مصروفك؟", en: "Where does most of your money go?" }, o: [{ k: "restaurants", ar: "مطاعم وكافيهات", en: "Restaurants & cafés" }, { k: "shopping", ar: "تسوّق وملابس", en: "Shopping & clothes" }, { k: "entertainment", ar: "ترفيه وفعاليات", en: "Entertainment & events" }, { k: "saving", ar: "ادخار واستثمار", en: "Saving & investing" }] },
  { q: { ar: "لما تشوف تخفيض؟", en: "When you see a discount?" }, o: [{ k: "buy_discount", ar: "أشتري حتى لو ما احتجته", en: "Buy even if I don't need it" }, { k: "think", ar: "أفكّر بس ما أشتري", en: "Think but don't buy" }, { k: "share", ar: "أشارك أصحابي", en: "Share it with friends" }, { k: "ignore", ar: "أتجاهله", en: "Ignore it" }] },
  { q: { ar: "كم تدّخر من دخلك؟", en: "How much of your income do you save?" }, o: [{ k: "nothing", ar: "لا شيء", en: "Nothing" }, { k: "less_10", ar: "أقل من 10%", en: "Less than 10%" }, { k: "10_20", ar: "10–20%", en: "10–20%" }, { k: "more_20", ar: "أكثر من 20%", en: "More than 20%" }] },
  { q: { ar: "كيف تتعامل مع الأهداف المالية؟", en: "How do you handle financial goals?" }, o: [{ k: "clear_goal", ar: "عندي هدف وأتبعه", en: "I have a goal and follow it" }, { k: "try_fail", ar: "أحاول بس ما أكمّل", en: "I try but don't finish" }, { k: "never", ar: "ما فكّرت بالموضوع", en: "Never thought about it" }, { k: "friends_influence", ar: "الأصحاب يأثرون عليّ", en: "Friends influence me" }] },
  { q: { ar: "لو جاك 500 ر.س مفاجئة؟", en: "If you suddenly got 500 ر.س?" }, o: [{ k: "save", ar: "أضيفها للادخار", en: "Add it to savings" }, { k: "buy", ar: "أشتري شيء أبغاه", en: "Buy something I want" }, { k: "celebrate", ar: "أحتفل مع أصحابي", en: "Celebrate with friends" }, { k: "needs", ar: "أصرفها على احتياجات", en: "Spend on needs" }] },
];
const PERSONA_META = {
  social: { ar: "المنفق الاجتماعي", en: "Social Spender", descAr: "تنفق لتستمتع مع الآخرين — علاقاتك تؤثر على ميزانيتك", descEn: "You spend to enjoy time with others — your circle shapes your budget", chAr: "لا مطاعم بعد 8 مساءً لمدة 3 أيام", chEn: "No restaurants after 8 PM for 3 days" },
  impulsive: { ar: "المنفق الاندفاعي", en: "Impulsive Spender", descAr: "تشتري لحظياً — القرارات السريعة تكلّفك أكثر", descEn: "You buy on impulse — fast decisions cost you more", chAr: "قبل أي شراء فوق 100 ر.س، انتظر 24 ساعة", chEn: "Before any purchase over 100 ر.س, wait 24 hours" },
  emotional: { ar: "المنفق العاطفي", en: "Emotional Spender", descAr: "مشاعرك تقود محفظتك — تنفق عند الضغط أو الفرح", descEn: "Your emotions drive your wallet — you spend when stressed or happy", chAr: "سجّل شعورك قبل كل عملية شراء هذا الأسبوع", chEn: "Log your mood before each purchase this week" },
  planning: { ar: "المخطّط المالي", en: "The Planner", descAr: "لديك وعي مالي جيد — طوّره نحو الاستقلال المالي", descEn: "You have solid money awareness — grow it toward independence", chAr: "زِد ادخارك 5% هذا الشهر", chEn: "Increase your savings by 5% this month" },
};
const INCOME_MAP = { "<1000": 800, "1000-2000": 1500, "2000-4000": 3000, ">4000": 5000 };
function analyzeBehavior(a, income) {
  let planning = 0, social = 0, emotional = 0, impulsive = 0;
  if (a.q1 === "save") planning += 3; else if (a.q1 === "shopping") impulsive += 3; else if (a.q1 === "friends") social += 3; else impulsive += 1;
  if (a.q2 === "buy") emotional += 3; else if (a.q2 === "food") emotional += 2; else if (a.q2 === "friends") social += 3; else planning += 1;
  if (a.q3 === "think_week") planning += 3; else if (a.q3 === "buy_now") impulsive += 3; else if (a.q3 === "ask_friends") social += 2; else planning += 2;
  if (a.q4 === "restaurants") social += 2; else if (a.q4 === "shopping") impulsive += 2; else if (a.q4 === "entertainment") social += 2; else planning += 3;
  if (a.q5 === "buy_discount") impulsive += 3; else if (a.q5 === "think") planning += 2; else if (a.q5 === "share") social += 2; else planning += 3;
  const svMap = { nothing: 0, less_10: 1, "10_20": 2, more_20: 3 }; const sv = svMap[a.q6] ?? 0; planning += sv;
  if (a.q7 === "clear_goal") planning += 3; else if (a.q7 === "try_fail") planning += 1; else if (a.q7 === "never") impulsive += 2; else social += 2;
  if (a.q8 === "save") planning += 3; else if (a.q8 === "buy") impulsive += 3; else if (a.q8 === "celebrate") social += 3; else planning += 1;
  const mx = 12;
  const dna = { planning: Math.min(Math.round(planning / mx * 100), 100), social: Math.min(Math.round(social / mx * 100), 100), emotional: Math.min(Math.round(emotional / mx * 100), 100), impulsive: Math.min(Math.round(impulsive / mx * 100), 100) };
  const dominant = Object.keys(dna).reduce((x, y) => (dna[x] >= dna[y] ? x : y));
  const score = Math.max(20, Math.min(100, 30 + sv * 10 + Math.round(dna.planning * 0.4) - Math.round((dna.impulsive + dna.emotional) * 0.2)));
  const saveable = Math.round((income || 1000) * 0.12);
  const confidence = Math.min(95, 70 + Math.round(Math.max(...Object.values(dna)) * 0.25));
  return { dominant, dna, score, confidence, saveable, points: 15 };
}
function dailyCheckin(score, wasImpulsive) { return wasImpulsive ? Math.max(0, score - 2) : Math.min(100, score + 3); }
function completeChallenge(score, points = 15) { const nw = Math.min(100, score + points); return { newScore: nw, levelUp: Math.floor(nw / 20) > Math.floor(score / 20), nextTarget: (Math.floor(nw / 20) + 1) * 20 }; }

/* ===================== التطبيق ===================== */
export default function App() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("ar");
  const [tab, setTab] = useState("home");
  const [entries, setEntries] = useState(seedEntries());
  const curWeek = 2;
  const [tx, setTx] = useState([{ amt: 18, place: { ar: "كوفي شوب", en: "Coffee shop" }, cat: "food" }, { amt: 30, place: { ar: "محطة وقود", en: "Gas station" }, cat: "transport" }]);
  const [balance, setBalance] = useState(1240);
  const [points, setPoints] = useState(2450);
  const [savings, setSavings] = useState(8400);
  const [loanTaken, setLoanTaken] = useState(0);
  const [invested, setInvested] = useState(0);
  const [loanOffer, setLoanOffer] = useState(null);
  const [demoPay, setDemoPay] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const [persona, setPersona] = useState(0);
  const [roundOn, setRoundOn] = useState(true);
  const [roundMult, setRoundMult] = useState(1);
  const [roundVault, setRoundVault] = useState(3.6);
  const [assess, setAssess] = useState({ dominant: "social", dna: { planning: 45, social: 72, emotional: 55, impulsive: 60 }, score: 62, confidence: 84, saveable: 120, points: 15 });
  const [initialShell] = useState(() => {
    if (typeof window === "undefined") return { session: null, screen: "splash" };
    const saved = loadSession(window.localStorage);
    const screen = resolveInitialScreen({ hash: window.location.hash, storedScreen: saved.screen, session: saved.session });
    return { session: saved.session, screen: sanitizeScreen(screen, saved.session) };
  });
  const [session, setSession] = useState(initialShell.session);
  const [screen, setScreenState] = useState(initialShell.screen);
  const [toast, setToast] = useState(null);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 420);

  useEffect(() => { injectAssets(); const on = () => setVw(window.innerWidth); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  useEffect(() => applyLanguageMetadata(lang), [lang]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.colorScheme = theme;
    document.body.style.background = themes[theme].bg0;
  }, [theme]);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onHash = () => {
      const routed = screenForHash(window.location.hash);
      if (routed) setScreenState(sanitizeScreen(routed, session));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [session]);
  useEffect(() => {
    if (typeof window === "undefined" || screen === "splash") return;
    const route = SCREEN_HASHES[screen];
    if (route && window.location.hash !== route) {
      window.history.replaceState(null, "", route);
    }
    if (session) saveSession(window.localStorage, session, screen);
    else saveScreen(window.localStorage, screen);
  }, [screen, session]);

  const c = themes[theme];
  const s = L[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const mobile = vw <= 520;
  const wide = vw > 600;
  const sidebar = vw >= 900;
  const maxW = 560;
  const CAT_KEYS = ["food", "transport", "fun", "other"];
  const weekCats = [0, 1, 2, 3].map((wi) => CAT_KEYS.reduce((o, k) => { o[k] = entries.filter((e) => e.week === wi && e.cat === k).reduce((a, e) => a + e.amt, 0); return o; }, {}));
  const cats = CAT_KEYS.reduce((o, k) => { o[k] = weekCats.reduce((a, w) => a + w[k], 0); return o; }, {});
  const weeks = weekCats.map((w) => CAT_KEYS.reduce((a, k) => a + w[k], 0));
  const spent = weeks.reduce((a, b) => a + b, 0);
  const available = STIPEND - spent + loanTaken;
  const nextStipend = STIPEND - loanTaken;

  function setScreen(next) {
    const requested = typeof next === "function" ? next(screen) : next;
    setScreenState(sanitizeScreen(requested, session));
  }
  function startSession(nextSession) {
    if (!nextSession) return false;
    setSession(nextSession);
    if (typeof window !== "undefined") saveSession(window.localStorage, nextSession, "app");
    setScreenState("app");
    return true;
  }
  function enterGuest() { return startSession(createGuestSession()); }
  function logout() {
    if (typeof window !== "undefined") clearSession(window.localStorage);
    setSession(null);
    setScreenState("landing");
  }
  function flash(m) { setToast(m); setTimeout(() => setToast(null), 2400); }
  const pushTx = (t) => setTx((p) => [t, ...p].slice(0, 8));
  function addSpend(cat, amt, place) {
    setEntries((p) => [...p, { id: Date.now(), week: curWeek, cat, amt, place, date: { ar: s.today, en: L.en.today }, time: { ar: s.now, en: L.en.now }, location: { ar: s.yourLoc, en: L.en.yourLoc } }]);
    setBalance((b) => b - amt); pushTx({ amt, place, cat });
    // كنز الفكّة: قرّب لأعلى ريال واسحب الباقي للوعاء
    if (roundOn) {
      const change = (Math.ceil(amt) - amt) * roundMult;
      if (change > 0.001) { setRoundVault((v) => +(v + change).toFixed(2)); setBalance((b) => b - change); }
    }
  }

  const value = {
    c, s, lang, setLang, dir, mobile, theme, setTheme, tab, setTab, cats, weeks, weekCats, entries, setEntries, curWeek, tx, setTx, addSpend, pushTx,
    balance, setBalance, points, setPoints, savings, setSavings, loanTaken, setLoanTaken, invested, setInvested,
    spent, available, nextStipend, loanOffer, setLoanOffer, demoPay, setDemoPay, sheet, setSheet, showLeaderboard, setShowLeaderboard, overlay, setOverlay, persona, setPersona, vw, screen, setScreen, session, startSession, enterGuest, logout, roundOn, setRoundOn, roundMult, setRoundMult, roundVault, setRoundVault, assess, setAssess, flash,
  };
  const appBg = `linear-gradient(180deg, ${c.bg1} 0%, ${c.bg0} 100%)`;

  return (
    <Ctx.Provider value={value}>
      <ScreenTransition screenKey={screen}>
      {screen === "splash" ? <Splash /> : screen === "role" ? <RoleSelect /> : screen === "uniDash" ? <UniDashScreen /> : screen === "bankDash" ? <BankDashScreen /> : screen === "assess" ? <Assessment /> : screen !== "app" ? <Marketing /> : (
      <div data-waey-theme={theme} data-waey-shell style={{ fontFamily: "'IBM Plex Sans Arabic',system-ui,sans-serif", background: appBg, minHeight: "100dvh", display: "flex", justifyContent: "center", color: c.text, transition: "background .3s" }}>
        <div dir={dir} style={{ width: "100%", height: "100dvh", position: "relative", overflow: "hidden", color: c.text, display: "flex", flexDirection: "row", background: appBg, transition: "background .3s" }}>
          {sidebar && <Sidebar />}
          <div style={{ flex: 1, minWidth: 0, position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="wscroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", maxWidth: sidebar ? 780 : maxW, padding: sidebar ? "26px 26px 40px" : "calc(env(safe-area-inset-top,0px) + 14px) 18px 104px", ...(tab === "ai" ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : {}) }}>
              <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: easeOut }} style={{ width: "100%", ...(tab === "ai" ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : {}) }}>
              {tab === "home" && <HomeScreen />}
              {tab === "analytics" && <Analytics />}
              {tab === "ai" && <AIChat />}
              {tab === "invest" && <Invest />}
              {tab === "more" && <MoreScreen />}
              </motion.div>
            </div>
          </div>
          {!sidebar && <BottomNav />}
          </div>
          {loanOffer && <LoanModal />}
          {demoPay && <DemoSheet />}
          {sheet?.type === "transfer" && <TransferSheet />}
          {sheet?.type === "topup" && <TopupSheet />}
          {showLeaderboard && <LeaderboardPage />}
          {overlay === "jobs" && <JobsPage />}
          {overlay === "cashback" && <CashbackPage />}
          {overlay === "platform" && <PlatformPage />}
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast}
                variants={toastVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.24, ease: easeOut }}
                style={{ position: "absolute", bottom: sidebar ? 28 : 108, left: "50%", x: "-50%", background: c.accent, color: c.onAccent, padding: "10px 20px", borderRadius: 999, fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", zIndex: 60, maxWidth: "88%", textAlign: "center" }}
              >
                {riyalText(toast)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}
      </ScreenTransition>
    </Ctx.Provider>
  );
}

function seedEntries() {
  return [
    { id: 1, week: 0, cat: "food", amt: 35, place: { ar: "كافيه الصباح", en: "Morning Café" }, date: { ar: "2 يونيو", en: "Jun 2" }, time: { ar: "9:14 ص", en: "9:14 AM" }, location: { ar: "حي الروضة، جدة", en: "Al Rawdah, Jeddah" } },
    { id: 2, week: 0, cat: "food", amt: 30, place: { ar: "مطعم شاورما", en: "Shawarma Spot" }, date: { ar: "4 يونيو", en: "Jun 4" }, time: { ar: "2:40 م", en: "2:40 PM" }, location: { ar: "حي السلامة، جدة", en: "Al Salamah, Jeddah" } },
    { id: 3, week: 0, cat: "food", amt: 25, place: { ar: "بقالة الحي", en: "Corner Store" }, date: { ar: "6 يونيو", en: "Jun 6" }, time: { ar: "7:05 م", en: "7:05 PM" }, location: { ar: "حي النعيم، جدة", en: "Al Naeem, Jeddah" } },
    { id: 4, week: 0, cat: "transport", amt: 50, place: { ar: "محطة وقود", en: "Gas Station" }, date: { ar: "3 يونيو", en: "Jun 3" }, time: { ar: "8:30 ص", en: "8:30 AM" }, location: { ar: "طريق الأمير سلطان", en: "Prince Sultan Rd" } },
    { id: 5, week: 0, cat: "fun", amt: 50, place: { ar: "سينما", en: "Cinema" }, date: { ar: "5 يونيو", en: "Jun 5" }, time: { ar: "9:20 م", en: "9:20 PM" }, location: { ar: "ريد سي مول", en: "Red Sea Mall" } },
    { id: 6, week: 0, cat: "other", amt: 20, place: { ar: "صيدلية", en: "Pharmacy" }, date: { ar: "7 يونيو", en: "Jun 7" }, time: { ar: "11:10 ص", en: "11:10 AM" }, location: { ar: "حي الروضة، جدة", en: "Al Rawdah, Jeddah" } },
    { id: 7, week: 1, cat: "food", amt: 55, place: { ar: "مطعم برجر", en: "Burger Joint" }, date: { ar: "9 يونيو", en: "Jun 9" }, time: { ar: "8:50 م", en: "8:50 PM" }, location: { ar: "كورنيش جدة", en: "Jeddah Corniche" } },
    { id: 8, week: 1, cat: "food", amt: 35, place: { ar: "كوفي شوب", en: "Coffee Shop" }, date: { ar: "11 يونيو", en: "Jun 11" }, time: { ar: "10:25 ص", en: "10:25 AM" }, location: { ar: "حي الزهراء، جدة", en: "Al Zahra, Jeddah" } },
    { id: 9, week: 1, cat: "transport", amt: 40, place: { ar: "أوبر", en: "Uber" }, date: { ar: "10 يونيو", en: "Jun 10" }, time: { ar: "1:15 م", en: "1:15 PM" }, location: { ar: "جامعة جدة", en: "University of Jeddah" } },
    { id: 10, week: 1, cat: "fun", amt: 70, place: { ar: "ألعاب إلكترونية", en: "Game Store" }, date: { ar: "12 يونيو", en: "Jun 12" }, time: { ar: "6:40 م", en: "6:40 PM" }, location: { ar: "مول العرب", en: "Mall of Arabia" } },
    { id: 11, week: 1, cat: "other", amt: 40, place: { ar: "متجر ملابس", en: "Clothing Store" }, date: { ar: "14 يونيو", en: "Jun 14" }, time: { ar: "5:30 م", en: "5:30 PM" }, location: { ar: "ريد سي مول", en: "Red Sea Mall" } },
    { id: 12, week: 2, cat: "food", amt: 18, place: { ar: "كوفي شوب", en: "Coffee Shop" }, date: { ar: "15 يونيو", en: "Jun 15" }, time: { ar: "9:05 ص", en: "9:05 AM" }, location: { ar: "جامعة جدة", en: "University of Jeddah" } },
    { id: 13, week: 2, cat: "food", amt: 12, place: { ar: "مطعم سريع", en: "Fast Food" }, date: { ar: "17 يونيو", en: "Jun 17" }, time: { ar: "3:20 م", en: "3:20 PM" }, location: { ar: "حي السلامة، جدة", en: "Al Salamah, Jeddah" } },
    { id: 14, week: 2, cat: "transport", amt: 30, place: { ar: "محطة وقود", en: "Gas Station" }, date: { ar: "16 يونيو", en: "Jun 16" }, time: { ar: "8:10 ص", en: "8:10 AM" }, location: { ar: "طريق المدينة", en: "Madinah Rd" } },
    { id: 15, week: 2, cat: "other", amt: 30, place: { ar: "مكتبة قرطاسية", en: "Stationery Store" }, date: { ar: "18 يونيو", en: "Jun 18" }, time: { ar: "12:45 م", en: "12:45 PM" }, location: { ar: "جامعة جدة", en: "University of Jeddah" } },
  ];
}

/* ===================== شاشة البداية Splash ===================== */
function Splash() {
  const { c, s, dir, setScreen, theme } = useCtx();
  const scope = useRef(null);

  useEffect(() => { const t = setTimeout(() => setScreen("landing"), 2400); return () => clearTimeout(t); }, [setScreen]);

  useGsap(scope, (gsap, { reduce }) => {
    if (reduce) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".splash-mark", { y: 18, scale: 0.92, opacity: 0, duration: 0.55 })
      .from(".splash-title", { y: 16, opacity: 0, duration: 0.42 }, "-=0.22")
      .from(".splash-chip", { y: 10, opacity: 0, stagger: 0.08, duration: 0.34 }, "-=0.16")
      .fromTo(".splash-progress", { scaleX: 0 }, { scaleX: 1, duration: 1.4, transformOrigin: "left center" }, "-=0.14")
      .to(".splash-mark", { y: -5, repeat: 1, yoyo: true, duration: 0.36, ease: "sine.inOut" }, "-=1.1");
  }, []);

  return (
    <button
      ref={scope}
      type="button"
      dir={dir}
      data-waey-theme={theme}
      data-waey-shell
      aria-label={s.splash.start}
      onClick={() => setScreen("landing")}
      style={{ fontFamily: "'IBM Plex Sans Arabic',system-ui,sans-serif", background: c.page, color: c.text, height: "100dvh", width: "100%", border: "none", padding: 0, display: "grid", placeItems: "center", cursor: "pointer", position: "relative", overflow: "hidden" }}
    >
      <WaeyFlowField tone={theme} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div className="splash-mark" style={{ borderRadius: 24, boxShadow: `0 32px 80px -34px ${c.accent}`, lineHeight: 0 }}>
          <WaeyMark size={104} />
        </div>
        <div className="splash-title" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 850 }}>{s.brand}</div>
          <div style={{ fontSize: 14, color: c.muted, marginTop: 6 }}>{s.splash.tagline}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {[s.nav.home, s.nav.analytics, s.nav.ai].map((label) => (
            <span key={label} className="splash-chip" style={{ border: `1px solid ${c.line}`, background: "rgba(255,255,255,0.68)", borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: c.textSoft }}>
              {label}
            </span>
          ))}
        </div>
        <div style={{ width: 150, height: 5, borderRadius: 999, background: c.card2, overflow: "hidden", marginTop: 4 }}>
          <div className="splash-progress" style={{ height: "100%", background: `linear-gradient(90deg, ${c.accent}, ${c.green})`, borderRadius: 999, transformOrigin: "left center" }} />
        </div>
      </div>
    </button>
  );
}
/* ===================== اختيار الدور + لوحات الجامعة والبنك ===================== */
function RoleShell({ title, sub, onBack, children }) {
  const { c, lang, dir, s, theme } = useCtx();
  const Back = lang === "ar" ? ChevronRight : ChevronLeft;
  const scope = useRef(null);
  useGsap(scope, (gsap, { reduce }) => {
    if (reduce || !scope.current) return;
    gsap.from(Array.from(scope.current.children), { y: 16, opacity: 0, stagger: 0.06, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" });
  }, []);
  return (
    <div dir={dir} data-waey-theme={theme} data-waey-shell style={{ fontFamily: "'IBM Plex Sans Arabic',system-ui,sans-serif", background: c.page, color: c.text, height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "calc(env(safe-area-inset-top,0px) + 16px) 18px 12px", flexShrink: 0 }}>
        {onBack && <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, background: c.card, border: `1px solid ${c.line}`, color: c.text, display: "grid", placeItems: "center", cursor: "pointer" }}><Back size={20} /></button>}
        <div><div style={{ fontSize: 19, fontWeight: 800 }}>{title}</div>{sub && <div style={{ fontSize: 11.5, color: c.muted }}>{sub}</div>}</div>
      </div>
      <div className="wscroll" style={{ flex: 1, overflowY: "auto", padding: "4px 18px 28px" }}><div ref={scope} style={{ maxWidth: 560, margin: "0 auto" }}>{children}</div></div>
    </div>
  );
}
function RoleSelect() {
  const { c, s, lang, dir, setScreen } = useCtx();
  const R = s.role;
  const roles = [
    [GraduationCap, R.student, R.studentD, c.accent, () => setScreen("assess")],
    [Landmark, R.uni, R.uniD, c.accentText, () => setScreen("uniDash")],
    [Building2, R.bank, R.bankD, c.terra, () => setScreen("bankDash")],
  ];
  const Fwd = lang === "ar" ? ArrowLeft : ArrowRight;
  return (
    <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic',system-ui,sans-serif", background: c.bg0, color: c.text, height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(env(safe-area-inset-top,0px) + 16px) 18px 8px" }}>
        <button type="button" onClick={() => setScreen("landing")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "none", border: "none", color: c.text, fontFamily: "inherit", padding: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, display: "grid", placeItems: "center" }}><Sparkles size={16} color="#fff" /></div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>{s.brand}</span>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px 20px 32px" }}>
        <div style={{ width: "100%", maxWidth: 460, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 25, fontWeight: 800 }}>{R.title}</div>
            <div style={{ fontSize: 13.5, color: c.muted, marginTop: 8, lineHeight: 1.6 }}>{R.sub}</div>
          </div>
          <motion.div initial="hidden" animate="visible" variants={revealContainer} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {roles.map(([Icon, name, desc, col, go], i) => (
              <motion.button key={i} type="button" onClick={go} variants={revealItem} whileHover={{ y: -3, boxShadow: "0 24px 60px -34px rgba(15,34,48,0.45)" }} whileTap={{ scale: 0.98 }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: c.card, border: `1px solid ${c.line}`, borderRadius: 22, padding: 18, cursor: "pointer", position: "relative", color: c.text, fontFamily: "inherit", textAlign: "start" }}>
                <IconBubble icon={Icon} color={col} bg={col + "22"} size={27} box={54} radius={16} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{name}</div>
                  <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.6, marginTop: 2 }}>{desc}</div>
                </div>
                <Fwd size={18} color={col} style={{ flexShrink: 0 }} />
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
function DashStat({ label, value, col, c, delta }) {
  return <div style={{ flex: 1, textAlign: "center", background: c.card2, borderRadius: 16, padding: "14px 6px" }}><div style={{ fontSize: 24, fontWeight: 800, color: col }}><Metric value={value} /></div><div style={{ fontSize: 10, color: c.muted, marginTop: 3 }}>{label}</div>{delta != null && <div style={{ fontSize: 9.5, color: c.green, marginTop: 2 }}>▲ <Metric value={delta} /></div>}</div>;
}
function Segmented({ options, value, onChange, c }) {
  return (
    <div style={{ display: "flex", gap: 4, background: c.card2, borderRadius: 12, padding: 4 }}>
      {options.map((o, i) => <button key={i} onClick={() => onChange(i)} style={{ flex: 1, padding: "7px 6px", borderRadius: 9, border: "none", background: value === i ? c.accent : "transparent", color: value === i ? c.onAccent : c.muted, fontWeight: 700, fontFamily: "inherit", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>{o}</button>)}
    </div>
  );
}
function Tabs({ options, value, onChange, c }) {
  return (
    <div className="whz" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
      {options.map((o, i) => <button key={i} onClick={() => onChange(i)} style={{ padding: "8px 14px", borderRadius: 999, border: value === i ? "none" : `1px solid ${c.line}`, background: value === i ? c.text : "transparent", color: value === i ? c.bg0 : c.muted, fontWeight: 700, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{o}</button>)}
    </div>
  );
}
function BarRow({ n, pct, col, c, onClick, sub }) {
  const content = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span style={{ color: c.textSoft }}>{n}</span><span style={{ fontWeight: 700 }}><Metric value={`${pct}%`} /></span></div>
      <div style={{ height: 8, borderRadius: 9, background: c.card2, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 9, transition: "width .5s" }} /></div>
      {sub && <div style={{ fontSize: 10.5, color: c.muted, marginTop: 4 }}>{sub}</div>}
    </>
  );
  const style = { marginBottom: 12, cursor: onClick ? "pointer" : "default", width: "100%", background: "transparent", border: "none", padding: 0, color: c.text, fontFamily: "inherit", textAlign: "start" };
  return onClick ? (
    <button type="button" onClick={onClick} style={style}>{content}</button>
  ) : (
    <div style={style}>{content}</div>
  );
}
function MiniBars({ data, c, col }) {
  const mx = Math.max(...data.map((d) => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: col }}><Metric value={d.v} /></div>
          <div style={{ width: "100%", maxWidth: 30, height: `${(d.v / mx) * 52}px`, background: col, borderRadius: 7, transition: "height .5s" }} />
          <div style={{ fontSize: 9.5, color: c.muted }}>{d.l}</div>
        </div>
      ))}
    </div>
  );
}
const PERIOD_MULT = [0.82, 1, 1.14];
const COLLEGE_MULT = [1.08, 0.96, 1.02, 1.05, 0.93];
function scaleUp(base, p, col) { const m = PERIOD_MULT[p] * (col == null ? 1 : COLLEGE_MULT[col]); return Math.round(base * m); }
function clampPct(v) { return Math.max(2, Math.min(99, v)); }
function Donut({ data, c, size = 140 }) {
  const total = data.reduce((s, d) => s + d.v, 0) || 1;
  const r = size / 2 - 14, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {data.map((d, i) => {
          const frac = d.v / total, len = frac * circ;
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.col} strokeWidth={16} strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} strokeLinecap="butt" />;
          offset += len; return el;
        })}
        <circle cx={cx} cy={cy} r={r - 16} fill={c.card} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: d.col, flexShrink: 0 }} />
            <span style={{ color: c.textSoft }}>{d.l}</span>
            <span style={{ fontWeight: 700, marginInlineStart: "auto" }}><Metric value={`${Math.round((d.v / total) * 100)}%`} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}
function Heatmap({ rows, cols, grid, c, accent }) {
  const mx = Math.max(...grid.flat(), 1);
  return (
    <div style={{ overflowX: "auto" }} className="whz">
      <div style={{ display: "grid", gridTemplateColumns: `auto repeat(${cols.length}, 1fr)`, gap: 4, minWidth: 300 }}>
        <div />
        {cols.map((cl, i) => <div key={i} style={{ fontSize: 9.5, color: c.muted, textAlign: "center", paddingBottom: 2 }}>{cl}</div>)}
        {rows.map((rw, ri) => (
          <Fragment key={ri}>
            <div style={{ fontSize: 10, color: c.textSoft, display: "flex", alignItems: "center", paddingInlineEnd: 6, whiteSpace: "nowrap" }}>{rw}</div>
            {cols.map((_, ci) => {
              const v = grid[ri][ci], a = 0.12 + (v / mx) * 0.88;
              return <div key={ci} title={`${v}`} style={{ aspectRatio: "1", borderRadius: 6, background: accent, opacity: a, minHeight: 22 }} />;
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
function Gauge({ value, c, label, low, mid, high }) {
  const seg = value < 40 ? low : value < 70 ? mid : high;
  const col = value < 40 ? c.terraText : value < 70 ? c.accentText : c.green;
  const r = 46, circ = Math.PI * r, len = (value / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M14 62 A46 46 0 0 1 106 62" fill="none" stroke={c.card2} strokeWidth={11} strokeLinecap="round" />
        <path d="M14 62 A46 46 0 0 1 106 62" fill="none" stroke={col} strokeWidth={11} strokeLinecap="round" strokeDasharray={`${len} ${circ}`} />
      </svg>
      <div style={{ fontSize: 24, fontWeight: 800, color: col, marginTop: -14 }}><Metric value={value} /></div>
      <div style={{ fontSize: 11, color: c.muted }}>{label} · {seg}</div>
    </div>
  );
}
function UniDashScreen() {
  const { c, s, lang, setScreen } = useCtx();
  const P = s.plat, D = s.dash;
  const [period, setPeriod] = useState(1);
  const [tab, setTab] = useState(0);
  const [college, setCollege] = useState(-1);
  const [sel, setSel] = useState(null);
  const cm = college < 0 ? null : college;
  const students = scaleUp(4250, period, cm).toLocaleString("en-US");
  const awareness = clampPct(scaleUp(64, period, cm));
  const completion = clampPct(scaleUp(78, period, cm));
  const personas = [[lang === "ar" ? PERSONA_META.social.ar : PERSONA_META.social.en, clampPct(scaleUp(34, period, cm)), c.accentText], [lang === "ar" ? PERSONA_META.impulsive.ar : PERSONA_META.impulsive.en, clampPct(scaleUp(27, period, cm)), c.terraText], [lang === "ar" ? PERSONA_META.emotional.ar : PERSONA_META.emotional.en, clampPct(scaleUp(22, period, cm)), c.terra], [lang === "ar" ? PERSONA_META.planning.ar : PERSONA_META.planning.en, clampPct(scaleUp(17, period, cm)), c.green]];
  const challenges = [[lang === "ar" ? "لا مطاعم بعد 8 مساءً" : "No restaurants after 8 PM", 84, 71], [lang === "ar" ? "انتظر 24 ساعة قبل الشراء" : "Wait 24h before buying", 79, 63], [lang === "ar" ? "سجّل شعورك قبل الشراء" : "Log mood before buying", 72, 58], [lang === "ar" ? "زد ادخارك 5%" : "Increase savings 5%", 68, 54]];
  const colleges = D.colleges.map((n, i) => [n, clampPct(Math.round(64 * COLLEGE_MULT[i] * PERIOD_MULT[period])), Math.round(4250 * COLLEGE_MULT[i] / 5)]);
  const trend = period === 0 ? [{ l: "S", v: 58 }, { l: "M", v: 60 }, { l: "T", v: 61 }, { l: "W", v: 63 }, { l: "T", v: 64 }, { l: "F", v: 66 }] : [{ l: "1", v: 55 }, { l: "2", v: 59 }, { l: "3", v: 62 }, { l: "4", v: 64 }, { l: "5", v: 68 }, { l: "6", v: 71 }];
  if (sel) {
    const [n, pct, col] = sel;
    return (
      <RoleShell title={D.detailFor(n)} onBack={() => setSel(null)}>
        <div style={{ textAlign: "center", background: c.card, border: `1px solid ${c.line}`, borderRadius: 22, padding: 22, marginBottom: 14 }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: col }}><Metric value={`${pct}%`} /></div>
          <div style={{ fontSize: 13, color: c.muted }}>{n} · {D.share}</div>
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: c.accentText }}>{D.trend}</div>
          <MiniBars data={trend} c={c} col={col} />
        </div>
        <PrivacyNote c={c}>{D.anon}</PrivacyNote>
      </RoleShell>
    );
  }
  return (
    <RoleShell title={s.role.uni} sub={P.uniDash} onBack={() => setScreen("role")}>
      <div style={{ marginBottom: 12 }}><Segmented options={D.period} value={period} onChange={setPeriod} c={c} /></div>
      <div style={{ marginBottom: 14 }}><Tabs options={D.tabsUni} value={tab} onChange={setTab} c={c} /></div>
      {tab === 0 && (<>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <DashStat label={D.participation} value={students} col={c.accent} c={c} delta="6%" />
          <DashStat label={D.awareness} value={`${awareness}%`} col={c.accentText} c={c} delta="4%" />
          <DashStat label={D.completion} value={`${completion}%`} col={c.green} c={c} delta="9%" />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <DashStat label={D.savedTotal} value={`1.9${D.unitM}`} col={c.green} c={c} delta="12%" />
          <DashStat label={D.avgSave} value={`${scaleUp(447, period, cm)}`} col={c.accent} c={c} delta="7%" />
          <DashStat label={D.invPart} value={`${clampPct(scaleUp(23, period, cm))}%`} col={c.terra} c={c} delta="5%" />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 16, display: "grid", placeItems: "center" }}><Gauge value={awareness} c={c} label={D.wellness} low={D.wellLow} mid={D.wellMid} high={D.wellHigh} /></div>
          <div style={{ flex: 1, background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 16, display: "grid", placeItems: "center" }}><Gauge value={clampPct(scaleUp(71, period, cm))} c={c} label={D.litScore} low={D.wellLow} mid={D.wellMid} high={D.wellHigh} /></div>
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: c.accentText }}>{lang === "ar" ? "تطوّر متوسط الوعي المالي" : "Financial awareness over time"}</div>
          <div style={{ fontSize: 11, color: c.muted, marginBottom: 12 }}>{lang === "ar" ? "المحور: النسبة من 100 · لكل فترة" : "Axis: score out of 100 · per period"}</div>
          <MiniBars data={trend} c={c} col={c.accent} />
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: c.accentText }}>{D.spendHeat}</div>
          <div style={{ fontSize: 11, color: c.muted, marginBottom: 14 }}>{lang === "ar" ? "كل مربّع = كثافة الإنفاق (أغمق = أعلى) لكل فئة عبر أيام الأسبوع" : "Each cell = spending intensity (darker = higher) per category across weekdays"}</div>
          <Heatmap rows={[D.catFood, D.catTrans, D.catFun, D.catShop, D.catBills]} cols={D.days} c={c} accent={c.accent} grid={[[9, 5, 6, 5, 7, 8, 10], [4, 3, 5, 4, 6, 5, 7], [3, 2, 4, 3, 5, 9, 8], [2, 4, 3, 6, 4, 7, 5], [6, 1, 2, 1, 3, 2, 4]]} />
        </div>
        <div style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, color: c.onAccent, borderRadius: 18, padding: 16, fontSize: 13, fontWeight: 600, lineHeight: 1.7 }}><Sparkles size={16} style={{ verticalAlign: "middle", marginInlineEnd: 6 }} />{D.insightUni}</div>
      </>)}
      {tab === 1 && (<>
        <div style={{ marginBottom: 14 }}><Segmented options={[D.allColleges, ...D.colleges.slice(0, 2)]} value={college < 0 ? 0 : Math.min(college + 1, 2)} onChange={(i) => setCollege(i === 0 ? -1 : i - 1)} c={c} /></div>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18, marginBottom: 14 }}>
          <Donut c={c} data={personas.map(([n, pct, col]) => ({ l: n, v: pct, col }))} />
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14, color: c.accentText }}>{D.personaMix}</div>
          {personas.map(([n, pct, col]) => <BarRow key={n} n={n} pct={pct} col={col} c={c} onClick={() => setSel([n, pct, col])} sub={D.tapForDetail} />)}
        </div>
      </>)}
      {tab === 2 && (
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14, color: c.accentText }}>{D.chTitle}</div>
          {challenges.map(([n, acc, done]) => (
            <div key={n} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${c.line}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{n}</div>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, color: c.muted, marginBottom: 3 }}>{D.chAccept} <Metric value={`${acc}%`} /></div><div style={{ height: 6, borderRadius: 9, background: c.card2 }}><div style={{ height: "100%", width: `${acc}%`, background: c.accentText, borderRadius: 9 }} /></div></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, color: c.muted, marginBottom: 3 }}>{D.chDone} <Metric value={`${done}%`} /></div><div style={{ height: 6, borderRadius: 9, background: c.card2 }}><div style={{ height: "100%", width: `${done}%`, background: c.green, borderRadius: 9 }} /></div></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 3 && (
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14, color: c.accentText }}>{D.collegeTitle}</div>
          {colleges.map(([n, pct, cnt], i) => <BarRow key={n} n={`${n}`} pct={pct} col={LB_COLORS[i % LB_COLORS.length]} c={c} onClick={() => setSel([n, pct, LB_COLORS[i % LB_COLORS.length]])} sub={<><Metric value={cnt.toLocaleString("en-US")} /> {D.students}</>} />)}
        </div>
      )}
      <PrivacyNote c={c} style={{ marginTop: 14 }}>{D.anon}</PrivacyNote>
    </RoleShell>
  );
}
function BankDashScreen() {
  const { c, s, lang, setScreen } = useCtx();
  const P = s.plat, D = s.dash;
  const [period, setPeriod] = useState(1);
  const [tab, setTab] = useState(0);
  const [sel, setSel] = useState(null);
  const [rankBy, setRankBy] = useState(0);
  const [region, setRegion] = useState(0);
  const rankBase = [
    { n: s.dash.uniList[0], region: 0, v: [1240, 82, 71] },
    { n: s.dash.uniList[1], region: 0, v: [1180, 78, 68] },
    { n: s.dash.uniList[2], region: 0, v: [960, 74, 64] },
    { n: s.dash.uniList[3], region: 1, v: [1090, 70, 66] },
    { n: s.dash.uniList[4], region: 1, v: [820, 66, 61] },
  ];
  const regionFilter = region === 0 ? rankBase : rankBase.filter((u) => u.region === region - 1);
  const ranking = (regionFilter.length ? regionFilter : rankBase).map((u) => ({ n: u.n, v: u.v[rankBy] })).sort((a, b) => b.v - a.v);
  const aware = clampPct(scaleUp(64, period, null));
  const users = (scaleUp(4200, period, null) / 1000).toFixed(1) + "K";
  const personas = [[lang === "ar" ? PERSONA_META.social.ar : PERSONA_META.social.en, clampPct(scaleUp(34, period, null)), c.accentText], [lang === "ar" ? PERSONA_META.impulsive.ar : PERSONA_META.impulsive.en, clampPct(scaleUp(27, period, null)), c.terraText], [lang === "ar" ? PERSONA_META.emotional.ar : PERSONA_META.emotional.en, clampPct(scaleUp(22, period, null)), c.terra], [lang === "ar" ? PERSONA_META.planning.ar : PERSONA_META.planning.en, clampPct(scaleUp(17, period, null)), c.green]];
  const habits = [[lang === "ar" ? "قهوة يومية خارجية" : "Daily takeaway coffee", clampPct(scaleUp(62, period, null)), c.terra], [lang === "ar" ? "شراء اندفاعي بالخصومات" : "Impulse buys on discounts", clampPct(scaleUp(48, period, null)), c.terraText], [lang === "ar" ? "طلبات توصيل متكررة" : "Frequent delivery orders", clampPct(scaleUp(41, period, null)), c.accentText], [lang === "ar" ? "لا ادخار شهري" : "No monthly savings", clampPct(scaleUp(35, period, null)), c.accent]];
  const ages = [{ l: "18-20", v: 46 }, { l: "21-22", v: 36 }, { l: "23-24", v: 14 }, { l: "25+", v: 4 }];
  if (sel) {
    const [n, pct, col] = sel;
    const trend = [{ l: "1", v: Math.round(pct * 0.8) }, { l: "2", v: Math.round(pct * 0.88) }, { l: "3", v: Math.round(pct * 0.94) }, { l: "4", v: pct }, { l: "5", v: Math.min(99, Math.round(pct * 1.05)) }];
    return (
      <RoleShell title={D.detailFor(n)} onBack={() => setSel(null)}>
        <div style={{ textAlign: "center", background: c.card, border: `1px solid ${c.line}`, borderRadius: 22, padding: 22, marginBottom: 14 }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: col }}><Metric value={`${pct}%`} /></div>
          <div style={{ fontSize: 13, color: c.muted }}>{n} · {D.share}</div>
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: c.terra }}>{D.trend}</div>
          <MiniBars data={trend} c={c} col={col} />
        </div>
        <PrivacyNote c={c}>{D.anon}</PrivacyNote>
      </RoleShell>
    );
  }
  return (
    <RoleShell title={s.role.bank} sub={P.bankDash} onBack={() => setScreen("role")}>
      <div style={{ marginBottom: 12 }}><Segmented options={D.period} value={period} onChange={setPeriod} c={c} /></div>
      <div style={{ marginBottom: 14 }}><Tabs options={D.tabsBank} value={tab} onChange={setTab} c={c} /></div>
      {tab === 0 && (<>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <DashStat label={D.awareness} value={`${aware}%`} col={c.accent} c={c} delta="4%" />
          <DashStat label={D.activeUsers} value={users} col={c.accentText} c={c} delta="8%" />
          <DashStat label={lang === "ar" ? "أعمار 18–24" : "Ages 18–24"} value="82%" col={c.terra} c={c} />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <DashStat label={D.savedTotal} value={`8.4${D.unitM}`} col={c.green} c={c} delta="14%" />
          <DashStat label={lang === "ar" ? "جامعات" : "Universities"} value="5" col={c.accentText} c={c} />
          <DashStat label={D.invPart} value={`${clampPct(scaleUp(21, period, null))}%`} col={c.terra} c={c} delta="6%" />
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: c.accentText }}>{D.ranking}</div>
            <div style={{ display: "flex", gap: 5 }}>{[D.rankSavings, D.rankEngage, D.rankAware].map((m, i) => <button key={i} onClick={() => setRankBy(i)} style={{ padding: "5px 10px", borderRadius: 999, border: rankBy === i ? "none" : `1px solid ${c.line}`, background: rankBy === i ? c.accent : "transparent", color: rankBy === i ? c.onAccent : c.muted, fontSize: 10.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{m}</button>)}</div>
          </div>
          <div style={{ marginBottom: 12 }}><Segmented options={[D.allRegions, ...D.regions]} value={region} onChange={setRegion} c={c} /></div>
          {ranking.map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < ranking.length - 1 ? `1px solid ${c.line}` : "none" }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, background: i < 3 ? c.accent : c.card2, color: i < 3 ? c.onAccent : c.muted, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{u.n}</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: c.accent }}><Metric value={rankBy === 0 ? `${u.v} ${D.unitK}` : `${u.v}%`} /></div>
            </div>
          ))}
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: c.accentText }}>{lang === "ar" ? "توزيع المستخدمين حسب العمر" : "Users by age group"}</div>
          <div style={{ fontSize: 11, color: c.muted, marginBottom: 12 }}>{lang === "ar" ? "النسبة % من إجمالي المستخدمين" : "% of total users"}</div>
          <MiniBars data={ages} c={c} col={c.accentText} />
        </div>
        <div style={{ background: `linear-gradient(135deg, ${c.terra}, ${c.terraText})`, color: c.onTerra, borderRadius: 18, padding: 16, fontSize: 13, fontWeight: 600, lineHeight: 1.7 }}><Sparkles size={16} style={{ verticalAlign: "middle", marginInlineEnd: 6 }} />{D.insightBank}</div>
      </>)}
      {tab === 1 && (
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14, color: c.accentText }}>{D.personaMix}</div>
          <div style={{ marginBottom: 16 }}><Donut c={c} data={personas.map(([n, pct, col]) => ({ l: n, v: pct, col }))} /></div>
          {personas.map(([n, pct, col]) => <BarRow key={n} n={n} pct={pct} col={col} c={c} onClick={() => setSel([n, pct, col])} sub={D.tapForDetail} />)}
        </div>
      )}
      {tab === 2 && (
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4, color: c.terra }}>{D.habitsTitle}</div>
          <div style={{ fontSize: 11, color: c.muted, marginBottom: 14 }}>{lang === "ar" ? "اضغط أي عادة لتفاصيلها" : "Tap any habit for details"}</div>
          {habits.map(([n, pct, col]) => <BarRow key={n} n={n} pct={pct} col={col} c={c} onClick={() => setSel([n, pct, col])} sub={D.tapForDetail} />)}
        </div>
      )}
      {tab === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: c.accentText }}>{D.oppTitle}</div>
          {D.opps.map(([t, d], i) => (
            <div key={i} style={{ display: "flex", gap: 12, background: c.card, border: `1px solid ${c.line}`, borderRadius: 16, padding: 15 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: c.accent + "22", display: "grid", placeItems: "center", flexShrink: 0 }}><Target size={16} color={c.accent} /></div>
              <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</div><div style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.6, marginTop: 2 }}>{d}</div></div>
            </div>
          ))}
        </div>
      )}
      <PrivacyNote c={c} style={{ marginTop: 14 }}>{D.anon}</PrivacyNote>
    </RoleShell>
  );
}

/* ===================== التقييم السلوكي (Onboarding + Assessment + WOW) ===================== */
function AsTopBar() {
  const { c, lang, setLang, theme, setTheme, s } = useCtx();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(env(safe-area-inset-top,0px) + 14px) 18px 8px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, display: "grid", placeItems: "center" }}><Sparkles size={16} color="#fff" /></div>
        <span style={{ fontWeight: 800, fontSize: 16 }}>{s.brand}</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{ width: 34, height: 34, borderRadius: 10, background: c.card, border: `1px solid ${c.line}`, color: c.text, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>{lang === "ar" ? "EN" : "ع"}</button>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ width: 34, height: 34, borderRadius: 10, background: c.card, border: `1px solid ${c.line}`, color: c.text, cursor: "pointer", display: "grid", placeItems: "center" }}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
      </div>
    </div>
  );
}
function Chips({ options, value, onChange, c }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o, i) => {
        const on = value === i;
        return <button key={i} onClick={() => onChange(i)} style={{ padding: "9px 15px", borderRadius: 12, border: on ? "none" : `1px solid ${c.line}`, background: on ? c.accent : c.card, color: on ? c.onAccent : c.text, fontWeight: on ? 700 : 500, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>{o}</button>;
      })}
    </div>
  );
}
function Assessment() {
  const { c, s, lang, dir, setScreen, setPersona, setAssess, enterGuest } = useCtx();
  const A = s.as;
  const [step, setStep] = useState("intro");
  const [slide, setSlide] = useState(0);
  const [profile, setProfile] = useState({ age: 0, uni: 0, city: 0, income: 1, source: 0, goal: 0 });
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (step !== "loading") return;
    const incomeKey = A.incomes[profile.income][0];
    const income = INCOME_MAP[incomeKey] || 1000;
    const ansKeys = {}; ASSESS_Q.forEach((q, i) => { ansKeys["q" + (i + 1)] = answers[i]; });
    const r = analyzeBehavior(ansKeys, income);
    const t = setTimeout(() => { setResult(r); setStep("result"); }, 2600);
    return () => clearTimeout(t);
  }, [step]);

  function answer(k) { setAnswers((a) => ({ ...a, [qi]: k })); if (qi < ASSESS_Q.length - 1) setTimeout(() => setQi((v) => v + 1), 160); else setTimeout(() => setStep("loading"), 160); }
  function finish() { const map = { social: 0, emotional: 1, impulsive: 2, planning: 0 }; setPersona(map[result.dominant] ?? 0); if (result) setAssess(result); enterGuest(); }
  function skip() { enterGuest(); }
  const Fwd = lang === "ar" ? ArrowLeft : ArrowRight;
  const wrap = { fontFamily: "'IBM Plex Sans Arabic',system-ui,sans-serif", background: c.bg0, color: c.text, height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" };
  const body = { flex: 1, overflowY: "auto", padding: "8px 20px 28px", display: "flex", flexDirection: "column" };
  const inner = { width: "100%", maxWidth: 480, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" };

  if (step === "intro") {
    const last = slide === A.introTitle.length - 1;
    const icons = [<Brain size={40} color={c.onAccent} />, <Zap size={40} color={c.onAccent} />, <Check size={40} color={c.onAccent} />];
    return (
      <div dir={dir} style={wrap}><AsTopBar />
        <div style={body}><div style={{ ...inner, justifyContent: "center", textAlign: "center", gap: 22 }}>
          <div style={{ width: 88, height: 88, borderRadius: 26, background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, display: "grid", placeItems: "center", margin: "0 auto" }}>{icons[slide]}</div>
          <div><div style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.4 }}>{A.introTitle[slide]}</div><div style={{ fontSize: 14, color: c.muted, marginTop: 10, lineHeight: 1.7 }}>{A.introSub[slide]}</div></div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>{A.introTitle.map((_, i) => <span key={i} style={{ width: i === slide ? 22 : 7, height: 7, borderRadius: 9, background: i === slide ? c.accent : c.line, transition: "all .2s" }} />)}</div>
          <button onClick={() => (last ? setStep("profile") : setSlide(slide + 1))} style={btn(c.accent, c.onAccent)}>{last ? A.start : A.next}</button>
          <button onClick={skip} style={{ background: "none", border: "none", color: c.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 6, marginTop: 2 }}>{A.skip} ›</button>
        </div></div>
      </div>
    );
  }
  if (step === "profile") {
    const groups = [[A.age, A.ages, "age"], [A.uni, A.unis, "uni"], [A.city, A.cities, "city"], [A.income, A.incomes.map((x) => x[1]), "income"], [A.source, A.sources, "source"], [A.goal, A.goals, "goal"]];
    return (
      <div dir={dir} style={wrap}><AsTopBar />
        <div style={body}><div style={inner}>
          <div style={{ fontSize: 21, fontWeight: 800 }}>{A.profileTitle}</div>
          <div style={{ fontSize: 13, color: c.muted, marginBottom: 18 }}>{A.profileSub}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
            {groups.map(([label, opts, key]) => (
              <div key={key}><div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 9 }}>{label}</div><Chips options={opts} value={profile[key]} onChange={(i) => setProfile((p) => ({ ...p, [key]: i }))} c={c} /></div>
            ))}
          </div>
          <button onClick={() => setStep("quiz")} style={{ ...btn(c.accent, c.onAccent), marginTop: 20 }}>{A.continue}</button>
          <button onClick={skip} style={{ background: "none", border: "none", color: c.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 6, marginTop: 6, alignSelf: "center" }}>{A.skip} ›</button>
        </div></div>
      </div>
    );
  }
  if (step === "quiz") {
    const q = ASSESS_Q[qi]; const pct = ((qi) / ASSESS_Q.length) * 100;
    return (
      <div dir={dir} style={wrap}><AsTopBar />
        <div style={body}><div style={inner}>
          <div style={{ height: 6, borderRadius: 9, background: c.card2, overflow: "hidden", marginBottom: 8 }}><div style={{ height: "100%", width: `${pct}%`, background: c.accent, borderRadius: 9, transition: "width .3s" }} /></div>
          <div style={{ fontSize: 12, color: c.muted, marginBottom: 26 }}>{A.qOf(qi + 1, ASSESS_Q.length)}</div>
          <motion.div key={qi} initial={{ opacity: 0, x: dir === "rtl" ? -16 : 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28, ease: easeOut }} style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.5, marginBottom: 26 }}>{q.q[lang]}</motion.div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {q.o.map((o) => {
              const on = answers[qi] === o.k;
              return <button key={o.k} onClick={() => answer(o.k)} style={{ textAlign: dir === "rtl" ? "right" : "left", padding: "16px 18px", borderRadius: 16, border: on ? `2px solid ${c.accent}` : `1px solid ${c.line}`, background: on ? c.accent + "1A" : c.card, color: c.text, fontWeight: 600, fontFamily: "inherit", fontSize: 15, cursor: "pointer", transition: "all .15s" }}>{o[lang]}</button>;
            })}
          </div>
          <button onClick={skip} style={{ background: "none", border: "none", color: c.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 6, marginTop: 18, alignSelf: "center" }}>{A.skip} ›</button>
        </div></div>
      </div>
    );
  }
  if (step === "loading") {
    return (
      <div dir={dir} style={wrap}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 999, border: `4px solid ${c.card2}`, borderTopColor: c.accent, animation: "wSpin 1s linear infinite" }} />
          <div style={{ fontSize: 17, fontWeight: 700, textAlign: "center" }}>{A.analyzing}</div>
          <div style={{ width: 180, height: 6, borderRadius: 9, background: c.card2, overflow: "hidden" }}><div style={{ height: "100%", background: c.accent, animation: "wLoad 2.6s ease forwards" }} /></div>
        </div>
      </div>
    );
  }
  // result (WOW)
  const meta = PERSONA_META[result.dominant];
  const name = lang === "ar" ? meta.ar : meta.en, altName = lang === "ar" ? meta.en : meta.ar;
  const desc = lang === "ar" ? meta.descAr : meta.descEn, ch = lang === "ar" ? meta.chAr : meta.chEn;
  const bars = [["dnaPlanning", "planning", c.green], ["dnaSocial", "social", c.accentText], ["dnaEmotional", "emotional", c.terra], ["dnaImpulsive", "impulsive", c.terraText]];
  return (
    <div dir={dir} style={wrap}><AsTopBar />
      <div style={body}><div style={{ ...inner, gap: 14 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: easeOut }} style={{ textAlign: "center" }}>
          <div style={{ width: 76, height: 76, borderRadius: 24, background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, display: "grid", placeItems: "center", margin: "0 auto 12px" }}><Brain size={36} color="#fff" /></div>
          <div style={{ fontSize: 12.5, color: c.muted }}>{A.identity}</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{name}</div>
          <div style={{ fontSize: 12.5, color: c.muted }}>{altName}</div>
          <div style={{ fontSize: 13.5, color: c.textSoft, marginTop: 8, lineHeight: 1.7 }}>{desc}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1, ease: easeOut }} style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, color: c.onAccent, borderRadius: 20, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 800 }}><AnimatedNumber value={Math.min(94, 55 + Math.round(result.dna.planning * 0.35))} formatter={(n) => `${fmt(n)}%`} /></div>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.95 }}>{A.betterThan(Math.min(94, 55 + Math.round(result.dna.planning * 0.35)))}</div>
        </motion.div>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{A.dna}</div>
          {bars.map(([lab, key, col], i) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}><span style={{ color: c.textSoft }}>{A[lab]}</span><span style={{ fontWeight: 700 }}><Metric value={`${result.dna[key]}%`} /></span></div>
              <div style={{ height: 8, borderRadius: 9, background: c.card2, overflow: "hidden" }}><motion.div initial={{ scaleX: 0 }} animate={{ scaleX: result.dna[key] / 100 }} transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: easeOut }} style={{ height: "100%", width: "100%", background: col, borderRadius: 9, transformOrigin: dir === "rtl" ? "right center" : "left center" }} /></div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: 16, textAlign: "center" }}><div style={{ fontSize: 11.5, color: c.muted }}>{A.awareness}</div><div style={{ fontSize: 30, fontWeight: 800, color: c.accent }}><AnimatedNumber value={result.score} formatter={(n) => fmt(n)} /><span style={{ fontSize: 15, color: c.muted }}>/100</span></div></div>
          <div style={{ flex: 1, background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: 16, textAlign: "center" }}><div style={{ fontSize: 11.5, color: c.muted }}>{A.confidence}</div><div style={{ fontSize: 30, fontWeight: 800, color: c.terra }}><AnimatedNumber value={result.confidence} formatter={(n) => `${fmt(n)}%`} /></div></div>
        </div>
        <div style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentText})`, color: c.onAccent, borderRadius: 20, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14, marginBottom: 6 }}><Sparkles size={17} />{A.decisionTitle}</div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6 }}>{riyalText(A.decisionText(result.saveable))}</div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>{A.decisionHow}</div>
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5, marginBottom: 8, color: c.accentText }}><Target size={16} />{A.challengeTitle}</div>
          <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.6 }}>{ch}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, background: c.green + "22", color: c.green, borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 700 }}><Trophy size={14} aria-hidden="true" />+<Metric value={result.points} /> {A.points}</div>
        </div>
        <button onClick={finish} style={btn(c.accent, c.onAccent)}>{A.acceptCh}</button>
        <button onClick={() => { setAnswers({}); setQi(0); setResult(null); setSlide(0); setStep("intro"); }} style={{ background: "none", border: "none", color: c.muted, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", padding: 6 }}>{A.retake}</button>
      </div></div>
    </div>
  );
}

/* ===================== صفحات التسويق (هبوط/عن/دخول) ===================== */
function mkBtn(bg, color, border) { return { padding: "13px 26px", borderRadius: 14, background: bg, color, border: border ? `1px solid ${border}` : "none", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }; }
function mkH2(c) { return { fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 800, textAlign: "center", margin: 0, letterSpacing: "-0.01em" }; }

function Marketing() {
  const { c, dir, screen, theme } = useCtx();
  const bg = `linear-gradient(180deg, ${c.bg1} 0%, ${c.bg0} 100%)`;
  return (
    <div dir={dir} data-waey-theme={theme} data-waey-shell className="wscroll" style={{ fontFamily: "'IBM Plex Sans Arabic',system-ui,sans-serif", background: bg, color: c.text, height: "100dvh", overflowY: "auto" }}>
      <MkNav />
      {screen === "landing" && <Landing />}
      {screen === "about" && <AboutPage />}
      {screen === "login" && <LoginPage />}
      {screen !== "login" && <MkFooter />}
    </div>
  );
}

function MkNav() {
  const { c, s, vw, theme, setTheme, lang, setLang, screen, setScreen } = useCtx();
  const narrow = vw < 720;
  const ic = { width: 38, height: 38, borderRadius: 12, background: c.card, border: `1px solid ${c.line}`, color: c.text, display: "grid", placeItems: "center", cursor: "pointer" };
  const link = (k, label) => <button onClick={() => setScreen(k)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: screen === k ? 700 : 500, color: screen === k ? c.text : c.muted }}>{label}</button>;
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(12px)", background: c.bg0 + "cc", borderBottom: `1px solid ${c.line}` }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" onClick={() => setScreen("landing")} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", background: "none", border: "none", color: c.text, fontFamily: "inherit", padding: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800 }}>{lang === "ar" ? "و" : "W"}</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: screen === "landing" ? c.text : c.text }}>{s.brand}</span>
        </button>
        {!narrow && <div style={{ display: "flex", gap: 18, marginInlineStart: 12 }}>{link("about", s.mk.about)}</div>}
        <div style={{ flex: 1 }} />
        <button aria-label={lang === "ar" ? "تغيير المظهر" : "Change theme"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={ic}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
        <button aria-label={lang === "ar" ? "تغيير اللغة" : "Change language"} onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={ic}><Globe size={18} /></button>
        <button onClick={() => setScreen("login")} style={{ ...mkBtn(c.accent, c.onAccent), padding: "9px 16px", fontSize: 13.5 }}>{s.mk.login}</button>
      </div>
    </div>
  );
}

function HeroMock() {
  const { c, lang } = useCtx();
  const scope = useRef(null);

  useGsap(scope, (gsap, { reduce }) => {
    if (reduce || !scope.current) return;
    gsap.to(scope.current, { y: -10, rotate: -1.5, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.from(".hero-cardlet", { y: 16, opacity: 0, stagger: 0.12, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" });
  }, []);

  return (
    <div ref={scope} className="hero-phone" style={{ width: "clamp(230px,32vw,300px)", borderRadius: 38, padding: 14, background: `linear-gradient(160deg, ${c.card2}, ${c.bg1})`, border: `1px solid ${c.line}`, boxShadow: c.shadow, flexShrink: 0, position: "relative", zIndex: 1 }}>
      <div className="hero-cardlet" style={{ background: `linear-gradient(135deg, ${c.bg1}, ${c.card2})`, border: `1px solid ${c.line}`, borderRadius: 22, padding: 16 }}>
        <div style={{ fontSize: 11, color: c.muted }}>{lang === "ar" ? "رصيد الحساب" : "Balance"}</div>
        <div style={{ fontSize: 26, fontWeight: 800 }}><AnimatedNumber value={1240} formatter={(n) => fmt(n)} /> <RS size="0.58em" color={c.muted} /></div>
      </div>
      <div className="hero-cardlet" style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: 14, marginTop: 12 }}>
        <Spark data={[40, 46, 44, 52, 50, 58, 62, 70]} />
        <div style={{ fontSize: 11, color: c.muted, textAlign: "center", marginTop: 2 }}>{lang === "ar" ? "نمو مدّخراتك" : "Savings growth"}</div>
      </div>
      <div className="hero-cardlet" style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {[Brain, Target, Trophy].map((Icon, i) => <div key={i} style={{ flex: 1, textAlign: "center", background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: "10px 0" }}><Icon size={20} color={i === 1 ? c.green : c.accentText} aria-hidden="true" /></div>)}
      </div>
    </div>
  );
}

// Animate any visible metric — number OR string like "94%", "1.9M", "4,250", "+30%".
function Metric({ value, duration = 1.2 }) {
  if (typeof value === "number") return <AnimatedNumber value={value} formatter={(n) => fmt(n)} duration={duration} />;
  const str = String(value);
  const m = str.match(/^(\D*?)(-?[\d.,]+)(.*)$/);
  if (!m) return <>{value}</>;
  const prefix = m[1] || "";
  const num = parseFloat(m[2].replace(/,/g, ""));
  const suffix = m[3] || "";
  if (!isFinite(num)) return <>{value}</>;
  const decimals = (m[2].split(".")[1] || "").length;
  const fmtN = (n) => `${prefix}${decimals ? n.toFixed(decimals) : fmt(n)}${suffix}`;
  return <AnimatedNumber value={num} formatter={fmtN} duration={duration} />;
}

// The original Waey brand mark (matches public/favicon.svg): violet→terracotta tile
// with a white four-point spark + dot. Use this — NOT the generic lucide <Sparkles/> —
// wherever the app logo should appear.
function WaeyMark({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="Waey" style={{ display: "block" }}>
      <defs>
        <linearGradient id="waeyMarkGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8685D8" />
          <stop offset="1" stopColor="#CA6C46" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="url(#waeyMarkGradient)" />
      <path d="M256 120c-14 60-44 96-84 120 34 8 62 30 84 66 22-36 50-58 84-66-40-24-70-60-84-120z" fill="#fff" />
      <circle cx="256" cy="372" r="26" fill="#fff" />
    </svg>
  );
}

// Real Waey loading-screen UI, composited on the hero (crisp + localized, not baked into the photo).
function LoadingPhone() {
  const { c, s } = useCtx();
  return (
    <div style={{ width: "clamp(146px,16vw,184px)", borderRadius: 30, padding: 9, background: `linear-gradient(160deg, ${c.bg1}, ${c.card2})`, border: `1px solid ${c.line}`, boxShadow: c.shadow }}>
      <div style={{ borderRadius: 23, background: c.page, aspectRatio: "9 / 17.5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 11, padding: "18px 16px", overflow: "hidden", position: "relative" }}>
        <div style={{ borderRadius: 14, boxShadow: `0 16px 40px -18px ${c.accent}`, lineHeight: 0 }}><WaeyMark size={56} /></div>
        <div style={{ fontSize: 19, fontWeight: 850 }}>{s.brand}</div>
        <div style={{ fontSize: 10, color: c.muted, textAlign: "center", lineHeight: 1.5 }}>{s.splash.tagline}</div>
        <div style={{ width: 88, height: 5, borderRadius: 999, background: c.card2, overflow: "hidden", marginTop: 2 }}>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.6, ease: easeOut, repeat: Infinity, repeatType: "loop", repeatDelay: 0.3 }} style={{ height: "100%", background: `linear-gradient(90deg, ${c.accent}, ${c.green})`, transformOrigin: "left center" }} />
        </div>
      </div>
    </div>
  );
}

function HeroShowcase() {
  const { c, lang, dir } = useCtx();
  const scope = useRef(null);
  useGsap(scope, (gsap, { reduce }) => {
    if (reduce || !scope.current) return;
    gsap.from(".hero-photo", { scale: 1.06, opacity: 0, duration: 1.1, ease: "power3.out", clearProps: "opacity" });
    gsap.from([".hero-float-phone", ".hero-float-card", ".hero-float-card2"], { y: 34, opacity: 0, stagger: 0.15, duration: 0.7, ease: "power3.out", delay: 0.3, clearProps: "opacity" });
    gsap.to(".hero-float-phone", { y: -12, duration: 3, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1 });
    gsap.to(".hero-float-card", { y: 10, duration: 3.4, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.2 });
    gsap.to(".hero-float-card2", { y: -9, duration: 3.8, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.4 });
    // Parallax the photo inside its clip. The img is oversized to 108% (top -4%),
    // so a ±3% yPercent shift never exposes the frame edges.
    gsap.fromTo(".hero-photo img", { yPercent: -3 }, { yPercent: 3, ease: "none", scrollTrigger: { trigger: scope.current, start: "top bottom", end: "bottom top", scrub: true } });
  }, []);
  const phoneSide = dir === "rtl" ? { insetInlineStart: "-6%" } : { insetInlineEnd: "-6%" };
  return (
    <div ref={scope} style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: "-10% -8%", background: `radial-gradient(58% 58% at 28% 18%, ${c.accent}22, transparent 70%), radial-gradient(58% 58% at 82% 92%, ${c.green}22, transparent 70%)`, zIndex: 0 }} />
      <div style={{ position: "relative", width: "clamp(258px,33vw,404px)", aspectRatio: "1122 / 1402", zIndex: 1 }}>
        <LandingImage
          className="hero-photo"
          src={`${LANDING_IMG}waey-hero-student-phone.webp`}
          alt={lang === "ar" ? "طالب جامعي يحمل هاتفه وتظهر شاشة بدء تطبيق وعي" : "University student holding a phone showing the Waey loading screen"}
          tone="hero"
          priority
          imgStyle={{ height: "108%", top: "-4%", objectPosition: "center 46%" }}
          overlay="linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 42%, rgba(15,34,48,0.16) 100%)"
          style={{ position: "absolute", inset: 0, borderRadius: 32, border: `1px solid ${c.line}`, boxShadow: c.shadow }}
        />
        <div className="hero-float-phone" style={{ position: "absolute", bottom: "4%", ...phoneSide, zIndex: 3 }}><LoadingPhone /></div>
        <div className="hero-float-card waey-soft-card" style={{ position: "absolute", top: "6%", insetInlineStart: dir === "rtl" ? "auto" : "-13%", insetInlineEnd: dir === "rtl" ? "-13%" : "auto", background: "rgba(255,255,255,0.86)", backdropFilter: "blur(10px)", border: `1px solid ${c.line}`, borderRadius: 18, padding: "12px 15px", boxShadow: c.shadow, zIndex: 3 }}>
          <div style={{ fontSize: 10.5, color: c.muted }}>{lang === "ar" ? "متوسط الادخار" : "Avg. saved"}</div>
          <div style={{ fontSize: 22, fontWeight: 850, color: c.accentText }}><Metric value={447} /> <RS size="0.5em" color={c.muted} /></div>
          <div style={{ fontSize: 10, color: c.green, fontWeight: 700, marginTop: 2 }}>▲ <Metric value="12%" /></div>
        </div>
        <div className="hero-float-card2 waey-soft-card" style={{ position: "absolute", bottom: "27%", insetInlineEnd: dir === "rtl" ? "auto" : "-10%", insetInlineStart: dir === "rtl" ? "-10%" : "auto", background: "rgba(255,255,255,0.86)", backdropFilter: "blur(10px)", border: `1px solid ${c.line}`, borderRadius: 16, padding: "10px 13px", boxShadow: c.shadow, zIndex: 3 }}>
          <div style={{ fontSize: 10, color: c.muted }}>{lang === "ar" ? "درجة الوعي" : "Awareness"}</div>
          <div style={{ fontSize: 19, fontWeight: 850, color: c.green }}><Metric value={62} /><span style={{ fontSize: 11, color: c.muted }}>/100</span></div>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const { c, s, lang, vw, setScreen, theme } = useCtx();
  const narrow = vw < 860;
  const cols4 = vw >= 1000 ? 4 : vw >= 620 ? 2 : 1;
  const cols3 = vw >= 820 ? 3 : 1;
  const card = { background: c.card, border: `1px solid ${c.line}`, borderRadius: 22, padding: 22 };
  return (
    <div>
      <section style={{ position: "relative", overflow: "hidden" }}>
        <WaeyFlowField tone={theme} />
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(26px,5vw,60px) 20px clamp(36px,5vw,72px)", display: "grid", gridTemplateColumns: narrow ? "1fr" : "1.02fr 0.98fr", alignItems: "center", gap: "clamp(30px,5vw,54px)", position: "relative", zIndex: 1 }}>
          <ScrollReveal style={{ textAlign: narrow ? "center" : "start" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: c.accentText, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: `1px solid ${c.line}`, borderRadius: 999, padding: "7px 14px", marginBottom: 20 }}><Sparkles size={13} /> Waey · {s.mk.visionTitle} 2030</div>
            <h1 style={{ fontSize: "clamp(36px,6vw,66px)", fontWeight: 850, lineHeight: 1.04, letterSpacing: "-0.03em", margin: 0 }}>{s.mk.heroTitle}</h1>
            <p style={{ fontSize: "clamp(15px,1.6vw,20px)", color: c.textSoft, lineHeight: 1.7, marginTop: 20, maxWidth: 540, marginInline: narrow ? "auto" : 0 }}>{s.mk.heroSub}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", justifyContent: narrow ? "center" : "flex-start" }}>
              <motion.button onClick={() => setScreen("role")} whileHover={{ y: -2, boxShadow: c.shadow }} whileTap={{ scale: 0.97 }} style={{ ...mkBtn(c.accent, c.onAccent), padding: "15px 30px", fontSize: 16 }}>{s.mk.ctaPrimary}</motion.button>
              <motion.button onClick={() => setScreen("about")} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} style={{ ...mkBtn(c.card, c.text, c.line), padding: "15px 26px", fontSize: 16 }}>{s.mk.about}</motion.button>
            </div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={revealContainer} style={{ display: "flex", gap: "clamp(18px,3vw,34px)", marginTop: 36, flexWrap: "wrap", justifyContent: narrow ? "center" : "flex-start" }}>
              {s.mk.stats.slice(0, 3).map((st, i) => (
                <motion.div key={i} variants={revealItem} style={{ textAlign: narrow ? "center" : "start" }}>
                  <div style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 850, color: i === 1 ? c.green : c.accentText, letterSpacing: "-0.02em" }}><Metric value={st.v} /></div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>{st.l}</div>
                </motion.div>
              ))}
            </motion.div>
          </ScrollReveal>
          <HeroShowcase />
        </div>
      </section>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(30px,5vw,60px) 20px" }}>
        <h2 style={mkH2(c)}>{s.mk.pillarsTitle}</h2>
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={revealContainer} style={{ display: "grid", gridTemplateColumns: `repeat(${cols4}, 1fr)`, gap: 16, marginTop: 28 }}>
          {s.mk.pillars.map((p, i) => (
            <motion.div key={i} variants={revealItem} whileHover={{ y: -4, boxShadow: "0 24px 60px -34px rgba(15,34,48,0.45)" }} whileTap={{ scale: 0.98 }} style={card}>
              <IconBubble icon={p.icon} color={c.accentText} bg={c.accent + "18"} size={25} box={48} radius={14} />
              <div style={{ fontWeight: 700, fontSize: 17, marginTop: 12 }}>{p.t}</div>
              <div style={{ fontSize: 13.5, color: c.muted, lineHeight: 1.7, marginTop: 6 }}>{p.d}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(20px,3vw,40px) 20px" }}>
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={revealContainer} style={vw >= 1000
          ? { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridTemplateRows: "clamp(150px,18vw,210px) clamp(150px,18vw,210px)", gap: 16 }
          : { display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          {/* Tile A — campus (tall hero of the mosaic) */}
          <motion.div variants={revealItem} whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: easeOut }} style={{ position: "relative", borderRadius: 26, overflow: "hidden", border: `1px solid ${c.line}`, boxShadow: c.shadow, ...(vw >= 1000 ? { gridColumn: "span 7", gridRow: "1 / span 2" } : { minHeight: "clamp(230px,44vw,320px)" }) }}>
            <LandingImage src={`${LANDING_IMG}waey-campus-budgeting.webp`} alt={lang === "ar" ? "ثلاثة طلاب يخططون مصاريفهم حول هاتف ولابتوب" : "Three students budgeting together around a phone and laptop"} tone="warm" overlay="linear-gradient(0deg, rgba(15,34,48,0.64), transparent 55%)" style={{ position: "absolute", inset: 0 }} />
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2, ease: easeOut }} style={{ position: "absolute", top: "7%", insetInlineEnd: "6%", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", border: `1px solid ${c.line}`, borderRadius: 16, padding: "10px 14px", boxShadow: c.shadow }}>
              <div style={{ fontSize: 22, fontWeight: 850, color: c.accentText, letterSpacing: "-0.02em" }}><Metric value="1.9M" /> <RS size="0.4em" color={c.muted} /></div>
              <div style={{ fontSize: 10.5, color: c.muted }}>{lang === "ar" ? "ريال ادّخرها الطلاب" : "saved by students"}</div>
            </motion.div>
            <div style={{ position: "absolute", insetInline: 0, bottom: 0, padding: "clamp(18px,3vw,28px)", color: "#fff", textAlign: "start" }}>
              <div style={{ fontSize: "clamp(19px,2.4vw,27px)", fontWeight: 850, letterSpacing: "-0.02em" }}>{lang === "ar" ? "عادات مالية تبدأ من الحرم الجامعي" : "Money habits that start on campus"}</div>
              <div style={{ fontSize: 13.5, opacity: 0.92, marginTop: 8, maxWidth: 440, lineHeight: 1.6 }}>{lang === "ar" ? "تتبّع، تحدَّ زملاءك، وابنِ سلوكاً مالياً واعياً مع أصدقائك." : "Track, challenge your peers, and build mindful money behavior together."}</div>
            </div>
          </motion.div>
          {/* Tile B — cafe insight */}
          <motion.div variants={revealItem} whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: easeOut }} style={{ position: "relative", borderRadius: 26, overflow: "hidden", border: `1px solid ${c.line}`, boxShadow: c.shadow, ...(vw >= 1000 ? { gridColumn: "8 / span 5", gridRow: 1 } : { minHeight: "clamp(180px,42vw,240px)" }) }}>
            <LandingImage src={`${LANDING_IMG}waey-cafe-insight.webp`} alt={lang === "ar" ? "طالب يراجع تحليلات إنفاقه اللحظية" : "A student reviewing real-time spending insights"} tone="green" overlay="linear-gradient(0deg, rgba(15,34,48,0.55), transparent 60%)" style={{ position: "absolute", inset: 0 }} />
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3, ease: easeOut }} style={{ position: "absolute", top: "9%", insetInlineStart: "6%", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", border: `1px solid ${c.line}`, borderRadius: 14, padding: "8px 12px", boxShadow: c.shadow }}>
              <div style={{ fontSize: 18, fontWeight: 850, color: c.green }}><Metric value="94%" /></div>
              <div style={{ fontSize: 10, color: c.muted }}>{lang === "ar" ? "تحكّم أكبر" : "in control"}</div>
            </motion.div>
            <div style={{ position: "absolute", insetInline: 0, bottom: 0, padding: 18, color: "#fff", textAlign: "start" }}>
              <div style={{ fontSize: "clamp(16px,1.8vw,20px)", fontWeight: 800 }}>{lang === "ar" ? "تحليلات لحظية لإنفاقك" : "Real-time spending insight"}</div>
            </div>
          </motion.div>
          {/* Tile C — non-photo stat tile */}
          <motion.div variants={revealItem} style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 26, padding: "clamp(18px,2.4vw,26px)", boxShadow: c.shadow, display: "flex", flexDirection: "column", justifyContent: "center", ...(vw >= 1000 ? { gridColumn: "8 / span 5", gridRow: 2 } : {}) }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: "clamp(30px,4vw,44px)", fontWeight: 850, color: c.accentText, letterSpacing: "-0.02em" }}><Metric value="2.2M" /></div>
              <div style={{ fontSize: 13, color: c.green, fontWeight: 700 }}>▲ <Metric value="+64%" /></div>
            </div>
            <div style={{ fontSize: 12.5, color: c.muted, marginTop: 4 }}>{lang === "ar" ? "طالب يمكن الوصول إليهم — ووعي مالي يرتفع" : "students reachable — awareness rising"}</div>
            <div style={{ marginTop: 12 }}><Spark data={[40, 44, 52, 50, 58, 62, 70, 78]} /></div>
          </motion.div>
        </motion.div>
      </div>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(30px,5vw,60px) 20px" }}>
        <h2 style={mkH2(c)}>{s.calc.title}</h2>
        <p style={{ textAlign: "center", color: c.muted, fontSize: 14.5, marginTop: 8 }}>{s.calc.sub}</p>
        <div style={{ maxWidth: 480, margin: "24px auto 0" }}><InvestCalc /></div>
      </div>

      <div style={{ background: c.card2, borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(30px,5vw,54px) 20px" }}>
          <ScrollReveal style={{ textAlign: "center", marginBottom: "clamp(18px,3vw,28px)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: c.accentText, background: "rgba(255,255,255,0.6)", border: `1px solid ${c.line}`, borderRadius: 999, padding: "7px 15px" }}><Sparkles size={13} />{lang === "ar" ? "طبقة سلوكية بين الطالب والجامعة والبنك" : "A Behavior Layer between student, university & bank"}</div>
          </ScrollReveal>
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={revealContainer} style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-around", textAlign: "center" }}>
            {s.mk.stats.map((st, i) => (
              <motion.div key={i} variants={revealItem} style={{ flex: "1 1 160px" }}>
                <div style={{ fontSize: "clamp(30px,5vw,46px)", fontWeight: 800, color: c.accentText }}><Metric value={st.v} /></div>
                <div style={{ fontSize: 13.5, color: c.muted, marginTop: 4 }}>{st.l}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(30px,5vw,60px) 20px" }}>
        <h2 style={mkH2(c)}>{s.mk.howTitle}</h2>
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={revealContainer} style={{ display: "grid", gridTemplateColumns: `repeat(${cols3}, 1fr)`, gap: 16, marginTop: 28 }}>
          {s.mk.steps.map((st, i) => (
            <motion.div key={i} variants={revealItem} whileHover={{ y: -4, boxShadow: "0 24px 60px -34px rgba(15,34,48,0.45)" }} whileTap={{ scale: 0.98 }} style={card}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: c.accent, color: c.onAccent, display: "grid", placeItems: "center", fontWeight: 800 }}>{i + 1}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 12 }}>{st.t}</div>
              <div style={{ fontSize: 13.5, color: c.muted, lineHeight: 1.7, marginTop: 6 }}>{st.d}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div style={{ background: c.card2, borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(34px,5vw,66px) 20px" }}>
          <ScrollReveal style={{ textAlign: "center", marginBottom: "clamp(26px,4vw,46px)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: c.accentText, marginBottom: 8 }}>{lang === "ar" ? "للجامعات والبنوك" : "For universities & banks"}</div>
            <h2 style={{ fontSize: "clamp(24px,3.4vw,40px)", fontWeight: 850, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.12 }}>{lang === "ar" ? "طبقة سلوكية واحدة — لوحتان مجهّلتان" : "One behavior layer, two anonymized dashboards"}</h2>
            <p style={{ fontSize: 15, color: c.textSoft, lineHeight: 1.7, marginTop: 12, maxWidth: 560, marginInline: "auto" }}>{lang === "ar" ? "وعي طبقة سلوكية بين الطالب والجامعة والبنك — رؤى حيّة بدون أي بيانات شخصية." : "Waey sits between student, university and bank — live insight with zero personal data."}</p>
          </ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: vw >= 900 ? "0.9fr 1.1fr" : "1fr", gap: "clamp(24px,4vw,44px)", alignItems: "center" }}>
            <ScrollReveal style={{ textAlign: "start" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: c.accentText, background: c.accent + "14", border: `1px solid ${c.line}`, borderRadius: 999, padding: "6px 13px", marginBottom: 12 }}><Landmark size={14} />{lang === "ar" ? "بوابة الجامعة" : "University portal"}</div>
              <h3 style={{ fontSize: "clamp(20px,2.6vw,30px)", fontWeight: 850, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.15 }}>{lang === "ar" ? "رؤى سلوكية مجهّلة على مستوى الحرم" : "Anonymized behavioral insight, campus-wide"}</h3>
              <p style={{ fontSize: 14.5, color: c.textSoft, lineHeight: 1.7, marginTop: 12, maxWidth: 440 }}>{lang === "ar" ? "لوحات حيّة لمشاركة الطلاب، الوعي المالي، وإكمال التحديات — بدون أي بيانات شخصية." : "Live dashboards for participation, awareness and challenge completion — with zero personal data."}</p>
              <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={revealContainer} style={{ display: "flex", gap: "clamp(18px,3vw,30px)", marginTop: 22, flexWrap: "wrap" }}>
                {[["4,250", lang === "ar" ? "طالب" : "students", c.accentText], ["+64%", lang === "ar" ? "وعي مالي" : "awareness", c.green], ["78%", lang === "ar" ? "إكمال" : "completion", c.accentText]].map(([v, l, col], i) => (
                  <motion.div key={i} variants={revealItem}><div style={{ fontSize: "clamp(22px,2.6vw,30px)", fontWeight: 850, color: col }}><Metric value={v} /></div><div style={{ fontSize: 12, color: c.muted }}>{l}</div></motion.div>
                ))}
              </motion.div>
            </ScrollReveal>
            <ScrollReveal>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: easeOut }} style={{ position: "relative", aspectRatio: "1672 / 941", borderRadius: 28, overflow: "hidden", border: `1px solid ${c.line}`, boxShadow: c.shadow }}>
                <LandingImage src={`${LANDING_IMG}waey-university-dashboard.webp`} alt={lang === "ar" ? "مكتب إرشاد أكاديمي يعرض لوحة تحليلات وعي على اللابتوب" : "Academic-advising office viewing the Waey analytics dashboard on a laptop"} tone="hero" overlay="linear-gradient(120deg, rgba(15,34,48,0.30), rgba(15,34,48,0.04))" style={{ position: "absolute", inset: 0 }} />
                <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15, ease: easeOut }} style={{ position: "absolute", insetInlineEnd: "6%", top: "10%", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", border: `1px solid ${c.line}`, borderRadius: 16, padding: "10px 15px", boxShadow: c.shadow }}>
                  <div style={{ fontSize: 10.5, color: c.muted }}>{lang === "ar" ? "المشاركة" : "Participation"}</div>
                  <div style={{ fontSize: 23, fontWeight: 850, color: c.accent }}><Metric value={4250} /></div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3, ease: easeOut }} style={{ position: "absolute", insetInlineStart: "6%", bottom: "10%", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", border: `1px solid ${c.line}`, borderRadius: 16, padding: "10px 15px", boxShadow: c.shadow }}>
                  <div style={{ fontSize: 10.5, color: c.muted }}>{lang === "ar" ? "الوعي المالي" : "Awareness"}</div>
                  <div style={{ fontSize: 23, fontWeight: 850, color: c.green }}><Metric value="64%" /></div>
                </motion.div>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      <div style={{ background: c.bg1, borderBottom: `1px solid ${c.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(34px,5vw,66px) 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: vw >= 900 ? "1.1fr 0.9fr" : "1fr", gap: "clamp(24px,4vw,44px)", alignItems: "center" }}>
            <ScrollReveal>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: easeOut }} style={{ position: "relative", aspectRatio: "1672 / 941", borderRadius: 28, overflow: "hidden", border: `1px solid ${c.line}`, boxShadow: c.shadow }}>
                <LandingImage src={`${LANDING_IMG}waey-bank-partner-dashboard.webp`} alt={lang === "ar" ? "شريكان من البنك يراجعان لوحة تحليلات وعي المجمّعة والمجهّلة" : "Two bank partners reviewing Waey's aggregated, anonymized analytics dashboard"} tone="terra" overlay="linear-gradient(240deg, rgba(15,34,48,0.30), rgba(15,34,48,0.04))" style={{ position: "absolute", inset: 0 }} />
                <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15, ease: easeOut }} style={{ position: "absolute", insetInlineStart: "6%", top: "10%", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", border: `1px solid ${c.line}`, borderRadius: 16, padding: "10px 15px", boxShadow: c.shadow }}>
                  <div style={{ fontSize: 10.5, color: c.muted }}>{lang === "ar" ? "طلاب نشطون" : "Active students"}</div>
                  <div style={{ fontSize: 23, fontWeight: 850, color: c.terra }}><Metric value="4,200" /></div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3, ease: easeOut }} style={{ position: "absolute", insetInlineEnd: "6%", bottom: "10%", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", border: `1px solid ${c.line}`, borderRadius: 16, padding: "10px 15px", boxShadow: c.shadow }}>
                  <div style={{ fontSize: 10.5, color: c.muted }}>{lang === "ar" ? "متوسط الوعي" : "Avg awareness"}</div>
                  <div style={{ fontSize: 23, fontWeight: 850, color: c.green }}><Metric value="64%" /></div>
                </motion.div>
              </motion.div>
            </ScrollReveal>
            <ScrollReveal style={{ textAlign: "start" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: c.terraText, background: c.terra + "14", border: `1px solid ${c.line}`, borderRadius: 999, padding: "6px 13px", marginBottom: 12 }}><Building2 size={14} />{lang === "ar" ? "لوحة البنك" : "Bank dashboard"}</div>
              <h3 style={{ fontSize: "clamp(20px,2.6vw,30px)", fontWeight: 850, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.15 }}>{lang === "ar" ? "تحليلات سلوكية مجمّعة لتصميم منتجات الشباب" : "Aggregated behavior analytics to design youth products"}</h3>
              <p style={{ fontSize: 14.5, color: c.textSoft, lineHeight: 1.7, marginTop: 12, maxWidth: 440 }}>{lang === "ar" ? "شريك مؤسسي (بنك الإنماء المقترح) يرى الأنماط والفرص — كل البيانات مجمّعة ومجهّلة بالكامل." : "An institutional partner (proposed: Bank Alinma) sees patterns and opportunities — all data aggregated and fully anonymized."}</p>
              <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={revealContainer} style={{ display: "flex", gap: "clamp(18px,3vw,30px)", marginTop: 22, flexWrap: "wrap" }}>
                {[["8.4M", lang === "ar" ? "ريال ادّخرها الطلاب" : "riyals saved", c.green], ["34%", lang === "ar" ? "أعلى شخصية" : "top persona", c.terra], ["82%", lang === "ar" ? "أعمار 18–24" : "ages 18–24", c.accentText]].map(([v, l, col], i) => (
                  <motion.div key={i} variants={revealItem}><div style={{ fontSize: "clamp(22px,2.6vw,30px)", fontWeight: 850, color: col }}><Metric value={v} /></div><div style={{ fontSize: 12, color: c.muted }}>{l}</div></motion.div>
                ))}
              </motion.div>
              <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 7, background: c.card2, border: `1px dashed ${c.line}`, borderRadius: 12, padding: "8px 13px", fontSize: 12, color: c.textSoft }}><Lock size={14} color={c.green} aria-hidden="true" />{lang === "ar" ? "100% بيانات مجهّلة — بدون أي أفراد" : "100% anonymized — no individuals"}</div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(20px,4vw,40px) 20px clamp(40px,6vw,70px)" }}>
        <div style={{ borderRadius: 28, padding: "clamp(30px,5vw,56px) 24px", textAlign: "center", background: `linear-gradient(135deg, ${c.accent}, ${c.accentText})`, color: c.onAccent }}>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,36px)", fontWeight: 800, margin: 0 }}>{s.mk.ctaTitle}</h2>
          <motion.button onClick={() => setScreen("role")} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ ...mkBtn("#fff", c.accent), marginTop: 22 }}>{s.mk.ctaBtn}</motion.button>
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  const { c, s, vw } = useCtx();
  const cols4 = vw >= 900 ? 4 : vw >= 560 ? 2 : 1;
  const block = (title, text) => (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: c.accentText }}>{title}</h3>
      <p style={{ fontSize: 15, color: c.textSoft, lineHeight: 1.9, margin: 0 }}>{riyalText(text)}</p>
    </div>
  );
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "clamp(32px,6vw,70px) 20px" }}>
      <h1 style={{ fontSize: "clamp(30px,5vw,50px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px" }}>{s.about}</h1>
      <p style={{ fontSize: 16, color: c.muted, lineHeight: 1.8, marginBottom: 28 }}>{s.aboutMission}</p>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: "clamp(20px,3vw,32px)" }}>
        {block(s.mk.problemTitle, s.mk.problemText)}
        {block(s.mk.solutionTitle, s.mk.solutionText)}
        {block(s.mk.visionTitle, s.aboutStat)}
        {block(s.revenue, s.revenueText)}
        {block(s.mk.whyTitle, s.mk.whyText)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols4}, 1fr)`, gap: 14, marginTop: 20 }}>
        {s.mk.pillars.map((p, i) => (
          <div key={i} style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: 18 }}>
            <IconBubble icon={p.icon} color={c.accentText} bg={c.accent + "18"} size={22} box={42} radius={12} />
            <div style={{ fontWeight: 700, marginTop: 8 }}>{p.t}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 16, color: c.accentText, fontWeight: 700, lineHeight: 1.8, marginTop: 26, textAlign: "center" }}>“{s.tagline}”</div>
      <div style={{ textAlign: "center", marginTop: 12 }}><span style={{ fontSize: 12.5, color: c.muted, background: c.card, border: `1px solid ${c.line}`, borderRadius: 999, padding: "6px 14px" }}>{s.aboutPartner}</span></div>
    </div>
  );
}

function LoginPage() {
  const { c, s, lang, setScreen, startSession, enterGuest } = useCtx();
  const [id, setId] = useState(""); const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  function submit() {
    const nextSession = createLoginSession(id, pw);
    if (!nextSession) {
      setError(lang === "ar" ? "اكتب رقمك الجامعي وكلمة المرور للمتابعة" : "Enter your ID and password to continue");
      return;
    }
    setError("");
    startSession(nextSession);
  }
  return (
    <div style={{ minHeight: "calc(100dvh - 66px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 20px" }}>
      <div style={{ width: "100%", maxWidth: 400, background: c.card, border: `1px solid ${c.line}`, borderRadius: 26, padding: "clamp(24px,4vw,34px)" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 24, margin: "0 auto 14px" }}>{lang === "ar" ? "و" : "W"}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, textAlign: "center", margin: 0 }}>{s.mk.lgTitle}</h1>
        <p style={{ fontSize: 13.5, color: c.muted, textAlign: "center", marginTop: 6, marginBottom: 20 }}>{s.mk.lgSub}</p>
        <input aria-label={s.mk.lgId} value={id} onChange={(e) => setId(e.target.value)} placeholder={s.mk.lgId} style={{ ...inp(c), marginBottom: 12 }} />
        <input aria-label={s.mk.lgPass} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={s.mk.lgPass} style={inp(c)} />
        {error && <div role="alert" style={{ color: c.terraText, fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>{error}</div>}
        <button onClick={submit} style={btn(c.accent, c.onAccent)}>{s.mk.lgBtn}</button>
        <button onClick={enterGuest} style={{ ...btn(c.card2, c.text), border: `1px solid ${c.line}`, marginTop: 10 }}>{s.mk.lgGuest}</button>
        <div style={{ textAlign: "center", fontSize: 13, color: c.muted, marginTop: 16 }}>{s.mk.lgNo} <button onClick={enterGuest} style={{ background: "none", border: "none", color: c.accentText, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{s.mk.lgSignup}</button></div>
        <div style={{ textAlign: "center", marginTop: 10 }}><button onClick={() => setScreen("landing")} style={{ background: "none", border: "none", color: c.muted, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>{s.mk.lgBack}</button></div>
      </div>
    </div>
  );
}

function MkFooter() {
  const { c, s, setScreen } = useCtx();
  const fl = { background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: c.muted, fontSize: 13 };
  return (
    <div style={{ borderTop: `1px solid ${c.line}`, background: c.bg0 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "30px 20px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, color: c.muted, maxWidth: 520, lineHeight: 1.7 }}>“{s.tagline}”</div>
        <div style={{ display: "flex", gap: 16 }}>
          <button onClick={() => setScreen("landing")} style={fl}>{s.mk.home}</button>
          <button onClick={() => setScreen("about")} style={fl}>{s.mk.about}</button>
          <button onClick={() => setScreen("login")} style={fl}>{s.mk.login}</button>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: c.muted, padding: "0 20px 24px" }}>{s.mk.rights}</div>
    </div>
  );
}

/* ===================== الصفحة الرئيسية ===================== */
function InvestCalc() {
  const { c, s, lang } = useCtx();
  const K = s.calc;
  const [pf, setPf] = useState(1);
  const [start, setStart] = useState(500);
  const [monthly, setMonthly] = useState(300);
  const [years, setYears] = useState(10);
  const rate = [0.04, 0.07, 0.10][pf]; // عائد سنوي تقديري حسب المحفظة
  // حساب القيمة المستقبلية: مبلغ البداية + دفعات شهرية مركّبة
  const months = years * 12, mr = rate / 12;
  const fvStart = start * Math.pow(1 + mr, months);
  const fvMonthly = monthly * ((Math.pow(1 + mr, months) - 1) / (mr || 1));
  const invested = Math.round(fvStart + fvMonthly);
  const contributed = start + monthly * months; // بدون استثمار
  const diff = invested - contributed;
  // نقاط الرسم عبر السنوات
  const pts = Array.from({ length: years + 1 }, (_, y) => {
    const m = y * 12;
    const inv = start * Math.pow(1 + mr, m) + monthly * ((Math.pow(1 + mr, m) - 1) / (mr || 1));
    const flat = start + monthly * m;
    return { y, inv, flat };
  });
  const maxV = Math.max(...pts.map((p) => p.inv), 1);
  const W = 300, H = 120;
  const path = (key) => pts.map((p, i) => `${i === 0 ? "M" : "L"} ${(i / years) * W} ${H - (p[key] / maxV) * H}`).join(" ");
  const Slider = ({ label, val, set, min, max, step, fmtV }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 7 }}><span style={{ color: c.textSoft }}>{label}</span><span style={{ fontWeight: 700, color: c.accentText }}>{fmtV}</span></div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(+e.target.value)} style={{ width: "100%", accentColor: c.accent, cursor: "pointer" }} />
    </div>
  );
  return (
    <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 2 }}><TrendingUp size={17} color={c.accentText} />{K.title}</div>
      <div style={{ fontSize: 11.5, color: c.muted, marginBottom: 16 }}>{K.sub}</div>

      <div style={{ fontSize: 12, color: c.textSoft, marginBottom: 7 }}>{K.portfolio}</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {K.portfolios.map((p, i) => <button key={i} onClick={() => setPf(i)} style={{ flex: 1, padding: "9px 4px", borderRadius: 12, border: pf === i ? "none" : `1px solid ${c.line}`, background: pf === i ? c.accent : "transparent", color: pf === i ? c.onAccent : c.muted, fontWeight: 700, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>{p}</button>)}
      </div>

      <Slider label={K.savings} val={start} set={setStart} min={0} max={10000} step={100} fmtV={riyalText(`${fmt(start)} ر.س`)} />
      <Slider label={K.monthly} val={monthly} set={setMonthly} min={0} max={3000} step={50} fmtV={riyalText(`${fmt(monthly)} ر.س`)} />
      <Slider label={K.years} val={years} set={setYears} min={1} max={30} step={1} fmtV={K.yearsUnit(years)} />

      <div style={{ background: c.card2, borderRadius: 16, padding: "14px 14px 8px", marginTop: 6, marginBottom: 14 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ overflow: "visible" }}>
          <path d={`${path("inv")} L ${W} ${H} L 0 ${H} Z`} fill={c.accent} opacity="0.12" />
          <path d={path("flat")} fill="none" stroke={c.muted} strokeWidth="2" strokeDasharray="4 4" />
          <path d={path("inv")} fill="none" stroke={c.accent} strokeWidth="2.5" />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: c.muted, marginTop: 4 }}><span>{K.yearsUnit(0)}</span><span>{K.yearsUnit(years)}</span></div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: c.accent + "1A", borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 10.5, color: c.muted, marginBottom: 3 }}>{K.withWaey}</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: c.accentText }}><AnimatedNumber value={invested} formatter={(n) => fmt(n)} duration={0.4} /></div>
          <div style={{ fontSize: 9.5, color: c.muted }}><RS size="0.8em" /></div>
        </div>
        <div style={{ flex: 1, background: c.card2, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 10.5, color: c.muted, marginBottom: 3 }}>{K.noInvest}</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: c.muted }}><AnimatedNumber value={contributed} formatter={(n) => fmt(n)} duration={0.4} /></div>
          <div style={{ fontSize: 9.5, color: c.muted }}><RS size="0.8em" /></div>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 12, background: c.green + "1A", color: c.green, borderRadius: 12, padding: "9px", fontSize: 13, fontWeight: 700 }}>{K.diff}: +<AnimatedNumber value={diff} formatter={(n) => fmt(n)} duration={0.4} /> <RS size="0.85em" /></div>
      <div style={{ fontSize: 10, color: c.muted, textAlign: "center", marginTop: 8 }}>{K.note}</div>
    </div>
  );
}
function HomeScreen() {
  const { c, s, lang, setLang, points, theme, setTheme, setOverlay } = useCtx();
  const stack = useRef(null);
  useGsap(stack, (gsap, { reduce }) => {
    if (reduce || !stack.current) return;
    gsap.from(Array.from(stack.current.children), { y: 18, opacity: 0, stagger: 0.05, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" });
  }, []);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <IconBtn onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</IconBtn>
          <IconBtn onClick={() => setLang(lang === "ar" ? "en" : "ar")}><Globe size={18} /></IconBtn>
          <IconBtn dot><Bell size={18} /></IconBtn>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: c.card, border: `1px solid ${c.line}`, padding: "7px 14px", borderRadius: 999 }}>
          <Coins size={16} color={c.accentText} /><span style={{ fontWeight: 700, fontSize: 14 }}><Metric value={points} /></span><span style={{ fontSize: 11, color: c.muted }}>{s.pts}</span>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <div style={{ width: 76, height: 76, borderRadius: 999, margin: "0 auto", padding: 4, background: `conic-gradient(${c.accent} 0deg, ${c.terra} 200deg, ${c.accent} 360deg)`, display: "grid", placeItems: "center" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 999, background: c.card2, display: "grid", placeItems: "center", fontSize: 28, fontWeight: 700, color: c.accentText, border: `2px solid ${c.bg0}` }}>{lang === "ar" ? "و" : "W"}</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{s.name}</div>
        <div style={{ color: c.muted, fontSize: 12.5 }}>{s.handle}</div>
      </div>

      <div ref={stack} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
        <BalanceCard />
        <PersonaCard />
        <AwarenessCard />
        <InsightCard />
        <WeeklyCard />
        <PeerCard />
        <ChallengesCard />
        <ProgressCard />
        <RewardsCard />
        <LeaderboardCard />
        <RoundUpCard />
        <EntryCard icon={Briefcase} title={s.jobsTitle} sub={s.jobsSub} onClick={() => setOverlay("jobs")} />
        <EntryCard icon={Gift} title={s.cashTitle} sub={s.cashSub} onClick={() => setOverlay("cashback")} />
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 22, padding: 16 }}>
          <div style={{ display: "flex" }}>
            {[c.accent, c.terra, c.green].map((col, i) => <span key={i} style={{ width: 28, height: 28, borderRadius: 999, background: col, marginInlineStart: i ? -9 : 0, border: `2px solid ${c.card}`, display: "grid", placeItems: "center" }}><Users size={12} color={c.onAccent} /></span>)}
          </div>
          <div style={{ fontWeight: 700, marginTop: 10 }}>{s.friends}</div>
          <div style={{ color: c.accentText, fontSize: 12, fontWeight: 600 }}><Metric value={14} /> {s.online}</div>
        </div>
        <div style={{ borderRadius: 22, padding: 16, position: "relative", overflow: "hidden", background: c.card, border: `1px solid ${c.line}` }}>
          <div style={{ fontWeight: 700, color: c.accentText }}>{s.keepUp}</div>
          <div style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.6, marginTop: 4 }}>{s.keepUpSub}</div>
          <Trophy size={46} color={c.accentText} style={{ position: "absolute", insetInlineEnd: 8, bottom: -4, opacity: 0.85 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", background: c.card, border: `1px solid ${c.line}`, borderRadius: 22, padding: "16px 8px" }}>
          <Stat icon={<Sparkles size={16} color={c.accentText} />} value="35" label={s.stats.streak} />
          <Divider /><Stat icon={<Trophy size={16} color={c.accentText} />} value="8" label={s.stats.level} />
          <Divider /><Stat icon={<Target size={16} color={c.accentText} />} value="85%" label={s.stats.adhere} />
        </div>
      </div>
    </div>
  );
}

function PersonaCard() {
  const { c, s, persona, setPersona } = useCtx();
  const idx = persona;
  const p = s.personalities[idx];
  return (
    <div style={{ borderRadius: 24, padding: 18, background: `linear-gradient(135deg, ${c.card2}, ${c.card})`, border: `1px solid ${c.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11.5, color: c.accentText, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={14} />{s.persona}</div>
        <button onClick={() => setPersona((idx + 1) % s.personalities.length)} style={{ background: c.card, border: `1px solid ${c.line}`, color: c.textSoft, borderRadius: 999, padding: "5px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{s.reanalyze}</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12 }}>
        <IconBubble icon={p.icon} color={c.onAccent} bg={c.accent} size={27} box={54} radius={16} />
        <div><div style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 12, color: c.muted, lineHeight: 1.5 }}>{p.desc}</div></div>
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
        {p.traits.map((t) => <span key={t} style={{ background: c.card, border: `1px solid ${c.line}`, color: c.textSoft, borderRadius: 999, padding: "5px 11px", fontSize: 11.5 }}>{t}</span>)}
      </div>
      <div style={{ fontSize: 10.5, color: c.muted, marginTop: 10 }}>{s.personaBy}</div>
    </div>
  );
}
function PeerCard() {
  const { c, s } = useCtx();
  const pct = 68;
  return (
    <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}><Users2 size={16} color={c.accentText} />{s.peer}</div>
      <div style={{ fontSize: 11.5, color: c.muted, marginBottom: 12 }}>{s.peerDesc}</div>
      <div style={{ fontSize: 13.5, color: c.textSoft, marginBottom: 10 }}>{s.peerLine(pct)}</div>
      <div style={{ position: "relative", height: 10, background: c.inputBg, borderRadius: 9 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${c.accent}, ${c.green})`, borderRadius: 9 }} />
        <div style={{ position: "absolute", insetInlineStart: `calc(${pct}% - 8px)`, top: -3, width: 16, height: 16, borderRadius: 999, background: "#fff", border: `3px solid ${c.accent}` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: c.muted, marginTop: 6 }}><span>{s.peerYou}</span><span><Metric value="100%" /></span></div>
    </div>
  );
}
function ChallengesCard() {
  const { c, s, setPoints, flash } = useCtx();
  const [done, setDone] = useState([false, false, false]);
  function toggle(i, pts) { if (done[i]) return; setDone((d) => d.map((v, j) => (j === i ? true : v))); setPoints((p) => p + pts); flash(s.chDoneMsg(pts)); }
  const count = done.filter(Boolean).length;
  return (
    <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div><div style={{ fontWeight: 700 }}>{s.challenges}</div><div style={{ fontSize: 11.5, color: c.muted }}>{s.challengesSub}</div></div>
        <div style={{ fontSize: 11.5, color: c.accentText, fontWeight: 700 }}>{s.chProgress(count, s.challengeList.length)}</div>
      </div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {s.challengeList.map((ch, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, border: `1px solid ${c.line}`, background: c.card2, opacity: done[i] ? 0.55 : 1 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, textDecoration: done[i] ? "line-through" : "none" }}>{riyalText(ch.t)}</div>
              <div style={{ fontSize: 11, color: c.accentText, fontWeight: 700 }}>+<Metric value={ch.pts} /> {s.pts}</div>
            </div>
            <button onClick={() => toggle(i, ch.pts)} disabled={done[i]} style={{ width: 34, height: 34, borderRadius: 11, border: `1px solid ${done[i] ? c.green : c.line}`, background: done[i] ? c.green : "transparent", display: "grid", placeItems: "center", cursor: done[i] ? "default" : "pointer" }}>
              <Check size={18} color={done[i] ? "#fff" : c.muted} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function FullPage({ title, sub, onClose, children }) {
  const { c, lang } = useCtx();
  const Back = lang === "ar" ? ChevronRight : ChevronLeft;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 55, background: c.bg0, display: "flex", flexDirection: "column", animation: "wUp .3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "calc(env(safe-area-inset-top,0px) + 16px) 18px 12px", flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 12, background: c.card, border: `1px solid ${c.line}`, color: c.text, display: "grid", placeItems: "center", cursor: "pointer" }}><Back size={20} /></button>
        <div><div style={{ fontSize: 19, fontWeight: 800 }}>{title}</div>{sub && <div style={{ fontSize: 11.5, color: c.muted }}>{sub}</div>}</div>
      </div>
      <div className="wscroll" style={{ flex: 1, overflowY: "auto", padding: "4px 18px 28px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>{children}</div>
      </div>
    </div>
  );
}
function EntryCard({ icon: Icon, title, sub, onClick }) {
  const { c, lang } = useCtx();
  const Chev = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <button type="button" onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: c.card, border: `1px solid ${c.line}`, borderRadius: 22, padding: 16, cursor: "pointer", color: c.text, fontFamily: "inherit", textAlign: "start" }}>
      <IconBubble icon={Icon} color={c.accentText} bg={c.card2} size={22} />
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700 }}>{title}</div><div style={{ fontSize: 11.5, color: c.muted }}>{sub}</div></div>
      <Chev size={18} color={c.muted} />
    </button>
  );
}
function AwarenessCard() {
  const { c, s, assess } = useCtx();
  const bars = [["dnaPlanning", "planning", c.green], ["dnaSocial", "social", c.accentText], ["dnaEmotional", "emotional", c.terra], ["dnaImpulsive", "impulsive", c.terraText]];
  return (
    <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, textAlign: "center", background: c.card2, borderRadius: 16, padding: "12px 8px" }}>
          <div style={{ fontSize: 11, color: c.muted }}>{s.awarenessTitle}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: c.accent }}><Metric value={assess.score} /><span style={{ fontSize: 13, color: c.muted }}>/100</span></div>
        </div>
        <div style={{ flex: 1, textAlign: "center", background: c.card2, borderRadius: 16, padding: "12px 8px" }}>
          <div style={{ fontSize: 11, color: c.muted }}>{s.aiConf}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: c.terra }}><Metric value={`${assess.confidence}%`} /></div>
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: c.accentText }}>{s.dnaTitle}</div>
      {bars.map(([lab, key, col]) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}><span style={{ color: c.textSoft }}>{s.as[lab]}</span><span style={{ fontWeight: 700 }}><Metric value={`${assess.dna[key]}%`} /></span></div>
          <div style={{ height: 7, borderRadius: 9, background: c.card2, overflow: "hidden" }}><div style={{ height: "100%", width: `${assess.dna[key]}%`, background: col, borderRadius: 9, transition: "width .6s ease" }} /></div>
        </div>
      ))}
    </div>
  );
}
function InsightCard() {
  const { c, s } = useCtx();
  return (
    <div style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, color: c.onAccent, borderRadius: 24, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14, marginBottom: 8 }}><Sparkles size={17} />{s.insightTitle}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>{riyalText(s.insightText)}</div>
    </div>
  );
}
function ProgressCard() {
  const { c, s, lang } = useCtx();
  const weeks = [{ done: 2, score: 58 }, { done: 3, score: 64 }, { done: 3, score: 70 }, { done: 4, score: 76 }];
  const maxScore = 80;
  return (
    <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 4 }}><BarChart2 size={17} color={c.accentText} />{s.progTitle}</div>
      <div style={{ fontSize: 11.5, color: c.muted, marginBottom: 4 }}>{lang === "ar" ? "درجة وعيك المالي ترتفع كل أسبوع مع إكمال التحديات" : "Your awareness score rises each week as you finish challenges"}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: c.green + "1A", color: c.green, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, marginBottom: 14 }}>▲ <Metric value={58} /> → <Metric value={76} /> {lang === "ar" ? "خلال 4 أسابيع" : "in 4 weeks"}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 96 }}>
        {weeks.map((w, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: c.accent }}><Metric value={w.score} /></div>
            <div style={{ width: "100%", maxWidth: 34, height: `${(w.score / maxScore) * 60}px`, background: `linear-gradient(180deg, ${c.accent}, ${c.accentText})`, borderRadius: 8, transition: "height .5s" }} />
            <div style={{ fontSize: 10, color: c.muted }}>{s.progWeekLabel(i + 1)}</div>
            <div style={{ fontSize: 9.5, color: c.green, display: "flex", alignItems: "center", gap: 2 }}><Check size={10} aria-hidden="true" /><Metric value={w.done} /> {lang === "ar" ? "تحدّي" : "ch."}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${c.line}`, fontSize: 10.5, color: c.muted }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: c.accent }} />{lang === "ar" ? "الرقم فوق العمود = درجتك ذاك الأسبوع" : "Number above bar = that week's score"}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Check size={12} color={c.green} aria-hidden="true" />{lang === "ar" ? "التحديات المكتملة" : "challenges done"}</span>
      </div>
    </div>
  );
}
function RewardsCard() {
  const { c, s, points } = useCtx();
  const level = Math.max(1, Math.floor(points / 100) + 1);
  const badges = [Medal, CircleDollarSign, Flame, TrendingUp];
  const earned = 2;
  return (
    <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}><Trophy size={17} color={c.accentText} />{s.rewardsTitle}</div>
        <div style={{ background: c.accent, color: c.onAccent, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{s.rewLevel} <Metric value={level} /></div>
      </div>
      <div style={{ fontSize: 12, color: c.muted, marginBottom: 8 }}>{s.rewBadges}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {badges.map((Icon, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", background: c.card2, border: `1px solid ${c.line}`, borderRadius: 14, padding: "10px 4px", opacity: i < earned ? 1 : 0.35 }}>
            <Icon size={22} color={i < earned ? c.accentText : c.muted} aria-hidden="true" />
            <div style={{ fontSize: 9, color: c.muted, marginTop: 3 }}>{s.badgeNames[i]}</div>
          </div>
        ))}
      </div>
      <div style={{ background: c.card2, border: `1px dashed ${c.line}`, borderRadius: 14, padding: "10px 12px", fontSize: 12, color: c.textSoft, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, textAlign: "center" }}><Gift size={15} color={c.accentText} aria-hidden="true" />{s.rewFuture}</div>
    </div>
  );
}
function PlatformPage() {
  const { c, s, lang, setOverlay } = useCtx();
  const P = s.plat;
  const engines = [["engBehavior", c.accentText], ["engAI", c.accent], ["engAnalytics", c.terra]];
  const nodes = [["nodeStudent", GraduationCap], ["nodeUni", Landmark], ["nodeBank", Building2]];
  const parties = [["pStudent", "pStudentD", GraduationCap, c.accent], ["pUni", "pUniD", Landmark, c.accentText], ["pBank", "pBankD", Building2, c.terra]];
  return (
    <FullPage title={P.title} sub={P.sub} onClose={() => setOverlay(null)}>
      <div style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, color: c.onAccent, borderRadius: 20, padding: 16, fontSize: 13.5, fontWeight: 700, lineHeight: 1.6, marginBottom: 16 }}>{P.tagline}</div>

      {/* المعمارية */}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: c.accentText }}>{P.archTitle}</div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {nodes.map(([k, Icon]) => <div key={k} style={{ flex: 1, textAlign: "center", background: c.card2, border: `1px solid ${c.line}`, borderRadius: 12, padding: "10px 4px" }}><Icon size={20} color={c.accentText} aria-hidden="true" /><div style={{ fontSize: 10.5, fontWeight: 600, marginTop: 3 }}>{P[k]}</div></div>)}
        </div>
        <div style={{ textAlign: "center", color: c.muted, fontSize: 16, lineHeight: 1 }}>▽</div>
        <div style={{ textAlign: "center", background: c.accent + "1A", color: c.accentText, borderRadius: 10, padding: "8px", fontSize: 12, fontWeight: 700, margin: "6px 0" }}>{P.layer}</div>
        <div style={{ textAlign: "center", color: c.muted, fontSize: 16, lineHeight: 1 }}>▽</div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {engines.map(([k, col]) => <div key={k} style={{ flex: 1, textAlign: "center", background: c.card2, border: `1px solid ${col}55`, borderRadius: 12, padding: "10px 4px", fontSize: 10.5, fontWeight: 700, color: col }}>{P[k]}</div>)}
        </div>
      </div>

      {/* الأطراف الثلاثة */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {parties.map(([nk, dk, Icon, col]) => (
          <div key={nk} style={{ display: "flex", gap: 12, background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: 15 }}>
            <IconBubble icon={Icon} color={col} bg={col + "22"} size={22} box={42} radius={12} />
            <div><div style={{ fontWeight: 700, fontSize: 14 }}>{P[nk]}</div><div style={{ fontSize: 12, color: c.textSoft, lineHeight: 1.6, marginTop: 2 }}>{P[dk]}</div></div>
          </div>
        ))}
      </div>

      {/* لوحة الجامعة */}
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 16, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 12, color: c.accentText }}>{P.uniDash}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[[P.uniStudents, "4,250"], [P.uniAwareness, "64%"], [P.uniComplete, "78%"]].map(([l, v]) => <div key={l} style={{ flex: 1, textAlign: "center", background: c.card2, borderRadius: 14, padding: "12px 4px" }}><div style={{ fontSize: 22, fontWeight: 800, color: c.accent }}><Metric value={v} /></div><div style={{ fontSize: 10, color: c.muted, marginTop: 3 }}>{l}</div></div>)}
        </div>
      </div>

      {/* لوحة البنك */}
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 12, color: c.terra }}>{P.bankDash}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[[P.bankTopPersona, lang === "ar" ? PERSONA_META.social.ar : PERSONA_META.social.en], [P.bankAvgAware, "64%"], [P.bankTopCh, lang === "ar" ? "تحدّي القهوة" : "Coffee challenge"]].map(([l, v], i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", background: c.card2, borderRadius: 12, padding: "10px 14px", fontSize: 12.5 }}><span style={{ color: c.textSoft }}>{l}</span><span style={{ fontWeight: 700 }}><Metric value={v} /></span></div>)}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: c.muted, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, textAlign: "center" }}><Lock size={13} aria-hidden="true" />{P.bankAnon}</div>
      </div>

      {/* طبقة APIs */}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: c.accentText }}>{P.apisTitle}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
        {P.apis.map(([name, desc], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: c.card2, display: "grid", placeItems: "center", flexShrink: 0 }}><Zap size={15} color={c.accent} /></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div><div style={{ fontSize: 11, color: c.muted }}>{desc}</div></div>
            <span style={{ fontSize: 10, fontWeight: 700, color: c.terra, background: c.terra + "22", borderRadius: 999, padding: "3px 9px" }}>{P.apiMock}</span>
          </div>
        ))}
      </div>

      {/* الالتزام القانوني */}
      <div style={{ background: c.card2, border: `1px dashed ${c.line}`, borderRadius: 16, padding: 15 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, marginBottom: 6 }}><Check size={15} color={c.green} />{P.legalTitle}</div>
        <div style={{ fontSize: 11.5, color: c.textSoft, lineHeight: 1.7 }}>{P.legal}</div>
      </div>
    </FullPage>
  );
}
function RoundUpCard() {
  const { c, s, lang, roundOn, setRoundOn, roundMult, setRoundMult, roundVault, setRoundVault, setSavings, flash } = useCtx();
  function convert() { if (roundVault <= 0) return flash(s.roundEmpty); const x = roundVault; setSavings((v) => v + Math.round(x)); setRoundVault(0); flash(s.roundConverted(x)); }
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  return (
    <div style={{ borderRadius: 24, padding: 18, background: `linear-gradient(135deg, ${c.card2}, ${c.card})`, border: `1px solid ${c.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconBubble icon={Coins} color={c.accentText} bg={c.accent + "1A"} size={20} box={40} radius={12} />
          <div><div style={{ fontWeight: 700 }}>{s.roundTitle}</div><div style={{ fontSize: 11.5, color: c.muted }}>{s.roundSub}</div></div>
        </div>
        <Toggle on={roundOn} onClick={() => setRoundOn(!roundOn)} label={s.roundOn} />
      </div>
      {/* جملة الهدف الواضحة */}
      <div style={{ background: c.accent + "1A", color: c.accentText, borderRadius: 12, padding: "9px 12px", marginTop: 12, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, textAlign: "center" }}><Target size={15} aria-hidden="true" />{s.roundGoal}</div>
      {/* مثال حيّ يشرح كيف يشتغل */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11.5, color: c.muted, marginBottom: 7 }}>{s.roundHowTitle}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
          <div style={{ flex: 1, textAlign: "center", background: c.card2, border: `1px solid ${c.line}`, borderRadius: 11, padding: "9px 4px", fontSize: 11.5, fontWeight: 600 }}>{riyalText(s.roundExA)}</div>
          <Arrow size={15} color={c.muted} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, textAlign: "center", background: c.card2, border: `1px solid ${c.line}`, borderRadius: 11, padding: "9px 4px", fontSize: 11.5, fontWeight: 600 }}>{riyalText(s.roundExB)}</div>
          <Arrow size={15} color={c.green} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1.1, textAlign: "center", background: c.green + "22", border: `1px solid ${c.green}55`, color: c.green, borderRadius: 11, padding: "9px 4px", fontSize: 11.5, fontWeight: 700 }}>{riyalText(s.roundExC)}</div>
        </div>
      </div>
      {/* العدّاد */}
      <div style={{ textAlign: "center", margin: "16px 0 4px" }}>
        <div style={{ fontSize: 11.5, color: c.muted }}>{s.roundCollected}</div>
        <div style={{ fontSize: 32, fontWeight: 800 }}><AnimatedNumber value={roundVault} formatter={(n) => n.toFixed(2)} duration={0.6} /> <RS size="0.55em" color={c.muted} /></div>
      </div>
      <div style={{ fontSize: 11, color: c.muted, textAlign: "center", lineHeight: 1.7, margin: "0 4px 6px" }}>{s.roundWhy}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: c.card2, border: `1px solid ${c.line}`, borderRadius: 14, padding: "8px 12px", marginTop: 8 }}>
        <span style={{ fontSize: 12.5, color: c.textSoft }}>{s.roundMult}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3].map((m) => <button key={m} onClick={() => setRoundMult(m)} style={{ width: 36, height: 32, borderRadius: 9, border: roundMult === m ? "none" : `1px solid ${c.line}`, background: roundMult === m ? c.accent : "transparent", color: roundMult === m ? c.onAccent : c.muted, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", fontSize: 13 }}>×{m}</button>)}
        </div>
      </div>
      <button onClick={convert} style={{ ...btn(c.accent, c.onAccent), height: 40, marginTop: 10 }}>{s.roundConvert}</button>
    </div>
  );
}
function JobsPage() {
  const { c, s, lang, setOverlay, setBalance, setSavings, flash } = useCtx();
  const [sel, setSel] = useState(null);
  function work(j) { const save = Math.round(j.pay * 0.2); setBalance((b) => b + j.pay); setSavings((v) => v + save); flash(s.jobEarned(j.pay, save)); }
  if (sel !== null) {
    const j = JOBS[sel];
    return (
      <FullPage title={j.t[lang]} sub={j.org[lang]} onClose={() => setSel(null)}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 16 }}>
          <IconBubble icon={j.icon} color={c.accentText} bg={c.card2} size={27} box={54} radius={16} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 22 }}><Metric value={j.pay} /> <RS size="0.6em" /></div><div style={{ fontSize: 11.5, color: c.muted }}>{j.unit[lang]} · {j.dur[lang]}</div></div>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "14px 0" }}>
          {[j.mode[lang], j.loc[lang], s.jobSlots(j.slots)].map((tg) => <span key={tg} style={{ background: c.card2, border: `1px solid ${c.line}`, color: c.textSoft, borderRadius: 999, padding: "5px 12px", fontSize: 11.5 }}>{tg}</span>)}
        </div>
        <Sect title={s.jobAbout} c={c}><div style={{ fontSize: 13.5, color: c.textSoft, lineHeight: 1.8 }}>{j.desc[lang]}</div></Sect>
        <Sect title={s.jobReqs} c={c}>{j.reqs[lang].map((r, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: c.textSoft, padding: "4px 0" }}><Check size={15} color={c.green} />{r}</div>)}</Sect>
        <Sect title={s.jobHow} c={c}>{s.jobSteps.map((st, i) => <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0" }}><span style={{ width: 22, height: 22, borderRadius: 999, background: c.accent, color: c.onAccent, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span><span style={{ fontSize: 13, color: c.textSoft, lineHeight: 1.6 }}>{st}</span></div>)}</Sect>
        <button onClick={() => { work(j); flash(s.jobApplied); setSel(null); }} style={btn(c.accent, c.onAccent)}>{s.jobApplyNow}</button>
      </FullPage>
    );
  }
  return (
    <FullPage title={s.jobsTitle} sub={s.jobsPageSub} onClose={() => setOverlay(null)}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: `linear-gradient(135deg, ${c.accent}, ${c.accentText})`, color: c.onAccent, borderRadius: 18, padding: "13px 16px", marginBottom: 14, fontSize: 13, fontWeight: 600 }}><TrendingUp size={18} />{s.jobAvg}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {JOBS.map((j, i) => (
          <button key={i} type="button" onClick={() => setSel(i)} style={{ width: "100%", background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 16, cursor: "pointer", color: c.text, fontFamily: "inherit", textAlign: "start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <IconBubble icon={j.icon} color={c.accentText} bg={c.card2} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{j.t[lang]}</div>
                <div style={{ fontSize: 11.5, color: c.muted }}>{j.org[lang]} · {j.loc[lang]}</div>
              </div>
              <div style={{ textAlign: "end" }}><div style={{ fontWeight: 800, fontSize: 16 }}><Metric value={j.pay} /> <RS /></div><div style={{ fontSize: 10.5, color: c.muted }}>{j.unit[lang]}</div></div>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
              {[j.dur[lang], j.mode[lang]].map((tg) => <span key={tg} style={{ background: c.card2, border: `1px solid ${c.line}`, color: c.textSoft, borderRadius: 999, padding: "4px 11px", fontSize: 11 }}>{tg}</span>)}
              <span style={{ marginInlineStart: "auto", fontSize: 12, color: c.accentText, fontWeight: 700 }}>{s.jobDetails} ←</span>
            </div>
          </button>
        ))}
      </div>
    </FullPage>
  );
}
function Sect({ title, c, children }) {
  return <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: 16, marginBottom: 12 }}><div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, color: c.accentText }}>{title}</div>{children}</div>;
}
function CashbackPage() {
  const { c, s, lang, setOverlay, flash } = useCtx();
  const [earned, setEarned] = useState(0);
  const [active, setActive] = useState([]);
  const [sel, setSel] = useState(null);
  function activate(i) { if (active.includes(i)) return; setActive((a) => [...a, i]); setEarned((e) => e + 15); flash(s.cashOn); }
  if (sel !== null) {
    const x = CASH[sel]; const on = active.includes(sel);
    return (
      <FullPage title={x.cat[lang]} sub={s.cashOffersSub} onClose={() => setSel(null)}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 16, marginBottom: 14 }}>
          <IconBubble icon={x.icon} color={c.onAccent} bg={c[x.ck]} size={27} box={54} radius={16} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 18 }}>{x.cat[lang]}</div><div style={{ color: c[x.ck], fontWeight: 800, fontSize: 15 }}><Metric value={`${x.back}%`} /> <span style={{ fontSize: 11.5, color: c.muted, fontWeight: 600 }}>{s.backWord}</span></div></div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: c.accentText, marginBottom: 10 }}>{s.cashOffersList}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {x.offers.map((o, k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, background: c.card, border: `1px solid ${c.line}`, borderRadius: 16, padding: "13px 15px" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: c.card2, display: "grid", placeItems: "center", flexShrink: 0 }}><Tag size={16} color={c[x.ck]} /></div>
              <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{o[lang]}</div>
            </div>
          ))}
        </div>
        <button onClick={() => activate(sel)} disabled={on} style={{ ...btn(on ? c.card2 : c.accent, on ? c.green : c.onAccent), marginTop: 16, border: on ? `1px solid ${c.line}` : "none" }}>{on ? s.cashActive : s.cashActivate}</button>
      </FullPage>
    );
  }
  return (
    <FullPage title={s.cashTitle} sub={s.cashPageSub} onClose={() => setOverlay(null)}>
      <div style={{ borderRadius: 22, padding: "18px 20px", marginBottom: 16, background: `linear-gradient(135deg, ${c.terra}, ${c.terraText})`, color: c.onTerra }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.9 }}>{s.cashEarned}</div>
        <div style={{ fontSize: 32, fontWeight: 800 }}><Metric value={earned} /> <RS size="0.55em" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {CASH.map((x, i) => {
          const on = active.includes(i);
          return (
            <div key={i} style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 16 }}>
              <button type="button" onClick={() => setSel(i)} style={{ width: "100%", background: "transparent", border: "none", padding: 0, color: c.text, fontFamily: "inherit", textAlign: "start", cursor: "pointer" }}>
              <IconBubble icon={x.icon} color={c.onAccent} bg={c[x.ck]} size={22} box={44} radius={13} />
              <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 10 }}>{x.cat[lang]}</div>
              <div style={{ color: c[x.ck], fontWeight: 800, fontSize: 17 }}><Metric value={`${x.back}%`} /> <span style={{ fontSize: 11, color: c.muted, fontWeight: 600 }}>{s.backWord}</span></div>
              <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}><Metric value={x.offers.length} /> {s.cashOffersCount} ←</div>
              </button>
              <button onClick={(ev) => { ev.stopPropagation(); activate(i); }} disabled={on} style={{ ...btn(on ? c.card2 : c.accent, on ? c.green : c.onAccent), height: 36, marginTop: 10, fontSize: 12.5, border: on ? `1px solid ${c.line}` : "none" }}>{on ? s.cashActive : s.cashActivate}</button>
            </div>
          );
        })}
      </div>
    </FullPage>
  );
}
function lbColor(c, p) { return p >= 88 ? c.green : p >= 80 ? c.accentText : c.terraText; }
function LbRow({ rank, row, c, s, lang }) {
  const handle = row.you ? s.peerYou : s.stuPrefix + row.id;
  const av = LB_COLORS[rank % LB_COLORS.length];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 16, marginBottom: 8, background: row.you ? c.accent : c.card2, color: row.you ? c.onAccent : c.text, border: row.you ? "none" : `1px solid ${c.line}` }}>
      <span style={{ fontSize: 14, fontWeight: 800, width: 22, textAlign: "center", opacity: row.you ? 1 : 0.9 }}><Metric value={rank} /></span>
      <span style={{ width: 38, height: 38, borderRadius: 999, flexShrink: 0, background: row.you ? "rgba(255,255,255,0.25)" : av, display: "grid", placeItems: "center", fontSize: 15, fontWeight: 700, color: row.you ? c.onAccent : "#0A1822" }}>{row.you ? (lang === "ar" ? "و" : "W") : row.id[0]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: row.you ? 800 : 600 }}>{handle}</div>
        <div style={{ fontSize: 10.5, opacity: 0.75 }}><Metric value={row.done} /> {s.chDoneLabel}</div>
      </div>
      <div style={{ textAlign: "end" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: row.you ? c.onAccent : lbColor(c, row.pct) }}><Metric value={`${row.pct}%`} /></div>
        <div style={{ fontSize: 9.5, opacity: 0.7 }}>{s.commit}</div>
      </div>
    </div>
  );
}
function LeaderboardCard() {
  const { c, s, lang, setShowLeaderboard } = useCtx();
  const top = LB.slice(0, 3);
  const myRank = LB.findIndex((r) => r.you) + 1;
  return (
    <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}><Trophy size={16} color={c.accentText} />{s.leader}</div>
      <div style={{ fontSize: 11.5, color: c.muted, marginBottom: 12 }}>{s.leaderSub}</div>
      {top.map((r, i) => <LbRow key={i} rank={i + 1} row={r} c={c} s={s} lang={lang} />)}
      <LbRow rank={myRank} row={LB[myRank - 1]} c={c} s={s} lang={lang} />
      <button onClick={() => setShowLeaderboard(true)} style={{ ...btn(c.card2, c.text), height: 40, border: `1px solid ${c.line}`, fontSize: 13 }}>{s.viewAll}</button>
    </div>
  );
}
function LeaderboardPage() {
  const { c, s, lang, setShowLeaderboard } = useCtx();
  const [period, setPeriod] = useState(s.periodW);
  const myRank = LB.findIndex((r) => r.you) + 1;
  const me = LB[myRank - 1];
  const above = LB[myRank - 2];
  const Back = lang === "ar" ? ChevronRight : ChevronLeft;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 55, background: c.bg0, display: "flex", flexDirection: "column", animation: "wUp .3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "calc(env(safe-area-inset-top,0px) + 16px) 18px 12px", flexShrink: 0 }}>
        <button onClick={() => setShowLeaderboard(false)} style={{ width: 38, height: 38, borderRadius: 12, background: c.card, border: `1px solid ${c.line}`, color: c.text, display: "grid", placeItems: "center", cursor: "pointer" }}><Back size={20} /></button>
        <div><div style={{ fontSize: 19, fontWeight: 800 }}>{s.leader}</div><div style={{ fontSize: 11.5, color: c.muted }}>{s.lbMetric}</div></div>
      </div>
      <div className="wscroll" style={{ flex: 1, overflowY: "auto", padding: "4px 18px 28px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: 4, marginBottom: 14 }}>
            {[s.periodW, s.periodM].map((o) => <button key={o} onClick={() => setPeriod(o)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: period === o ? c.accent : "transparent", color: period === o ? c.onAccent : c.muted }}>{o}</button>)}
          </div>

          <div style={{ borderRadius: 22, padding: "18px 20px", marginBottom: 16, background: `linear-gradient(135deg, ${c.accent}, ${c.accentText})`, color: c.onAccent }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85 }}>{s.yourRank}</div>
                <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>#<Metric value={myRank} /> <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}>{s.ofN(LB.length)}</span></div>
              </div>
              <div style={{ textAlign: "end" }}><div style={{ fontSize: 30, fontWeight: 800 }}><Metric value={`${me.pct}%`} /></div><div style={{ fontSize: 11, opacity: 0.8 }}>{s.commit}</div></div>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 10, opacity: 0.95 }}>{above ? s.lbGap(above.pct - me.pct, myRank - 1) : s.lbTop}</div>
          </div>

          {LB.map((r, i) => <LbRow key={i} rank={i + 1} row={r} c={c} s={s} lang={lang} />)}
        </div>
      </div>
    </div>
  );
}

function BalanceCard() {
  const { c, s, balance, setTab, setSheet } = useCtx();
  const actions = [
    { t: s.transfer, icon: ArrowLeftRight, go: () => setSheet({ type: "transfer" }) },
    { t: s.deposit, icon: ArrowDownToLine, go: () => setSheet({ type: "topup" }) },
    { t: s.invest, icon: TrendingUp, go: () => setTab("invest") },
  ];
  return (
    <div style={{ borderRadius: 26, padding: "20px 20px 16px", background: `linear-gradient(135deg, ${c.bg1} 0%, ${c.card2} 100%)`, border: `1px solid ${c.line}` }}>
      <div style={{ fontSize: 12.5, color: c.muted }}>{s.balance}</div>
      <div style={{ fontSize: 33, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2 }}><AnimatedNumber value={balance} formatter={(n) => `${fmt(n)}.00`} /> <RS size="0.62em" color={c.muted} /></div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {actions.map((a) => { const I = a.icon; return (
          <motion.button key={a.t} onClick={a.go} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} style={{ flex: 1, background: c.card, border: `1px solid ${c.line}`, borderRadius: 15, padding: "11px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", fontFamily: "inherit", color: c.text }}>
            <span style={{ width: 34, height: 34, borderRadius: 11, background: c.accent, display: "grid", placeItems: "center" }}><I size={17} color={c.onAccent} /></span>
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>{a.t}</span>
          </motion.button>
        ); })}
      </div>
    </div>
  );
}

function WeeklyCard() {
  const { c, s, lang, weekCats, weeks, entries, curWeek, cats } = useCtx();
  const [sel, setSel] = useState(null);
  const spentSoFar = weeks.reduce((a, b) => a + b, 0);
  const avg = Math.round(spentSoFar / (curWeek + 1));
  const projected = avg * 4;
  const leftToSpend = Math.max(0, SPENDABLE - spentSoFar);
  const save = Math.max(0, SPENDABLE - projected);
  const topKey = Object.keys(cats).reduce((a, b) => (cats[a] >= cats[b] ? a : b));
  const extra = Math.round(cats[topKey] * 0.2);
  const segs = [{ k: "food", col: c.terra }, { k: "transport", col: c.accent }, { k: "fun", col: c.accentText }, { k: "other", col: c.green }];
  const colOf = (k) => segs.find((x) => x.k === k).col;
  const maxT = Math.max(...weeks, 1);
  const AREA = 110;
  return (
    <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontWeight: 700 }}>{s.weekly}</div>
        <div style={{ fontSize: 11.5, color: c.muted }}>{s.tapWeek}</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 16 }}>
        {weekCats.map((w, i) => {
          const total = weeks[i], on = i === curWeek, future = total === 0 && i > curWeek, active = sel === i;
          const barH = total > 0 ? Math.max(10, (total / maxT) * AREA) : 6;
          return (
            <button key={i} type="button" onClick={() => setSel(active ? null : i)} style={{ flex: 1, textAlign: "center", cursor: "pointer", background: "transparent", border: "none", padding: 0, color: c.text, fontFamily: "inherit" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: future ? c.muted : c.text, marginBottom: 5 }}>{future ? "—" : <Metric value={total} />}</div>
              <div style={{ height: AREA, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <motion.div initial={{ scaleY: 0.08 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.5, delay: i * 0.06, ease: easeOut }} style={{ width: "78%", height: barH, borderRadius: "8px 8px 3px 3px", overflow: "hidden", display: "flex", flexDirection: "column", transformOrigin: "bottom", background: future ? c.inputBg : c.card2, boxShadow: active ? `0 0 0 2px ${c.accent}` : on ? `0 0 0 1.5px ${c.line}` : "none", opacity: sel != null && !active ? 0.55 : 1, transition: "opacity .2s" }}>
                  {total > 0 && segs.map((sg) => { const h = (w[sg.k] / total) * 100; return h > 0 ? <div key={sg.k} style={{ height: `${h}%`, background: sg.col }} /> : null; })}
                </motion.div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 6 }}>
                <span style={{ fontSize: 10.5, color: active || on ? c.accentText : c.muted, fontWeight: active || on ? 700 : 500 }}>{s.week(i + 1)}</span>
                {!future && <ChevronDown size={11} color={c.muted} style={{ transform: active ? "rotate(180deg)" : "none", transition: "transform .2s" }} />}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 14, justifyContent: "center" }}>
        {segs.map((sg) => <div key={sg.k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: c.muted }}><span style={{ width: 9, height: 9, borderRadius: 3, background: sg.col }} />{s.cats[sg.k]}</div>)}
      </div>

      {sel != null && <WeekDetails week={sel} entries={entries.filter((e) => e.week === sel)} colOf={colOf} />}

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <MiniBox label={s.leftSpend} value={<><Metric value={leftToSpend} /> <RS /></>} tone={c.text} />
        <MiniBox label={s.canSave} value={<><Metric value={save} /> <RS /></>} tone={c.green} />
      </div>
      <div style={{ marginTop: 12, background: c.card2, border: `1px solid ${c.line}`, borderRadius: 14, padding: "11px 13px", fontSize: 12.5, lineHeight: 1.7, color: c.textSoft, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <InlineIcon icon={Lightbulb} color={c.accentText} size={16} />
        {lang === "ar"
          ? <span>أنت في الأسبوع {s.weekOrd[curWeek]} — بمعدّلك الحالي ({fmt(avg)} <RS />/أسبوع) راح توفّر ~<b style={{ color: c.green }}><Metric value={save} /> <RS /></b> نهاية الشهر. لو قلّلت <b>{s.cats[topKey]}</b> 20% تضيف <b style={{ color: c.accentText }}><Metric value={extra} /> <RS /></b> لمحفظتك.</span>
          : <span>You're in week {curWeek + 1} — at your pace ({fmt(avg)} <RS />/wk) you'll save ~<b style={{ color: c.green }}><Metric value={save} /> <RS /></b> by month-end. Cut <b>{s.cats[topKey]}</b> 20% to add <b style={{ color: c.accentText }}><Metric value={extra} /> <RS /></b> to your portfolio.</span>}
      </div>
    </div>
  );
}

function WeekDetails({ week, entries, colOf }) {
  const { c, s, lang } = useCtx();
  const [open, setOpen] = useState(null);
  let cum = 0;
  return (
    <div style={{ marginTop: 14, background: c.card2, border: `1px solid ${c.line}`, borderRadius: 16, padding: 12, animation: "wUp .3s ease both" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 4px 8px" }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.weekDetails(s.weekOrd[week])}</div>
        <div style={{ fontSize: 11, color: c.muted }}>{s.weekLimit} <Metric value={WEEK_LIMIT} /> <RS /></div>
      </div>
      {entries.length === 0 && <div style={{ textAlign: "center", color: c.muted, fontSize: 12.5, padding: "14px 0" }}>{s.noExpenses}</div>}
      {entries.map((e, i) => {
        cum += e.amt; const remain = WEEK_LIMIT - cum; const isOpen = open === e.id;
        return (
          <button key={e.id} type="button" onClick={() => setOpen(isOpen ? null : e.id)} style={{ width: "100%", cursor: "pointer", padding: "10px 6px", border: "none", borderBottom: i < entries.length - 1 ? `1px solid ${c.line}` : "none", background: "transparent", color: c.text, fontFamily: "inherit", textAlign: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: c.terraText }}>−<Metric value={e.amt} /> <RS /></div>
                <div style={{ fontSize: 10.5, color: remain < 0 ? c.terraText : c.muted, marginTop: 1 }}>{s.leftOfLimit(remain)}</div>
              </div>
              <div style={{ textAlign: "end" }}>
                <div style={{ fontSize: 12.5, color: c.textSoft }}>{e.date[lang]}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, fontSize: 10.5, color: c.muted, marginTop: 1 }}>
                  {s.cats[e.cat]}<span style={{ width: 8, height: 8, borderRadius: 3, background: colOf(e.cat) }} />
                </div>
              </div>
            </div>
            {isOpen && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${c.line}`, display: "flex", flexDirection: "column", gap: 7, animation: "wUp .25s ease both" }}>
                <Detail icon={Store} text={e.place[lang]} c={c} />
                <Detail icon={Clock} text={`${e.date[lang]} · ${e.time[lang]}`} c={c} />
                <Detail icon={MapPin} text={e.location[lang]} c={c} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
function Detail({ icon: Icon, text, c }) { return <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: c.textSoft }}><Icon size={15} color={c.accentText} />{text}</div>; }

/* ===================== التحليلات ===================== */
function Analytics() {
  const { c, s, lang, dir, spent, available, savings, cats, tx, addSpend, setLoanOffer, flash } = useCtx();
  const [period, setPeriod] = useState(s.seg[2]);
  const [amt, setAmt] = useState(""); const [why, setWhy] = useState("");
  const list = [{ k: "food", col: c.terra }, { k: "transport", col: c.accent }, { k: "fun", col: c.accentText }, { k: "other", col: c.green }];
  const maxV = Math.max(...list.map((x) => cats[x.k]), 1);
  const trend = [60, 58, 62, 55, 50, 53, 47, 44, 46, 40];
  function log() {
    const a = parseFloat(amt);
    if (!a || a <= 0) return flash(s.badAmount);
    if (!why.trim()) return flash(s.askReason);
    const place = { ar: why.trim(), en: why.trim() };
    const cat = catFromText(why);
    const decision = evaluateSpend({ amount: a, available });
    if (decision.kind === "spend") { addSpend(cat, a, place); flash(s.logged(available - a)); setAmt(""); setWhy(""); }
    else if (decision.kind === "loanOffer") { setLoanOffer({ ...decision, pending: { amount: a, place, cat } }); setAmt(""); setWhy(""); }
    else flash(s.noBal);
  }
  return (
    <div>
      <ScreenHead title={s.analytics} />
      <Seg options={s.seg} value={period} onChange={setPeriod} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
        <div style={{ fontSize: 12.5, color: c.muted }}>{s.totalSavings}</div>
        <div style={{ fontSize: 30, fontWeight: 700 }}><AnimatedNumber value={savings} formatter={(n) => `${fmt(n)}.00`} /> <RS size="0.6em" color={c.muted} /></div>
        <div style={{ color: c.accentText, fontSize: 13, fontWeight: 600 }}>▲ <AnimatedNumber value={1560} formatter={(n) => `+${fmt(n)}.00`} /> {s.thisTerm}</div>
        <Spark data={trend} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <MetricCard label={s.income} value="1,000" tone={c.accentText} sign={s.monthlyStipend} />
        <MetricCard label={s.remaining} value={fmt(available)} tone={available > 0 ? c.green : c.terra} sign={available > 0 ? s.onTrack : s.over} />
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{lang === "ar" ? <>أين صرفت <Metric value={spent} /> <RS />؟</> : <>Where did <Metric value={spent} /> <RS /> go?</>}</div>
        {list.map((x, i) => (
          <div key={x.k} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}><span>{s.cats[x.k]}</span><span style={{ color: c.muted }}><Metric value={cats[x.k]} /> <RS /></span></div>
            <div style={{ height: 7, background: c.inputBg, borderRadius: 9 }}><motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: cats[x.k] / maxV }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.55, delay: i * 0.06, ease: easeOut }} style={{ width: "100%", height: "100%", background: x.col, borderRadius: 9, transformOrigin: dir === "rtl" ? "right center" : "left center" }} /></div>
          </div>
        ))}
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{s.recent}</div>
        {tx.map((t, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < tx.length - 1 ? `1px solid ${c.line}` : "none" }}>
            <span style={{ fontSize: 13.5 }}>{t.place[lang]}</span>
            <span style={{ fontSize: 12.5, color: t.cat === "topup" ? c.green : c.muted }}>{s.cats[t.cat]} · {t.cat === "topup" ? "+" : "−"}<Metric value={t.amt} /> <RS /></span>
          </div>
        ))}
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18 }}>
        <div style={{ fontWeight: 700 }}>{s.logExpense}</div>
        <div style={{ fontSize: 11.5, color: c.muted, marginBottom: 10 }}>{s.everyRiyal}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))} placeholder={s.amount} inputMode="decimal" style={inp(c)} />
          <input value={why} onChange={(e) => setWhy(e.target.value)} placeholder={s.reason} style={{ ...inp(c), flex: 2 }} />
        </div>
        <button onClick={log} style={btn(c.accent, c.onAccent)}>{s.log}</button>
      </div>
      </div>
    </div>
  );
}

/* ===================== شات وعي ===================== */
function AIChat() {
  const { c, s, lang, spent, available, savings, loanTaken, nextStipend, invested, cats, weeks, curWeek, balance, points, persona } = useCtx();
  const st = { spent, available, savings, loanTaken, nextStipend, invested, cats };
  const [messages, setMessages] = useState([{ role: "assistant", key: "hello", text: s.hello }]);
  const [input, setInput] = useState(""); const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => { setMessages((m) => translateSystemMessages(m, lang, { ar: { hello: L.ar.hello }, en: { hello: L.en.hello } })); }, [lang]);

  async function callModel(system, apiMsgs) {
    const endpoint = import.meta.env.VITE_AI_ENDPOINT;
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 22000);
      try {
        const text = await callConfiguredAi({
          endpoint,
          fetcher: fetch,
          signal: ctrl.signal,
          payload: { system, messages: apiMsgs },
        });
        clearTimeout(timer);
        if (text) return text;
      } catch { clearTimeout(timer); }
    }
    return null;
  }

  async function send(preset) {
    const content = (preset ?? input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user", text: content }];
    setMessages(next); setInput(""); setBusy(true);
    const intent = detectIntent(content);
    // اختيار الرسم البياني المناسب حسب السؤال (توزيع/توقّع أسبوعي شهري سنوي/استثمار)
    const chart = pickChart(content, intent);
    let widget = chart?.kind === "invest" ? investLocal(st, lang).widget : (chart || undefined);
    // عرض قرض تفاعلي لو طلب مبلغاً أكبر من المتاح → يُخصم من راتب الشهر الجاي
    if (intent === "loan") {
      const n = nums(content);
      const have = n.length >= 2 ? Math.min(...n) : available;
      const need = n.length ? Math.max(...n) : 0;
      const gap = Math.max(0, need - have);
      if (gap > 0) widget = { kind: "loan", need, have, gap, offer: Math.min(250, Math.ceil(gap / 50) * 50) };
    }

    const langName = lang === "ar" ? "Saudi Arabic (warm, friendly Gulf dialect)" : "English";
    const personaKey = ["social", "emotional", "impulsive"][persona] || "social";
    const snapshot = {
      stipend: STIPEND, balance, spent, available, savings, invested, loan: loanTaken, nextStipend, points,
      spendingByCategory: { foodAndDrinks: cats.food, transport: cats.transport, entertainment: cats.fun, other: cats.other },
      weeklySpending: weeks, currentWeek: curWeek + 1, weeklyLimit: WEEK_LIMIT,
      spendingPersonality: personaKey, peerSavingPercentile: 68, leaderboardRank: 5, leaderboardOutOf: LB.length,
      weeklyChallenges: s.challengeList.map((ch) => ch.t),
      availableTempJobs: JOBS.map((j) => ({ title: j.t.en, pay: j.pay, unit: j.unit.en, mode: j.mode.en })),
      cashbackCategories: CASH.map((x) => ({ category: x.cat.en, cashbackPercent: x.back })),
    };
    const system = `You are "Waey" (وعي), a behavioral money-intelligence assistant inside a finance app for Saudi university students (17–25) who receive a 1000 SAR monthly stipend. Saudi national savings rate is only 1.6% — your mission is to gently change spending behavior, not just track numbers. You are highly capable: understand the user deeply and always propose concrete, complete solutions.

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

    const hist = next.filter((m) => m.role === "user" || m.role === "assistant");
    const start = hist.findIndex((m) => m.role === "user");
    const apiMsgs = hist.slice(start < 0 ? 0 : start).map((m) => ({ role: m.role, content: m.text }));

    const raw = await callModel(system, apiMsgs);
    const text = raw ? cleanMd(raw) : null;
    if (text) {
      setMessages((m) => [...m, { role: "assistant", text, widget }]);
    } else {
      const localText = (intent === "invest" ? investLocal(st, lang)
        : intent === "budget" ? budgetLocal(lang)
        : intent === "cheapest" ? cheapestLocal(st, lang)
        : intent === "loan" ? loanLocal(st, content, lang)
        : generalLocal(st, content, lang)).text;
      setMessages((m) => [...m, { role: "assistant", text: localText, widget }]);
    }
    setBusy(false);
  }
  const [coachSheet, setCoachSheet] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 2px 14px" }}>
        <div style={{ width: 40, height: 40, borderRadius: 13, background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, display: "grid", placeItems: "center" }}><Sparkles size={20} color="#fff" /></div>
        <div><div style={{ fontWeight: 700, fontSize: 17 }}>{s.coach.title}</div><div style={{ fontSize: 11.5, color: c.muted }}>{s.coach.sub}</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 12 }}>
        {[["analyze", Search, c.accent], ["save", CircleDollarSign, c.green], ["explain", BarChart3, c.accentText], ["suggest", Target, c.terra]].map(([k, Icon, col]) => (
          <button key={k} onClick={() => setCoachSheet(k)} style={{ display: "flex", alignItems: "center", gap: 10, background: c.card, border: `1px solid ${c.line}`, borderRadius: 16, padding: "13px 12px", cursor: "pointer", fontFamily: "inherit", textAlign: "start", color: c.text }}>
            <IconBubble icon={Icon} color={col} bg={col + "22"} size={17} box={34} radius={10} />
            <span style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3 }}>{s.coach[k]}</span>
          </button>
        ))}
      </div>
      <div className="wscroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 11, paddingBottom: 8 }}>
        {messages.map((m, i) => <Bubble key={i} {...m} />)}
        {busy && <div style={{ alignSelf: "flex-start", display: "flex", gap: 5, padding: "10px 14px" }}>{[0, 1, 2].map((d) => <span key={d} style={{ width: 7, height: 7, borderRadius: 9, background: c.accent, animation: `wDot 1.2s ${d * .15}s infinite` }} />)}</div>}
        <div ref={end} />
      </div>
      <div style={{ display: "flex", gap: 7, padding: "8px 0", flexWrap: "wrap" }}>
        {s.chips.map((q) => <button key={q} onClick={() => send(q)} style={chip(c)}>{q}</button>)}
      </div>
      <div style={{ display: "flex", gap: 9, paddingTop: 2 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={s.msgPlaceholder} style={{ ...inp(c), flex: 1 }} />
        <button onClick={() => send()} disabled={busy} style={{ width: 46, height: 46, borderRadius: 13, border: "none", background: c.accent, display: "grid", placeItems: "center", cursor: "pointer", opacity: busy ? .5 : 1 }}><Send size={18} color={c.onAccent} /></button>
      </div>
      {coachSheet && <CoachSheet which={coachSheet} onClose={() => setCoachSheet(null)} />}
    </div>
  );
}
function CoachSheet({ which, onClose }) {
  const { c, s } = useCtx();
  const CO = s.coach;
  const meta = { analyze: [Search, CO.analyze, c.accent], save: [CircleDollarSign, CO.save, c.green], explain: [BarChart3, CO.explain, c.accentText], suggest: [Target, CO.suggest, c.terra] }[which];
  const [Icon, title, col] = meta;
  return (
    <Sheet title={title} icon={undefined} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <IconBubble icon={Icon} color={col} bg={col + "22"} size={24} />
        <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
      </div>
      {which === "explain" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {CO.explainR.map((line, i) => {
            const Icon = i < 2 ? Check : TriangleAlert;
            const col = i < 2 ? c.green : c.terraText;
            return <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, background: c.card, border: `1px solid ${c.line}`, borderRadius: 13, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.6 }}><Icon size={15} color={col} aria-hidden="true" />{line.trim()}</div>;
          })}
        </div>
      ) : (
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 16, padding: 16, fontSize: 14, lineHeight: 1.8, color: c.textSoft }}>{riyalText(CO[which + "R"])}</div>
      )}
      <div style={{ fontSize: 12, color: c.muted, textAlign: "center", marginTop: 14 }}>{CO.askMore}</div>
    </Sheet>
  );
}

/* ===================== الاستثمار ===================== */
function Invest() {
  const { c, s, lang, savings, invested, setSavings, setInvested, flash } = useCtx();
  function put(a) { if (a > savings) return flash(s.tooMuch); setSavings((x) => x - a); setInvested((v) => v + a); flash(s.invested(a)); }
  return (
    <div>
      <ScreenHead title={s.nav.invest} />
      <div style={{ borderRadius: 24, padding: 20, marginTop: 6, background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accentText} 100%)`, color: c.onAccent }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, opacity: .85 }}>{s.portfolio}</div>
        <div style={{ fontSize: 30, fontWeight: 700 }}><AnimatedNumber value={invested} formatter={(n) => `${fmt(n)}.00`} /> <RS size="0.6em" /></div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{riyalText(s.expRet(fmt(invested * 1.25)))}</div>
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 24, padding: 18, marginTop: 14 }}>
        <div style={{ fontWeight: 700 }}>{s.journey}</div>
        <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.7, marginTop: 4 }}>
          {lang === "ar"
            ? <>باستمرار الادّخار + الاستثمار، تحوّل 60,000 خلال دراستك إلى <b style={{ color: c.accentText }}>75,000+ <RS /></b> عند التخرّج.</>
            : <>By saving + investing, turn 60,000 during your studies into <b style={{ color: c.accentText }}><Metric value="75,000+" /> <RS /></b> by graduation.</>}
        </div>
        <div style={{ height: 8, background: c.inputBg, borderRadius: 9, marginTop: 12 }}><div style={{ width: "42%", height: "100%", background: `linear-gradient(90deg, ${c.accent}, ${c.terra})`, borderRadius: 9 }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: c.muted, marginTop: 6 }}><span><Metric value={savings} /> <RS /> {s.now2}</span><span>{s.goal} <Metric value="75,000" /></span></div>
      </div>
      <div style={{ fontWeight: 700, margin: "16px 2px 8px" }}>{s.suggested}</div>
      {[300, 500, 1000].map((a) => (
        <div key={a} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: "14px 16px", marginBottom: 10 }}>
          <div><div style={{ fontWeight: 700 }}><Metric value={a} /> <RS /></div><div style={{ fontSize: 11.5, color: c.muted }}>{riyalText(s.inYear(fmt(a * 1.25)))}</div></div>
          <button onClick={() => put(a)} style={{ ...btn(c.accent, c.onAccent), width: "auto", padding: "0 20px", height: 40, marginTop: 0 }}>{s.investBtn}</button>
        </div>
      ))}
    </div>
  );
}

/* ===================== المزيد ===================== */
function MoreScreen() {
  const { c, s, lang, setLang, points, setPoints, theme, setTheme, setDemoPay, flash, setTab, logout, setOverlay } = useCtx();
  function redeem(it) { if (points < it.cost) return flash(s.noPoints); setPoints((p) => p - it.cost); flash(s.redeemed(it[lang])); }
  const rows = [
    { i: <Store size={18} color={c.accentText} />, t: s.plat.title, go: () => setOverlay("platform") },
    { i: <BookOpen size={18} color={c.accentText} />, t: s.learn, go: () => setTab("ai") },
    { i: <HelpCircle size={18} color={c.accentText} />, t: s.help, go: () => flash(s.helpSoon) },
    { i: <LogOut size={18} color={c.terraText} />, t: s.mk.lgOut, go: logout },
  ];
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <div>
      <ScreenHead title={s.more} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
        <div style={{ width: 54, height: 54, borderRadius: 999, background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, display: "grid", placeItems: "center", fontSize: 22, fontWeight: 700, color: "#fff" }}>{lang === "ar" ? "و" : "W"}</div>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 17 }}>{s.name}</div><div style={{ color: c.muted, fontSize: 12.5 }}>{s.handle}</div></div>
      </div>

      <div style={{ marginTop: 14, borderRadius: 22, padding: "18px 20px", background: `linear-gradient(135deg, ${c.accent}, ${c.accentText})`, color: c.onAccent, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 12.5, fontWeight: 600, opacity: .85 }}>{s.waeyPoints}</div><div style={{ fontSize: 28, fontWeight: 700 }}><Metric value={points} /></div></div>
        <Gift size={40} />
      </div>

      <div style={{ marginTop: 12, borderRadius: 22, padding: 16, background: c.card, border: `1px solid ${c.line}`, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg, ${c.terra}, ${c.terraText})`, display: "grid", placeItems: "center", flexShrink: 0 }}><Crown size={22} color="#fff" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{s.plus} · <span style={{ color: c.accentText }}>{riyalText(s.plusPrice)}</span></div>
          <div style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.5 }}>{s.plusSub}</div>
        </div>
        <button onClick={() => flash(s.plusDone)} style={{ ...btn(c.accent, c.onAccent), width: "auto", padding: "0 16px", height: 38, marginTop: 0, fontSize: 12.5, flexShrink: 0 }}>{s.upgrade}</button>
      </div>

      <SectionTitle icon={Sparkles}>{s.about}</SectionTitle>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.7 }}>{s.aboutMission}</div>
        <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.7, marginTop: 8 }}>{s.aboutStat}</div>
        <div style={{ borderTop: `1px solid ${c.line}`, marginTop: 12, paddingTop: 12, fontSize: 12, lineHeight: 1.7 }}><b>{s.revenue}:</b> <span style={{ color: c.muted }}>{riyalText(s.revenueText)}</span></div>
        <div style={{ fontSize: 12.5, color: c.accentText, fontWeight: 600, lineHeight: 1.7, marginTop: 10 }}>“{s.tagline}”</div>
        <div style={{ display: "inline-block", marginTop: 12, fontSize: 11.5, color: c.accentText, fontWeight: 700, background: c.card2, border: `1px solid ${c.line}`, borderRadius: 999, padding: "6px 13px" }}>{s.aboutPartner}</div>
      </div>

      <SectionTitle icon={Percent}>{s.offers}</SectionTitle>
      <div className="whz" style={{ display: "flex", gap: 12, overflowX: "auto", padding: "2px 0 6px" }}>
        {offersData.map((o) => (
          <div key={o.en} style={{ flexShrink: 0, width: 150, borderRadius: 18, padding: 14, background: c.card, border: `1px solid ${c.line}` }}>
            <IconBubble icon={o.icon} color={c.onAccent} bg={c[o.ck]} size={20} box={40} radius={12} />
            <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 10 }}>{o[lang]}</div>
            <div style={{ color: c[o.ck], fontWeight: 700, fontSize: 13 }}>{o.off[lang]}</div>
            <button onClick={() => flash(s.offerOn)} style={{ ...btn(c.card2, c.text), height: 34, marginTop: 10, fontSize: 12, border: `1px solid ${c.line}` }}>{s.getIt}</button>
          </div>
        ))}
      </div>

      <SectionTitle icon={Gift}>{s.pointsStore}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {storeData.map((it) => (
          <div key={it.en} style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: 14 }}>
            <IconBubble icon={it.icon} color={c.accentText} bg={c.card2} size={23} box={42} radius={12} />
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 6 }}>{riyalText(it[lang])}</div>
            <div style={{ fontSize: 11.5, color: c.muted, marginBottom: 8 }}>{fmt(it.cost)} {s.pts}</div>
            <button onClick={() => redeem(it)} disabled={points < it.cost} style={{ ...btn(points < it.cost ? c.card2 : c.accent, points < it.cost ? c.muted : c.onAccent), height: 36, marginTop: 0, fontSize: 12.5, border: points < it.cost ? `1px solid ${c.line}` : "none" }}>{s.redeem}</button>
          </div>
        ))}
      </div>

      <SectionTitle icon={Sun}>{s.settings}</SectionTitle>
      <button onClick={() => setDemoPay({ amount: [18, 25, 38, 45, 60][Math.floor(Math.random() * 5)], step: "choose", other: "" })} style={{ width: "100%", border: "none", borderRadius: 18, padding: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "start", background: `linear-gradient(120deg, ${c.terra}, ${c.terraText})`, color: c.onTerra, display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.2)", display: "grid", placeItems: "center" }}><FlaskConical size={21} color="#fff" /></div>
        <div><div style={{ fontWeight: 700 }}>{s.demoBtn}</div><div style={{ fontSize: 11.5, opacity: 0.92 }}>{s.demoSub}</div></div>
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{theme === "dark" ? <Moon size={18} color={c.accentText} /> : <Sun size={18} color={c.accentText} />}<span style={{ fontSize: 14 }}>{s.appearance} · {theme === "dark" ? s.dark : s.light}</span></div>
        <Toggle on={theme === "dark"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} label={s.appearance} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: "14px 16px", marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Globe size={18} color={c.accentText} /><span style={{ fontSize: 14 }}>{s.language}</span></div>
        <div style={{ display: "flex", background: c.card2, border: `1px solid ${c.line}`, borderRadius: 999, padding: 3 }}>
          {[["ar", "عربي"], ["en", "EN"]].map(([k, lbl]) => (
            <button key={k} onClick={() => setLang(k)} style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "6px 14px", borderRadius: 999, background: lang === k ? c.accent : "transparent", color: lang === k ? c.onAccent : c.muted }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 18, padding: "6px 4px", marginTop: 10 }}>
        {rows.map((x, i) => <button key={i} type="button" onClick={x.go} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", cursor: "pointer", border: "none", borderBottom: i < rows.length - 1 ? `1px solid ${c.line}` : "none", background: "transparent", color: c.text, fontFamily: "inherit", textAlign: "start" }}>{x.i}<span style={{ flex: 1, fontSize: 14 }}>{x.t}</span><Chevron size={16} color={c.muted} /></button>)}
      </div>
    </div>
  );
}

/* ===================== ورقة التصنيف التجريبية ===================== */
function DemoSheet() {
  const { c, s, lang, demoPay, setDemoPay, addSpend, setPoints, flash } = useCtx();
  const catsList = [{ k: "food", icon: Coffee }, { k: "transport", icon: Bus }, { k: "fun", icon: Gamepad2 }, { k: "other", icon: MoreHorizontal }];
  function pick(cat, label) { addSpend(cat, demoPay.amount, label); setPoints((p) => p + 5); setDemoPay(null); flash(s.categorized(demoPay.amount, label[lang])); }
  return (
    <Sheet title={s.paidNow(fmt(demoPay.amount))} subtitle={s.categorize} icon={Wallet} onClose={() => setDemoPay(null)}>
      {demoPay.step === "choose" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {catsList.map((x) => { const I = x.icon; return (
            <button key={x.k} onClick={() => x.k === "other" ? setDemoPay({ ...demoPay, step: "other" }) : pick(x.k, { ar: L.ar.cats[x.k], en: L.en.cats[x.k] })} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px", borderRadius: 16, border: `1px solid ${c.line}`, background: c.card, color: c.text, fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              <I size={20} color={c.accentText} /> {s.cats[x.k]}
            </button>
          ); })}
        </div>
      ) : (
        <div>
          <input autoFocus value={demoPay.other} onChange={(e) => setDemoPay({ ...demoPay, other: e.target.value })} placeholder={s.typeCat} style={inp(c)} />
          <button onClick={() => { const v = demoPay.other.trim() || L.en.cats.other; pick("other", { ar: v, en: v }); }} style={btn(c.accent, c.onAccent)}>{s.confirm}</button>
        </div>
      )}
    </Sheet>
  );
}

/* ===================== تحويل / إيداع ===================== */
function TransferSheet() {
  const { c, s, balance, setBalance, pushTx, setSheet, flash } = useCtx();
  const [to, setTo] = useState(s.people[0]);
  const [amt, setAmt] = useState("");
  function confirm() {
    const a = parseFloat(amt);
    if (!a || a <= 0) return flash(s.badAmount);
    if (a > balance) return flash(s.noBal);
    setBalance((b) => b - a); pushTx({ amt: a, place: { ar: `${L.ar.transfer} · ${to}`, en: `${L.en.transfer} · ${to}` }, cat: "transfer" });
    setSheet(null); flash(s.sent(a, to));
  }
  return (
    <Sheet title={s.transferT} icon={ArrowLeftRight} subtitle={s.yourBal(fmt(balance))}>
      <div className="whz" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "4px 0 8px" }}>
        {s.people.map((p) => (
          <button key={p} onClick={() => setTo(p)} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ width: 50, height: 50, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700, color: to === p ? c.onAccent : c.accentText, background: to === p ? c.accent : c.card, border: `2px solid ${to === p ? c.accent : c.line}` }}>{p[0]}</span>
            <span style={{ fontSize: 11, color: to === p ? c.text : c.muted }}>{p}</span>
          </button>
        ))}
      </div>
      <input value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))} placeholder={s.amount} inputMode="decimal" style={{ ...inp(c), textAlign: "center", fontSize: 22, fontWeight: 700, padding: "14px" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>{[50, 100, 200, 500].map((q) => <button key={q} onClick={() => setAmt(String(q))} style={chip(c)}>{q}</button>)}</div>
      <button onClick={confirm} style={btn(c.accent, c.onAccent)}>{s.sendNow}</button>
    </Sheet>
  );
}
function TopupSheet() {
  const { c, s, setBalance, pushTx, setSheet, flash } = useCtx();
  const [amt, setAmt] = useState("");
  function confirm() {
    const a = parseFloat(amt);
    if (!a || a <= 0) return flash(s.badAmount);
    setBalance((b) => b + a); pushTx({ amt: a, place: { ar: L.ar.deposit, en: L.en.deposit }, cat: "topup" });
    setSheet(null); flash(s.deposited(a));
  }
  return (
    <Sheet title={s.depositT} icon={ArrowDownToLine} subtitle={s.addFunds}>
      <input value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))} placeholder={s.amount} inputMode="decimal" style={{ ...inp(c), textAlign: "center", fontSize: 22, fontWeight: 700, padding: "14px" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>{[200, 500, 1000].map((q) => <button key={q} onClick={() => setAmt(String(q))} style={chip(c)}>{q}</button>)}</div>
      <button onClick={confirm} style={btn(c.accent, c.onAccent)}>{s.depositT}</button>
    </Sheet>
  );
}

/* ===================== عرض القرض ===================== */
function LoanModal() {
  const { c, s, lang, loanOffer, setLoanOffer, entries, setEntries, curWeek, tx, setTx, balance, setBalance, setLoanTaken, loanTaken, flash } = useCtx();
  const { need, offer, pending } = loanOffer;
  function accept() {
    const before = { entries, tx, balance, loanTaken };
    const after = applyAcceptedSpend(before, {
      decision: { kind: "loanOffer", need, offer },
      pending,
      entryMeta: { week: curWeek, date: { ar: s.today, en: L.en.today }, time: { ar: s.now, en: L.en.now }, location: { ar: s.yourLoc, en: L.en.yourLoc } },
    });
    if (after === before) return flash(s.noBal);
    setEntries(after.entries);
    setTx(after.tx);
    setBalance(after.balance);
    setLoanTaken(after.loanTaken);
    setLoanOffer(null);
    flash(s.loanDone(offer));
  }
  const drop = STIPEND - (loanTaken + offer);
  return (
    <div onClick={() => setLoanOffer(null)} style={{ position: "absolute", inset: 0, background: "rgba(15,34,48,0.36)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", padding: 22, zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: c.card2, border: `1px solid ${c.line}`, borderRadius: 26, padding: 24, width: "100%", maxWidth: 330, animation: "wPop .25s ease both", textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, margin: "0 auto", background: `linear-gradient(135deg, ${c.terra}, ${c.terraText})`, display: "grid", placeItems: "center" }}><Wallet size={24} color="#fff" /></div>
        <h3 style={{ margin: "14px 0 8px", fontSize: 18 }}>{s.loanTitle}</h3>
        <p style={{ color: c.muted, fontSize: 13.5, lineHeight: 1.8 }}>
          {lang === "ar"
            ? <>ينقصك <b style={{ color: c.terraText }}>{fmt(need)} <RS /></b>. أقدر أعطيك قرض <b style={{ color: c.text }}>{fmt(offer)} <RS /></b> من مكافأة الشهر الجاي — بتنزل <b style={{ color: c.text }}>{fmt(drop)} <RS /></b> بدل {fmt(STIPEND)}.</>
            : <>You're short <b style={{ color: c.terraText }}>{fmt(need)} <RS /></b>. I can lend <b style={{ color: c.text }}>{fmt(offer)} <RS /></b> from next month's stipend — it drops to <b style={{ color: c.text }}>{fmt(drop)} <RS /></b> instead of {fmt(STIPEND)}.</>}
        </p>
        <button onClick={accept} style={btn(c.terra, "#fff")}>{s.approve}</button>
        <button onClick={() => setLoanOffer(null)} style={{ ...btn("transparent", c.text), border: `1px solid ${c.line}`, marginTop: 8 }}>{s.noAdjust}</button>
      </div>
    </div>
  );
}

/* ===================== التبويبات ===================== */
function Sidebar() {
  const { c, s, tab, setTab, lang, setLang, theme, setTheme, points, setOverlay } = useCtx();
  const items = [
    { id: "home", label: s.nav.home, icon: Home }, { id: "analytics", label: s.nav.analytics, icon: BarChart3 },
    { id: "ai", label: s.nav.ai, icon: Sparkles }, { id: "invest", label: s.nav.invest, icon: TrendingUp },
    { id: "more", label: s.nav.more, icon: LayoutGrid },
  ];
  return (
    <div style={{ width: 236, flexShrink: 0, height: "100dvh", background: c.card, borderInlineEnd: `1px solid ${c.line}`, display: "flex", flexDirection: "column", padding: "22px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 26 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg, ${c.accent}, ${c.terra})`, display: "grid", placeItems: "center" }}><Sparkles size={19} color="#fff" /></div>
        <span style={{ fontWeight: 800, fontSize: 19 }}>{s.brand}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map((x) => {
          const on = tab === x.id, Icon = x.icon;
          return (
            <motion.button key={x.id} onClick={() => setTab(x.id)} whileTap={{ scale: 0.98 }} style={{ position: "relative", display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14.5, fontWeight: on ? 700 : 500, background: "transparent", color: on ? c.onAccent : c.textSoft, textAlign: "start" }}>
              {on && <motion.span layoutId="waey-sidebar-pill" transition={{ type: "spring", duration: 0.42, bounce: 0.16 }} style={{ position: "absolute", inset: 0, borderRadius: 14, background: c.accent, zIndex: 0 }} />}
              <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 13 }}><Icon size={20} />{x.label}</span>
            </motion.button>
          );
        })}
      </div>
      <div style={{ marginTop: 18, borderTop: `1px solid ${c.line}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 5 }}>
        <button onClick={() => setOverlay("platform")} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 500, background: "transparent", color: c.textSoft, textAlign: "start" }}><Store size={19} />{s.plat.title}</button>
      </div>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 14, background: c.card2 }}>
          <Coins size={17} color={c.accentText} /><span style={{ fontSize: 13, fontWeight: 700 }}><Metric value={points} /></span><span style={{ fontSize: 11, color: c.muted }}>{lang === "ar" ? "نقطة" : "pts"}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{ flex: 1, height: 38, borderRadius: 12, background: c.card2, border: `1px solid ${c.line}`, color: c.text, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>{lang === "ar" ? "EN" : "ع"}</button>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ flex: 1, height: 38, borderRadius: 12, background: c.card2, border: `1px solid ${c.line}`, color: c.text, cursor: "pointer", display: "grid", placeItems: "center" }}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
        </div>
      </div>
    </div>
  );
}
function BottomNav() {
  const { c, s, tab, setTab } = useCtx();
  const items = [
    { id: "home", label: s.nav.home, icon: Home }, { id: "analytics", label: s.nav.analytics, icon: BarChart3 },
    { id: "ai", label: s.nav.ai, icon: Sparkles, center: true }, { id: "invest", label: s.nav.invest, icon: TrendingUp },
    { id: "more", label: s.nav.more, icon: LayoutGrid },
  ];
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", background: `linear-gradient(180deg, transparent 0%, ${c.bg0} 55%)`, padding: "0 0 env(safe-area-inset-bottom,0px)" }}>
      <div style={{ width: "100%", maxWidth: 600, minHeight: 84, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 14px 14px" }}>
      {items.map((x) => {
        const on = tab === x.id, Icon = x.icon;
        if (x.center) return <motion.button key={x.id} onClick={() => setTab(x.id)} whileTap={{ scale: 0.92 }} style={{ width: 58, height: 58, borderRadius: 20, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${c.accent}, ${c.accentText})`, display: "grid", placeItems: "center", y: -12, boxShadow: `0 12px 26px -6px ${c.accent}` }}><Icon size={26} color={c.onAccent} /></motion.button>;
        return <motion.button key={x.id} onClick={() => setTab(x.id)} whileTap={{ scale: 0.9 }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: on ? c.accentText : c.muted, flex: 1, position: "relative" }}><Icon size={22} /><span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500 }}>{x.label}</span>{on && <motion.span layoutId="waey-bottomnav-dot" transition={{ type: "spring", duration: 0.42, bounce: 0.16 }} style={{ position: "absolute", top: -6, width: 5, height: 5, borderRadius: 999, background: c.accentText }} />}</motion.button>;
      })}
      </div>
    </div>
  );
}

/* ===================== عناصر مشتركة ===================== */
function Sheet({ title, subtitle, icon: Icon, children, onClose }) {
  const { c, setSheet } = useCtx();
  const close = onClose || (() => setSheet(null));
  return (
    <motion.div onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: easeOut }} style={{ position: "absolute", inset: 0, background: "rgba(15,34,48,0.32)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", zIndex: 50 }}>
      <motion.div onClick={(e) => e.stopPropagation()} variants={sheetVariants} initial="hidden" animate="visible" transition={{ duration: 0.3, ease: easeOut }} style={{ width: "100%", background: c.card2, borderRadius: "26px 26px 0 0", padding: "20px 20px calc(24px + env(safe-area-inset-bottom,0px))", border: `1px solid ${c.line}` }}>
        <div style={{ width: 40, height: 4, borderRadius: 9, background: c.line, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          {Icon && <div style={{ width: 44, height: 44, borderRadius: 13, background: c.accent, display: "grid", placeItems: "center" }}><Icon size={22} color={c.onAccent} /></div>}
          <div><div style={{ fontWeight: 700, fontSize: 16 }}>{riyalText(title)}</div>{subtitle && <div style={{ fontSize: 12, color: c.muted }}>{riyalText(subtitle)}</div>}</div>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
function Bubble({ role, text, widget }) {
  const { c, dir } = useCtx(); const me = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: me ? (dir === "rtl" ? -10 : 10) : (dir === "rtl" ? 10 : -10), scale: 0.98 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: easeOut }}
      style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "86%", background: me ? c.accent : c.card, color: me ? c.onAccent : c.textSoft, padding: "11px 14px", borderRadius: 18, borderEndStartRadius: me ? 18 : 5, borderEndEndRadius: me ? 5 : 18, fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap", border: me ? "none" : `1px solid ${c.line}` }}
    >
      {riyalText(text)}{widget && <ChatWidget w={widget} />}
    </motion.div>
  );
}
function InvestWidget({ w }) {
  const { c, s } = useCtx(); const colors = [c.green, c.accentText, c.terra, c.accent];
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ background: c.card2, borderRadius: 14, padding: "10px 8px 4px", border: `1px solid ${c.line}` }}><Spark data={w.chart} /><div style={{ textAlign: "center", fontSize: 11, color: c.muted, marginTop: 2 }}>{s.portfolioGrowth}</div></div>
      <div style={{ marginTop: 10 }}>
        {w.types.map((t, i) => (
          <div key={t.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < w.types.length - 1 ? `1px solid ${c.line}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 9, background: colors[i % 4] }} /><div><div style={{ fontSize: 13, fontWeight: 600 }}>{t.name} · <Metric value={`${Math.round(t.r * 100)}%`} /></div><div style={{ fontSize: 10.5, color: c.muted }}>{t.risk}</div></div></div>
            <div style={{ textAlign: "end" }}><div style={{ fontSize: 13, fontWeight: 700 }}><Metric value={t.fv} /> <RS /></div><div style={{ fontSize: 10.5, color: c.green }}>+<Metric value={t.profit} /></div></div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.7 }}><b>{s.howSaveMore}</b>{w.tips.map((t, i) => <div key={i} style={{ color: c.muted }}>• {riyalText(t)}</div>)}</div>
      <div style={{ fontSize: 10.5, color: c.muted, marginTop: 8, opacity: 0.85 }}>{s.disclaimer}</div>
    </div>
  );
}
function ChatWidget({ w }) {
  if (w.kind === "invest") return <InvestWidget w={w} />;
  if (w.kind === "breakdown") return <BreakdownWidget />;
  if (w.kind === "projection") return <ProjectionWidget init={w.period} />;
  if (w.kind === "loan") return <LoanWidget w={w} />;
  return null;
}
function LoanWidget({ w }) {
  const { c, s, lang, setLoanTaken, loanTaken, flash } = useCtx();
  const [done, setDone] = useState(false);
  const drop = STIPEND - (loanTaken + w.offer);
  function approve() { if (done) return; setLoanTaken((l) => l + w.offer); setDone(true); flash(s.loanDone(w.offer)); }
  return (
    <div style={{ marginTop: 12, background: c.card2, border: `1px solid ${c.line}`, borderRadius: 16, padding: 14 }}>
      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
        {lang === "ar"
          ? <>ينقصك <b style={{ color: c.terraText }}><Metric value={w.gap} /> <RS /></b>. أقدر أعطيك قرض <b><Metric value={w.offer} /> <RS /></b> من راتب الشهر الجاي — بينزل راتبك القادم إلى <b><Metric value={drop} /> <RS /></b> بدل {fmt(STIPEND)}.</>
          : <>You're short <b style={{ color: c.terraText }}><Metric value={w.gap} /> <RS /></b>. I can lend you <b><Metric value={w.offer} /> <RS /></b> from next month's salary — your next stipend becomes <b><Metric value={drop} /> <RS /></b> instead of {fmt(STIPEND)}.</>}
      </div>
      <button onClick={approve} disabled={done} style={{ ...btn(done ? c.green : c.terra, "#fff"), height: 42, marginTop: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>{done && <Check size={16} aria-hidden="true" />}{done ? (lang === "ar" ? "تم اعتماد القرض" : "Loan approved") : s.approve}</button>
    </div>
  );
}
function BreakdownWidget() {
  const { c, s, cats } = useCtx();
  const list = [{ k: "food", col: c.terra }, { k: "transport", col: c.accent }, { k: "fun", col: c.accentText }, { k: "other", col: c.green }];
  const max = Math.max(...list.map((x) => cats[x.k]), 1);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{s.breakdownTitle}</div>
      {list.map((x) => (
        <div key={x.k} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span>{s.cats[x.k]}</span><span style={{ color: c.muted }}><Metric value={cats[x.k]} /> <RS /></span></div>
          <div style={{ height: 7, background: c.inputBg, borderRadius: 9 }}><div style={{ width: `${(cats[x.k] / max) * 100}%`, height: "100%", background: x.col, borderRadius: 9, transition: "width .4s" }} /></div>
        </div>
      ))}
    </div>
  );
}
function ProjectionWidget({ init }) {
  const { c, s } = useCtx();
  const [p, setP] = useState(init || "month");
  const map = {
    week: { series: weeklySeries(50, 8), sugg: s.projW },
    month: { series: fvSeries(200, 0.10, 12), sugg: s.projM },
    year: { series: fvSeries(2400, 0.10, 4), sugg: s.projY },
  };
  const cur = map[p]; const total = cur.series[cur.series.length - 1];
  const opts = [["week", s.periodW], ["month", s.periodM], ["year", s.periodY]];
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{s.projTitle}</div>
      <div style={{ display: "flex", background: c.card2, border: `1px solid ${c.line}`, borderRadius: 12, padding: 3, marginBottom: 8 }}>
        {opts.map(([k, lbl]) => <button key={k} onClick={() => setP(k)} style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: p === k ? c.accent : "transparent", color: p === k ? c.onAccent : c.muted }}>{lbl}</button>)}
      </div>
      <div style={{ background: c.card2, borderRadius: 14, padding: "10px 10px 6px", border: `1px solid ${c.line}` }}>
        <Spark data={cur.series} />
        <div style={{ textAlign: "center", fontSize: 19, fontWeight: 800, marginTop: 2 }}><Metric value={total} /> <RS /></div>
      </div>
      <div style={{ fontSize: 12, color: c.textSoft, lineHeight: 1.7, marginTop: 8, display: "flex", gap: 8, alignItems: "flex-start" }}><InlineIcon icon={Lightbulb} color={c.accentText} size={15} /><span>{riyalText(cur.sugg(total))}</span></div>
    </div>
  );
}
function StatusBar() { const { c } = useCtx(); return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 26px 4px", fontSize: 14, fontWeight: 600, flexShrink: 0, color: c.statusText, direction: "ltr" }}><span>9:41</span><div style={{ display: "flex", gap: 6, alignItems: "center" }}><Signal col={c.statusText} /><Wifi col={c.statusText} /><Battery col={c.statusText} /></div></div>; }
function ScreenHead({ title }) { return <div style={{ fontSize: 24, fontWeight: 700, padding: "8px 2px 2px" }}>{title}</div>; }
function SectionTitle({ icon: Icon, children }) { const { c } = useCtx(); return <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, margin: "18px 2px 10px" }}><Icon size={17} color={c.accentText} />{children}</div>; }
function Stat({ icon, value, label }) { const { c } = useCtx(); return <div style={{ textAlign: "center" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>{icon}<span style={{ fontSize: 18, fontWeight: 700 }}><Metric value={value} /></span></div><div style={{ fontSize: 10.5, color: c.muted, marginTop: 2 }}>{label}</div></div>; }
function MiniBox({ label, value, tone }) { const { c } = useCtx(); return <div style={{ flex: 1, background: c.card2, border: `1px solid ${c.line}`, borderRadius: 14, padding: "10px 12px" }}><div style={{ fontSize: 11, color: c.muted }}>{label}</div><div style={{ fontSize: 16, fontWeight: 700, color: tone }}>{riyalText(value)}</div></div>; }
function Divider() { const { c } = useCtx(); return <div style={{ width: 1, height: 32, background: c.line }} />; }
function Toggle({ on, onClick, label }) { const { c } = useCtx(); return <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} style={{ width: 52, height: 30, borderRadius: 999, background: on ? c.accent : c.line, position: "relative", cursor: "pointer", transition: "background .25s", border: "none", padding: 0, flexShrink: 0 }}><span aria-hidden="true" style={{ position: "absolute", top: 3, insetInlineEnd: on ? 3 : 25, width: 24, height: 24, borderRadius: 999, background: "#fff", transition: "inset-inline-end .25s" }} /></button>; }
function IconBtn({ children, dot, onClick }) { const { c } = useCtx(); return <button onClick={onClick} style={{ position: "relative", width: 38, height: 38, borderRadius: 12, background: c.card, border: `1px solid ${c.line}`, color: c.text, display: "grid", placeItems: "center", cursor: "pointer" }}>{children}{dot && <span style={{ position: "absolute", top: 9, insetInlineEnd: 10, width: 7, height: 7, borderRadius: 9, background: c.terra, border: `1.5px solid ${c.card}` }} />}</button>; }
function MetricCard({ label, value, tone, sign }) { const { c } = useCtx(); return <div style={{ flex: 1, background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: 15 }}><div style={{ fontSize: 12, color: c.muted }}>{label}</div><div style={{ fontSize: 21, fontWeight: 700, marginTop: 2 }}><Metric value={value} /> <RS color={c.muted} /></div><div style={{ fontSize: 11.5, color: tone, fontWeight: 600, marginTop: 1 }}>{sign}</div></div>; }
function Seg({ options, value, onChange }) { const { c } = useCtx(); return <div style={{ display: "flex", background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: 4, marginTop: 12 }}>{options.map((o) => <button key={o} onClick={() => onChange(o)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: value === o ? c.accent : "transparent", color: value === o ? c.onAccent : c.muted }}>{o}</button>)}</div>; }
function Spark({ data }) {
  const { c } = useCtx(); const w = 300, h = 70, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / (max - min || 1)) * (h - 10) - 5]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const id = "wg" + Math.round(min) + Math.round(max);
  return <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 70, marginTop: 8 }} preserveAspectRatio="none"><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.accent} stopOpacity="0.35" /><stop offset="100%" stopColor={c.accent} stopOpacity="0" /></linearGradient></defs><path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${id})`} /><motion.path d={d} fill="none" stroke={c.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.9, ease: easeOut }} /></svg>;
}
function Signal({ col }) { return <svg width="18" height="12" viewBox="0 0 18 12"><g fill={col}>{[0, 1, 2, 3].map((i) => <rect key={i} x={i * 4.5} y={9 - i * 2.7} width="3" height={3 + i * 2.7} rx="1" />)}</g></svg>; }
function Wifi({ col }) { return <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke={col} strokeWidth="1.6"><path d="M1 4.2C4-.4 13-.4 16 4.2M3.4 6.7c2.4-3 7.8-3 10.2 0M5.9 9.2c1-1.3 4.2-1.3 5.2 0" /><circle cx="8.5" cy="10.8" r="1" fill={col} stroke="none" /></svg>; }
function Battery({ col }) { return <svg width="26" height="13" viewBox="0 0 26 13"><rect x="1" y="1" width="22" height="11" rx="3" fill="none" stroke={col} strokeOpacity="0.5" /><rect x="3" y="3" width="16" height="7" rx="1.5" fill={col} /><rect x="24" y="4" width="2" height="5" rx="1" fill={col} /></svg>; }
function inp(c) { return { flex: 1, background: c.inputBg, border: `1px solid ${c.line}`, borderRadius: 13, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", color: c.text, outline: "none", minWidth: 0, width: "100%" }; }
function btn(bg, color) { return { marginTop: 12, width: "100%", height: 46, background: bg, color, border: "none", borderRadius: 13, fontSize: 14.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }; }
function chip(c) { return { background: c.card, border: `1px solid ${c.line}`, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "inherit", color: c.textSoft, cursor: "pointer", flex: 1 }; }
