const DEFAULT_MAX_LOAN = 250;

export function evaluateSpend({ amount, available, maxLoan = DEFAULT_MAX_LOAN }) {
  const spendAmount = Number(amount);
  const availableAmount = Number(available);
  const loanLimit = Number(maxLoan);

  if (!Number.isFinite(spendAmount) || spendAmount <= 0) {
    return { kind: "invalid" };
  }

  if (spendAmount <= availableAmount) {
    return { kind: "spend", amount: spendAmount };
  }

  const need = roundMoney(spendAmount - availableAmount);
  if (need > loanLimit) {
    return { kind: "blocked", need, maxLoan: loanLimit };
  }

  return {
    kind: "loanOffer",
    need,
    offer: Math.min(loanLimit, Math.ceil(need / 50) * 50),
  };
}

export function applyAcceptedSpend(state, { decision, pending, entryMeta = {}, id = Date.now() }) {
  if (!state || !pending || decision?.kind !== "loanOffer") return state;
  const amount = Number(pending.amount);
  const offer = Number(decision.offer);
  const need = Number(decision.need);

  if (!Number.isFinite(amount) || !Number.isFinite(offer) || offer < need) return state;
  if (Number(state.balance) + offer < amount) return state;

  const entry = {
    id,
    week: entryMeta.week,
    cat: pending.cat || "other",
    amt: amount,
    place: pending.place,
    date: entryMeta.date,
    time: entryMeta.time,
    location: entryMeta.location,
  };
  const tx = { amt: amount, place: pending.place, cat: pending.cat || "other" };

  return {
    ...state,
    entries: [...state.entries, entry],
    tx: [tx, ...state.tx].slice(0, 8),
    balance: roundMoney(Number(state.balance) + offer - amount),
    loanTaken: roundMoney(Number(state.loanTaken) + offer),
  };
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}
