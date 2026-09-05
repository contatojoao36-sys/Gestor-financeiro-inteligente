import type { AppState, Transaction, CategoryKey, Goal, Debt } from "../types";
import { monthKey, todayISO, addMonthsISO } from "../format";
import { EXPENSE_CATEGORIES } from "../categories";

// ---------------------------------------------------------------------------
// Modelo de saldo:
// income          -> entra no saldo
// expense         -> sai do saldo
// investment      -> sai do saldo, vira patrimônio investido
// debt_payment    -> sai do saldo, abate dívida
// transfer        -> sai do saldo, vira aporte em meta/reserva (currentAmount da Goal)
// ---------------------------------------------------------------------------

export function txSign(t: Transaction): number {
  switch (t.type) {
    case "income":
      return 1;
    default:
      return -1;
  }
}

export function getBalance(state: AppState): number {
  return (
    state.settings.initialBalance +
    state.transactions.reduce((sum, t) => sum + txSign(t) * t.amount, 0)
  );
}

export function getTotalSaved(state: AppState): number {
  return state.transactions
    .filter((t) => t.type === "transfer")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalInvested(state: AppState): number {
  return (
    state.settings.initialInvested +
    state.transactions.filter((t) => t.type === "investment").reduce((sum, t) => sum + t.amount, 0)
  );
}

/** Saldo acumulado considerando apenas transações até (e incluindo) uma data — usado para fechar meses passados. */
export function getBalanceAsOf(state: AppState, dateIso: string): number {
  return (
    state.settings.initialBalance +
    state.transactions.filter((t) => t.date <= dateIso).reduce((sum, t) => sum + txSign(t) * t.amount, 0)
  );
}

export function getTotalSavedAsOf(state: AppState, dateIso: string): number {
  return state.transactions
    .filter((t) => t.type === "transfer" && t.date <= dateIso)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalInvestedAsOf(state: AppState, dateIso: string): number {
  return (
    state.settings.initialInvested +
    state.transactions.filter((t) => t.type === "investment" && t.date <= dateIso).reduce((sum, t) => sum + t.amount, 0)
  );
}

export function getTotalDebtRemainingAsOf(state: AppState, dateIso: string): number {
  return state.debts
    .filter((d) => d.createdAt.slice(0, 10) <= dateIso && (!d.closedAt || d.closedAt > dateIso))
    .reduce((sum, d) => {
      const paid = state.transactions
        .filter((t) => t.type === "debt_payment" && t.debtId === d.id && t.date <= dateIso)
        .reduce((s, t) => s + t.amount, 0);
      return sum + Math.max(d.remainingAmount - paid, 0);
    }, 0);
}

export function getNetWorthAsOf(state: AppState, dateIso: string): number {
  return (
    getBalanceAsOf(state, dateIso) +
    getTotalSavedAsOf(state, dateIso) +
    getTotalInvestedAsOf(state, dateIso) -
    getTotalDebtRemainingAsOf(state, dateIso)
  );
}

/** Todos os meses (YYYY-MM) que têm ao menos uma transação registrada, em ordem crescente. */
export function getAllActivityMonths(state: AppState): string[] {
  const months = new Set(state.transactions.map((t) => monthKey(t.date)));
  return Array.from(months).sort();
}

/** Valor acumulado real de uma meta: base cadastrada + soma de aportes (transferências) vinculados a ela. */
export function getGoalCurrentAmount(state: AppState, goal: Goal): number {
  const contributed = state.transactions
    .filter((t) => t.type === "transfer" && t.goalId === goal.id)
    .reduce((s, t) => s + t.amount, 0);
  return goal.currentAmount + contributed;
}

/** Saldo devedor real de uma dívida: base cadastrada - soma de pagamentos vinculados a ela. */
export function getDebtRemainingAmount(state: AppState, debt: Debt): number {
  const paid = state.transactions
    .filter((t) => t.type === "debt_payment" && t.debtId === debt.id)
    .reduce((s, t) => s + t.amount, 0);
  return Math.max(debt.remainingAmount - paid, 0);
}

/** Quantas parcelas foram pagas de fato (base + pagamentos registrados no app). */
export function getDebtInstallmentsPaid(state: AppState, debt: Debt): number {
  const payments = state.transactions.filter((t) => t.type === "debt_payment" && t.debtId === debt.id).length;
  return Math.min(debt.installmentsPaid + payments, debt.installmentsTotal);
}

export function getTotalDebtRemaining(state: AppState): number {
  return state.debts
    .filter((d) => !d.closedAt)
    .reduce((sum, d) => sum + getDebtRemainingAmount(state, d), 0);
}

export function getNetWorth(state: AppState): number {
  return (
    getBalance(state) +
    getTotalSaved(state) +
    getTotalInvested(state) -
    getTotalDebtRemaining(state)
  );
}

export function transactionsInMonth(state: AppState, monthIso: string): Transaction[] {
  const key = monthKey(monthIso);
  return state.transactions.filter((t) => monthKey(t.date) === key);
}

export function monthTotals(state: AppState, monthIso: string) {
  const txs = transactionsInMonth(state, monthIso);
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const saved = txs.filter((t) => t.type === "transfer").reduce((s, t) => s + t.amount, 0);
  const invested = txs.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0);
  const debtPaid = txs.filter((t) => t.type === "debt_payment").reduce((s, t) => s + t.amount, 0);
  const net = income - expense - saved - invested - debtPaid;
  return { income, expense, saved, invested, debtPaid, net, count: txs.length };
}

export function categorySpend(state: AppState, category: CategoryKey, monthIso: string): number {
  return transactionsInMonth(state, monthIso)
    .filter((t) => t.type === "expense" && t.category === category)
    .reduce((s, t) => s + t.amount, 0);
}

export function allCategorySpend(state: AppState, monthIso: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const cat of EXPENSE_CATEGORIES) {
    result[cat] = categorySpend(state, cat, monthIso);
  }
  return result;
}

/** Média mensal de uma métrica nos últimos N meses (incluindo o atual), ignorando meses sem nenhuma transação registrada. */
export function trailingAverage(
  state: AppState,
  months: number,
  pick: (t: ReturnType<typeof monthTotals>) => number,
  referenceMonthIso: string = todayISO()
): number {
  const values: number[] = [];
  for (let i = 0; i < months; i++) {
    const iso = addMonthsISO(referenceMonthIso, -i);
    const totals = monthTotals(state, iso);
    if (totals.count > 0) values.push(pick(totals));
  }
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Capacidade mensal de poupança: quanto sobra por mês considerando o padrão real de gastos. */
export function getMonthlySavingsCapacity(state: AppState): number {
  const avgIncome = trailingAverage(state, 3, (t) => t.income);
  const avgExpense = trailingAverage(state, 3, (t) => t.expense);
  if (avgIncome > 0) {
    return Math.max(avgIncome - avgExpense, 0);
  }
  // Sem histórico suficiente: usa a renda esperada informada no onboarding
  // menos o total orçado para categorias essenciais.
  const essentials: CategoryKey[] = ["moradia", "alimentacao", "transporte", "saude", "educacao"];
  const essentialBudget = state.budgets
    .filter((b) => essentials.includes(b.category))
    .reduce((s, b) => s + b.monthlyLimit, 0);
  const nonEssentialBudget = state.budgets
    .filter((b) => !essentials.includes(b.category))
    .reduce((s, b) => s + b.monthlyLimit, 0);
  return Math.max(state.settings.monthlyIncomeExpected - essentialBudget - nonEssentialBudget, 0);
}

export function getDiscretionaryMonthlyAvg(state: AppState): number {
  const discretionary: CategoryKey[] = ["lazer", "compras", "assinaturas", "outros"];
  return trailingAverage(state, 3, (t) => t.expense) === 0
    ? discretionary.reduce((s, c) => {
        const b = state.budgets.find((bb) => bb.category === c);
        return s + (b?.monthlyLimit ?? 0);
      }, 0)
    : discretionary.reduce((sum, cat) => {
        let total = 0;
        let months = 0;
        for (let i = 0; i < 3; i++) {
          const iso = addMonthsISO(todayISO(), -i);
          const v = categorySpend(state, cat, iso);
          if (v > 0) {
            total += v;
            months += 1;
          }
        }
        return sum + (months > 0 ? total / months : 0);
      }, 0);
}

/** Média mensal de gastos de uma categoria nos últimos N meses (ignora meses sem histórico). */
export function trailingCategoryAverage(
  state: AppState,
  category: CategoryKey,
  months: number,
  referenceMonthIso: string = todayISO()
): number {
  const values: number[] = [];
  for (let i = 1; i <= months; i++) {
    const iso = addMonthsISO(referenceMonthIso, -i);
    const v = categorySpend(state, category, iso);
    if (v > 0) values.push(v);
  }
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Série mensal (do mais antigo para o mais recente) para gráficos de receitas x despesas. */
export function getMonthlySeries(state: AppState, months: number, referenceMonthIso: string = todayISO()) {
  const series: { month: string; income: number; expense: number; net: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const iso = addMonthsISO(referenceMonthIso, -i);
    const totals = monthTotals(state, iso);
    series.push({ month: monthKey(iso), income: totals.income, expense: totals.expense, net: totals.net });
  }
  return series;
}

export function getActiveGoals(state: AppState) {
  return state.goals.filter((g) => !g.archived && !g.completedAt).sort((a, b) => a.priority - b.priority);
}

export function getMainGoal(state: AppState) {
  return getActiveGoals(state)[0];
}
