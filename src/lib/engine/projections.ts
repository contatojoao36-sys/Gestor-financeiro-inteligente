import type { AppState } from "../types";
import { addMonthsISO, todayISO } from "../format";
import { getBalance, getNetWorth, trailingAverage } from "./selectors";

export interface ProjectionPoint {
  label: string;
  months: number;
  date: string;
  balance: number;
  netWorth: number;
}

const HORIZONS: { label: string; months: number }[] = [
  { label: "Hoje", months: 0 },
  { label: "30 dias", months: 1 },
  { label: "3 meses", months: 3 },
  { label: "6 meses", months: 6 },
  { label: "1 ano", months: 12 },
  { label: "2 anos", months: 24 },
  { label: "5 anos", months: 60 },
];

/**
 * Projeção linear simples baseada no fluxo de caixa médio recente (renda - despesas - dívidas)
 * e no ritmo de amortização de dívidas. É uma estimativa, não uma garantia — deixamos isso claro na UI.
 */
export function buildProjection(state: AppState): ProjectionPoint[] {
  const avgIncome = trailingAverage(state, 3, (t) => t.income) || state.settings.monthlyIncomeExpected;
  const avgExpense = trailingAverage(state, 3, (t) => t.expense);
  const avgInvested = trailingAverage(state, 3, (t) => t.invested);
  const avgSaved = trailingAverage(state, 3, (t) => t.saved);
  const avgDebtPayment = trailingAverage(state, 3, (t) => t.debtPaid);

  const netMonthlyCashflow = avgIncome - avgExpense - avgSaved - avgInvested - avgDebtPayment;
  const netWorthMonthlyGrowth = avgIncome - avgExpense; // patrimônio cresce com tudo que não é gasto

  const balance0 = getBalance(state);
  const netWorth0 = getNetWorth(state);
  const today = todayISO();

  return HORIZONS.map((h) => ({
    label: h.label,
    months: h.months,
    date: addMonthsISO(today, h.months),
    balance: balance0 + netMonthlyCashflow * h.months,
    // Investimentos, transferências e pagamentos de dívida apenas movem dinheiro entre
    // caixa e patrimônio/passivo — só renda e despesa alteram o patrimônio líquido total.
    netWorth: netWorth0 + netWorthMonthlyGrowth * h.months,
  }));
}
