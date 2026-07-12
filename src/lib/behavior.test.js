import { describe, expect, it } from "vitest";
import {
  KLONTZ_QUESTIONS,
  COMB_QUESTIONS,
  CHOICES,
  scoreDimensions,
  dominantType,
  weakestGap,
  financialFitness,
  nextFitness,
  budgetFor,
  levelFor,
  analyze,
  PLANS,
} from "./behavior.js";

// Build an answer map from a per-dimension value picker.
function answersFrom(pick) {
  const a = {};
  for (const q of KLONTZ_QUESTIONS.concat(COMB_QUESTIONS)) a[q.id] = pick(q);
  return a;
}

describe("assessment content", () => {
  it("has the 10 Klontz and 6 COM-B items on the documented dimensions", () => {
    expect(KLONTZ_QUESTIONS).toHaveLength(10);
    expect(COMB_QUESTIONS).toHaveLength(6);
    const kDims = new Set(KLONTZ_QUESTIONS.map((q) => q.dim));
    expect([...kDims].sort()).toEqual(["avoidance", "status", "vigilance", "worship"]);
    const cDims = new Set(COMB_QUESTIONS.map((q) => q.dim));
    expect([...cDims].sort()).toEqual(["capability", "motivation", "opportunity"]);
    // Every item is bilingual.
    for (const q of KLONTZ_QUESTIONS.concat(COMB_QUESTIONS)) {
      expect(q.ar.length).toBeGreaterThan(0);
      expect(q.en.length).toBeGreaterThan(0);
    }
  });

  it("uses a five-point agree scale", () => {
    expect(CHOICES.map((c) => c.v)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("scoring", () => {
  it("averages each dimension and defaults missing answers to neutral", () => {
    const k = scoreDimensions({ k1: 5, k2: 5 }, KLONTZ_QUESTIONS); // rest default to 3
    expect(k.avoidance).toBe(5); // (5+5)/2
    expect(k.vigilance).toBe(3); // both missing → neutral
  });

  it("dominantType picks the highest Klontz dimension", () => {
    const k = scoreDimensions(answersFrom((q) => (q.dim === "worship" ? 5 : 2)), KLONTZ_QUESTIONS);
    expect(dominantType(k)).toBe("worship");
  });

  it("weakestGap picks the lowest COM-B dimension", () => {
    const c = scoreDimensions(answersFrom((q) => (q.dim === "opportunity" ? 1 : 4)), COMB_QUESTIONS);
    expect(weakestGap(c)).toBe("opportunity");
  });
});

describe("financial fitness", () => {
  const neutral = { avoidance: 3, status: 3, worship: 3, vigilance: 3 };
  const neutralC = { capability: 3, opportunity: 3, motivation: 3 };

  it("maps all-neutral answers to 50", () => {
    expect(financialFitness(neutral, neutralC)).toBe(50);
  });

  it("rewards vigilance + readiness and punishes avoidance/status/worship", () => {
    const healthy = financialFitness({ avoidance: 1, status: 1, worship: 1, vigilance: 5 }, { capability: 5, opportunity: 5, motivation: 5 });
    const unhealthy = financialFitness({ avoidance: 5, status: 5, worship: 5, vigilance: 1 }, { capability: 1, opportunity: 1, motivation: 1 });
    expect(healthy).toBe(100);
    expect(unhealthy).toBe(0);
    expect(healthy).toBeGreaterThan(financialFitness(neutral, neutralC));
  });

  it("always returns an integer within 0..100", () => {
    for (let i = 0; i < 20; i++) {
      const rand = () => 1 + (i % 5);
      const f = financialFitness(
        { avoidance: rand(), status: rand(), worship: rand(), vigilance: rand() },
        { capability: rand(), opportunity: rand(), motivation: rand() },
      );
      expect(Number.isInteger(f)).toBe(true);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(100);
    }
  });
});

describe("budget", () => {
  it("sums to 100% for every type", () => {
    for (const t of ["avoidance", "status", "worship", "vigilance"]) {
      expect(budgetFor(t).reduce((a, b) => a + b.pct, 0)).toBe(100);
    }
  });
  it("nudges a vigilant planner toward more savings", () => {
    const v = budgetFor("vigilance").find((b) => b.key === "savings").pct;
    const base = budgetFor("avoidance").find((b) => b.key === "savings").pct;
    expect(v).toBeGreaterThan(base);
  });
});

describe("daily fitness nudge", () => {
  it("lifts on a committed day and dips on a missed day, staying in 0..100", () => {
    expect(nextFitness(50, true)).toBe(52);
    expect(nextFitness(50, false)).toBe(49);
    expect(nextFitness(100, true)).toBe(100);
    expect(nextFitness(0, false)).toBe(0);
  });
});

describe("levels", () => {
  it("gates Bronze→Elite on fitness thresholds", () => {
    expect(levelFor(0).key).toBe("bronze");
    expect(levelFor(39).key).toBe("bronze");
    expect(levelFor(40).key).toBe("silver");
    expect(levelFor(70).key).toBe("gold");
    expect(levelFor(95).key).toBe("elite");
  });
});

describe("analyze", () => {
  it("produces a complete journey profile", () => {
    const answers = answersFrom((q) => (q.dim === "worship" ? 5 : q.dim === "opportunity" ? 1 : 3));
    const r = analyze(answers, 1500);
    expect(r.type).toBe("worship");
    expect(r.gap).toBe("opportunity");
    expect(r.plan).toBe(PLANS.opportunity);
    expect(r.totalQ).toBe(16);
    expect(r.answeredCount).toBe(16);
    // monthlyGoal = income × savings% (worship keeps the 25% base)
    expect(r.monthlyGoal).toBe(Math.round(1500 * 0.25));
    expect(r.dailyTarget).toBe(Math.max(1, Math.round(r.monthlyGoal / 30)));
    expect(r.analysis.type.en).toBe("Impulsive Spender");
    expect(r.budget.reduce((a, b) => a + b.pct, 0)).toBe(100);
  });

  it("counts only answered questions", () => {
    const r = analyze({ k1: 4, c1: 2 }, 1000);
    expect(r.answeredCount).toBe(2);
    expect(r.totalQ).toBe(16);
  });
});
