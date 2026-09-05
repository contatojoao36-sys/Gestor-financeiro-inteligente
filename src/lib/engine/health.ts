import type { AppState } from "../types";
import { addMonthsISO, todayISO } from "../format";
import {
  getMonthlySavingsCapacity,
  getTotalDebtRemaining,
  monthTotals,
  trailingAverage,
  getActiveGoals,
  getGoalCurrentAmount,
} from "./selectors";
import { analyzeGoal } from "./goals";

export interface HealthBreakdown {
  score: number;
  savingsRateScore: number;
  budgetControlScore: number;
  debtScore: number;
  reserveScore: number;
  consistencyScore: number;
  strengths: string[];
  weaknesses: string[];
}

export function computeHealthScore(state: AppState): HealthBreakdown {
  const avgIncome = trailingAverage(state, 3, (t) => t.income) || state.settings.monthlyIncomeExpected;
  const capacity = getMonthlySavingsCapacity(state);
  const savingsRate = avgIncome > 0 ? capacity / avgIncome : 0;
  const savingsRateScore = Math.min(savingsRate / 0.2, 1) * 25; // 20% de poupança = nota máxima

  const budgetsWithLimit = state.budgets.filter((b) => b.monthlyLimit > 0);
  let budgetControlScore = 20;
  if (budgetsWithLimit.length > 0) {
    const usageRatios = budgetsWithLimit.map((b) => {
      const spent = state.transactions
        .filter((t) => t.type === "expense" && t.category === b.category && t.date.slice(0, 7) === todayISO().slice(0, 7))
        .reduce((s, t) => s + t.amount, 0);
      return b.monthlyLimit > 0 ? spent / b.monthlyLimit : 0;
    });
    const avgUsage = usageRatios.reduce((s, v) => s + v, 0) / usageRatios.length;
    budgetControlScore = Math.max(0, 20 - Math.max(avgUsage - 0.8, 0) * 40);
  }

  const annualIncome = avgIncome * 12;
  const debtRemaining = getTotalDebtRemaining(state);
  const debtRatio = annualIncome > 0 ? debtRemaining / annualIncome : 0;
  const debtScore = Math.max(20 - debtRatio * 40, 0);

  const essentials = ["moradia", "alimentacao", "transporte", "saude", "educacao"] as const;
  const essentialMonthly = state.budgets
    .filter((b) => essentials.includes(b.category as (typeof essentials)[number]))
    .reduce((s, b) => s + b.monthlyLimit, 0);
  const reserveGoal = state.goals.find((g) => g.kind === "reserve");
  const idealReserve = essentialMonthly * 3;
  const reserveScore = idealReserve > 0 && reserveGoal
    ? Math.min(getGoalCurrentAmount(state, reserveGoal) / idealReserve, 1) * 20
    : reserveGoal
      ? 10
      : 0;

  let monthsWithContribution = 0;
  for (let i = 0; i < 3; i++) {
    const iso = addMonthsISO(todayISO(), -i);
    const totals = monthTotals(state, iso);
    if (totals.saved > 0 || totals.invested > 0) monthsWithContribution++;
  }
  const consistencyScore = (monthsWithContribution / 3) * 15;

  const score = Math.round(savingsRateScore + budgetControlScore + debtScore + reserveScore + consistencyScore);

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (savingsRateScore >= 18) strengths.push("Boa taxa de poupança sobre a renda.");
  else weaknesses.push("Taxa de poupança baixa em relação à renda.");

  if (budgetControlScore >= 15) strengths.push("Orçamento sob controle na maioria das categorias.");
  else weaknesses.push("Vários orçamentos estão sendo ultrapassados.");

  if (debtScore >= 15) strengths.push("Endividamento em nível saudável.");
  else if (debtRemaining > 0) weaknesses.push("Dívidas representam uma parcela relevante da sua renda anual.");

  if (reserveScore >= 15) strengths.push("Reserva de emergência bem estruturada.");
  else weaknesses.push("Reserva de emergência ainda incompleta.");

  const activeGoals = getActiveGoals(state);
  const lateGoals = activeGoals.filter((g) => analyzeGoal(state, g).status === "late");
  if (lateGoals.length > 0) weaknesses.push(`${lateGoals.length} meta(s) estão atrasadas em relação ao prazo.`);
  else if (activeGoals.length > 0) strengths.push("Suas metas estão dentro do ritmo planejado.");

  if (consistencyScore >= 10) strengths.push("Consistência de aportes nos últimos meses.");
  else weaknesses.push("Aportes irregulares nos últimos meses.");

  return {
    score: Math.max(0, Math.min(100, score)),
    savingsRateScore: Math.round(savingsRateScore),
    budgetControlScore: Math.round(budgetControlScore),
    debtScore: Math.round(debtScore),
    reserveScore: Math.round(reserveScore),
    consistencyScore: Math.round(consistencyScore),
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
  };
}
