import type { AppState, Budget } from "../types";
import { categorySpend } from "./selectors";
import { todayISO } from "../format";

export interface BudgetAnalysis {
  budget: Budget;
  spent: number;
  remaining: number;
  pctUsed: number;
  projectedClosing: number;
}

export function analyzeBudget(state: AppState, budget: Budget, referenceIso: string = todayISO()): BudgetAnalysis {
  const spent = categorySpend(state, budget.category, referenceIso);
  const remaining = budget.monthlyLimit - spent;
  const pctUsed = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;

  const now = new Date(referenceIso + "T00:00:00");
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedClosing = dayOfMonth > 0 ? (spent / dayOfMonth) * daysInMonth : spent;

  return { budget, spent, remaining, pctUsed, projectedClosing };
}
