import type { AppState, FinancialSnapshot } from "../types";
import { monthKey, nowISO, todayISO } from "../format";
import { EXPENSE_CATEGORIES } from "../categories";
import {
  monthTotals,
  categorySpend,
  getBalanceAsOf,
  getNetWorthAsOf,
  getAllActivityMonths,
} from "./selectors";

function lastDayOfMonth(monthIso: string): string {
  const [year, month] = monthIso.split("-").map(Number);
  const date = new Date(year, month, 0); // dia 0 do próximo mês = último dia deste mês
  return date.toISOString().slice(0, 10);
}

/** Calcula o "extrato" fechado de um mês a partir das transações registradas. */
export function computeMonthClose(state: AppState, monthIso: string): FinancialSnapshot {
  const totals = monthTotals(state, `${monthIso}-01`);
  const endOfMonth = lastDayOfMonth(monthIso);

  const categorySpendMap: FinancialSnapshot["categorySpend"] = {};
  for (const cat of EXPENSE_CATEGORIES) {
    const value = categorySpend(state, cat, `${monthIso}-01`);
    if (value > 0) categorySpendMap[cat] = value;
  }

  return {
    month: monthIso,
    closedAt: nowISO(),
    income: totals.income,
    expense: totals.expense,
    saved: totals.saved,
    invested: totals.invested,
    debtPaid: totals.debtPaid,
    net: totals.net,
    balanceEnd: getBalanceAsOf(state, endOfMonth),
    netWorthEnd: getNetWorthAsOf(state, endOfMonth),
    categorySpend: categorySpendMap,
  };
}

/**
 * Meses que já terminaram (antes do mês atual), têm alguma transação e ainda não foram
 * fechados. O mês corrente nunca é fechado automaticamente — ele só vira histórico quando termina.
 */
export function getMonthsPendingClose(state: AppState): string[] {
  const currentMonth = monthKey(todayISO());
  const closedMonths = new Set(state.snapshots.map((s) => s.month));
  return getAllActivityMonths(state).filter((m) => m < currentMonth && !closedMonths.has(m));
}
