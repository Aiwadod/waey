import { describe, expect, it } from "vitest";
import {
  applyAcceptedSpend,
  evaluateSpend,
} from "./finance.js";

const pending = {
  amount: 950,
  cat: "food",
  place: { ar: "Cafe", en: "Cafe" },
};

describe("loan-backed spending", () => {
  it("spends directly when available balance covers the amount", () => {
    expect(evaluateSpend({ amount: 100, available: 120 })).toEqual({
      kind: "spend",
      amount: 100,
    });
  });

  it("offers a loan only when the loan can fully cover the shortfall", () => {
    expect(evaluateSpend({ amount: 950, available: 800, maxLoan: 250 })).toEqual({
      kind: "loanOffer",
      need: 150,
      offer: 150,
    });
  });

  it("blocks the transaction when the maximum loan cannot cover the shortfall", () => {
    expect(evaluateSpend({ amount: 1100, available: 800, maxLoan: 250 })).toEqual({
      kind: "blocked",
      need: 300,
      maxLoan: 250,
    });
  });

  it("applies accepted loan funds and pending spend atomically", () => {
    const before = {
      entries: [],
      tx: [],
      balance: 800,
      loanTaken: 0,
    };

    const after = applyAcceptedSpend(before, {
      decision: { kind: "loanOffer", need: 150, offer: 150 },
      pending,
      entryMeta: { week: 2, date: { ar: "today", en: "today" }, time: { ar: "now", en: "now" }, location: { ar: "here", en: "here" } },
      id: 123,
    });

    expect(after.loanTaken).toBe(150);
    expect(after.balance).toBe(0);
    expect(after.entries).toHaveLength(1);
    expect(after.tx).toEqual([{ amt: 950, place: pending.place, cat: "food" }]);
  });

  it("leaves state unchanged when accepting an insufficient loan decision", () => {
    const before = { entries: [], tx: [], balance: 800, loanTaken: 0 };

    expect(
      applyAcceptedSpend(before, {
        decision: { kind: "loanOffer", need: 300, offer: 250 },
        pending: { ...pending, amount: 1100 },
      }),
    ).toBe(before);
  });
});
