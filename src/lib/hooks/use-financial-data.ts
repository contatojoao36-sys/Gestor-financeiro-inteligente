"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import type { AppState } from "@/lib/types";
import { todayISO } from "@/lib/format";
import {
  getBalance,
  getNetWorth,
  getTotalSaved,
  getTotalInvested,
  getTotalDebtRemaining,
  getMonthlySavingsCapacity,
  monthTotals,
  allCategorySpend,
  getActiveGoals,
} from "@/lib/engine/selectors";
import { analyzeGoal } from "@/lib/engine/goals";
import { computeHealthScore } from "@/lib/engine/health";
import { buildProjection } from "@/lib/engine/projections";
import { computeAlerts } from "@/lib/engine/alerts";
import { detectRecurring, detectAnomalies, detectExpenseTrend, detectOpportunities } from "@/lib/engine/insights";
import { getTodayRecommendation } from "@/lib/engine/distribution";

/** Ponto único de derivação: lê o estado bruto e recalcula tudo (saldo, metas, saúde, projeções, alertas). */
export function useFinancialData() {
  const state = useAppStore((s) => s) as AppState;
  const today = todayISO();

  return React.useMemo(() => {
    const balance = getBalance(state);
    const netWorth = getNetWorth(state);
    const totalSaved = getTotalSaved(state);
    const totalInvested = getTotalInvested(state);
    const totalDebt = getTotalDebtRemaining(state);
    const capacity = getMonthlySavingsCapacity(state);
    const currentMonth = monthTotals(state, today);
    const categorySpendMap = allCategorySpend(state, today);
    const activeGoals = getActiveGoals(state).map((g) => analyzeGoal(state, g));
    const mainGoalAnalysis = activeGoals[0];
    const health = computeHealthScore(state);
    const projection = buildProjection(state);
    const alerts = computeAlerts(state);
    const recurring = detectRecurring(state);
    const anomalies = detectAnomalies(state);
    const trend = detectExpenseTrend(state);
    const opportunities = detectOpportunities(state);
    const recommendation = getTodayRecommendation(state);

    return {
      state,
      balance,
      netWorth,
      totalSaved,
      totalInvested,
      totalDebt,
      capacity,
      currentMonth,
      categorySpendMap,
      activeGoals,
      mainGoalAnalysis,
      health,
      projection,
      alerts,
      recurring,
      anomalies,
      trend,
      opportunities,
      recommendation,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
