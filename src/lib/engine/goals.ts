import type { AppState, Goal } from "../types";
import { addMonthsISO, monthsBetween, todayISO } from "../format";
import { getMonthlySavingsCapacity, getDiscretionaryMonthlyAvg, getActiveGoals, getGoalCurrentAmount } from "./selectors";

export type GoalStatus = "on_track" | "attention" | "late" | "done" | "no_data";

export interface GoalAnalysis {
  goal: Goal;
  remaining: number;
  pctComplete: number;
  monthlyContributionRate: number; // ritmo real de aporte (média 3 meses ou allocation manual)
  requiredMonthlyForDeadline: number | null; // se houver prazo desejado
  requiredWeeklyForDeadline: number | null;
  estimatedMonthsAtCurrentPace: number | null;
  projectedCompletionDate: string | null;
  idealPctNow: number | null; // progresso ideal até hoje, se houver prazo
  status: GoalStatus;
  monthsAheadOrBehind: number | null; // positivo = adiantado, negativo = atrasado
}

/** Ritmo real de aporte mensal de uma meta, olhando as transferências vinculadas a ela nos últimos 3 meses. */
export function getGoalMonthlyRate(state: AppState, goal: Goal): number {
  if (goal.monthlyAllocation && goal.monthlyAllocation > 0) return goal.monthlyAllocation;

  const contributions = state.transactions.filter((t) => t.goalId === goal.id && t.type === "transfer");
  if (contributions.length === 0) {
    // Sem histórico: divide a capacidade de poupança proporcionalmente entre metas ativas por prioridade.
    const active = getActiveGoals(state);
    const totalWeight = active.reduce((s, g) => s + 1 / g.priority, 0);
    const capacity = getMonthlySavingsCapacity(state);
    if (totalWeight === 0 || capacity === 0) return 0;
    return capacity * (1 / goal.priority / totalWeight);
  }

  const byMonth = new Map<string, number>();
  for (const c of contributions) {
    const key = c.date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + c.amount);
  }
  const values = Array.from(byMonth.values());
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function analyzeGoal(state: AppState, goal: Goal): GoalAnalysis {
  const current = getGoalCurrentAmount(state, goal);
  const remaining = Math.max(goal.targetAmount - current, 0);
  const pctComplete = goal.targetAmount > 0 ? Math.min((current / goal.targetAmount) * 100, 100) : 0;
  const rate = getGoalMonthlyRate(state, goal);

  const today = todayISO();

  let requiredMonthlyForDeadline: number | null = null;
  let requiredWeeklyForDeadline: number | null = null;
  let idealPctNow: number | null = null;

  if (goal.targetDate) {
    const monthsLeft = Math.max(monthsBetween(today, goal.targetDate), 0.03);
    requiredMonthlyForDeadline = remaining / monthsLeft;
    requiredWeeklyForDeadline = requiredMonthlyForDeadline / 4.345;

    const totalMonths = Math.max(monthsBetween(goal.createdAt.slice(0, 10), goal.targetDate), 0.03);
    const elapsed = Math.max(monthsBetween(goal.createdAt.slice(0, 10), today), 0);
    idealPctNow = Math.min((elapsed / totalMonths) * 100, 100);
  }

  let estimatedMonthsAtCurrentPace: number | null = null;
  let projectedCompletionDate: string | null = null;
  if (remaining <= 0) {
    estimatedMonthsAtCurrentPace = 0;
    projectedCompletionDate = today;
  } else if (rate > 0) {
    estimatedMonthsAtCurrentPace = remaining / rate;
    projectedCompletionDate = addMonthsISO(today, Math.ceil(estimatedMonthsAtCurrentPace));
  }

  let monthsAheadOrBehind: number | null = null;
  if (goal.targetDate && estimatedMonthsAtCurrentPace !== null) {
    const monthsLeft = Math.max(monthsBetween(today, goal.targetDate), 0);
    monthsAheadOrBehind = monthsLeft - estimatedMonthsAtCurrentPace;
  }

  let status: GoalStatus = "no_data";
  if (remaining <= 0) {
    status = "done";
  } else if (goal.targetDate && idealPctNow !== null) {
    const diff = pctComplete - idealPctNow;
    if (diff >= -5) status = "on_track";
    else if (diff >= -20) status = "attention";
    else status = "late";
  } else if (rate > 0) {
    status = "on_track";
  } else {
    status = "attention";
  }

  return {
    goal,
    remaining,
    pctComplete,
    monthlyContributionRate: rate,
    requiredMonthlyForDeadline,
    requiredWeeklyForDeadline,
    estimatedMonthsAtCurrentPace,
    projectedCompletionDate,
    idealPctNow,
    status,
    monthsAheadOrBehind,
  };
}

export interface GoalScenario {
  label: "atual" | "economico" | "agressivo";
  monthlyAmount: number;
  months: number | null;
  completionDate: string | null;
}

export function buildGoalScenarios(state: AppState, goal: Goal): GoalScenario[] {
  const remaining = Math.max(goal.targetAmount - getGoalCurrentAmount(state, goal), 0);
  const currentRate = getGoalMonthlyRate(state, goal);
  const discretionary = getDiscretionaryMonthlyAvg(state);

  const scenarios: { label: GoalScenario["label"]; monthlyAmount: number }[] = [
    { label: "atual", monthlyAmount: currentRate },
    { label: "economico", monthlyAmount: currentRate + discretionary * 0.15 },
    { label: "agressivo", monthlyAmount: currentRate + discretionary * 0.35 },
  ];

  return scenarios.map((s) => {
    if (remaining <= 0) {
      return { ...s, months: 0, completionDate: todayISO() };
    }
    if (s.monthlyAmount <= 0) {
      return { ...s, months: null, completionDate: null };
    }
    const months = Math.ceil(remaining / s.monthlyAmount);
    return { ...s, months, completionDate: addMonthsISO(todayISO(), months) };
  });
}

/** Simulação livre: dado um aporte mensal hipotético, quando uma meta de `target` é atingida a partir de `current`. */
export function simulateReach(current: number, target: number, monthlyAmount: number) {
  const remaining = Math.max(target - current, 0);
  if (remaining <= 0) return { months: 0, date: todayISO() };
  if (monthlyAmount <= 0) return { months: null, date: null };
  const months = Math.ceil(remaining / monthlyAmount);
  return { months, date: addMonthsISO(todayISO(), months) };
}
