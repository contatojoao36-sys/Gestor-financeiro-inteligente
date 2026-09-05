import type { AppState, CategoryKey, Transaction } from "../types";
import { CATEGORIES } from "../categories";
import { addMonthsISO, todayISO } from "../format";
import { categorySpend, getDiscretionaryMonthlyAvg, getGoalCurrentAmount, getMainGoal, trailingCategoryAverage } from "./selectors";
import { analyzeGoal, simulateReach } from "./goals";

export interface RecurringCandidate {
  description: string;
  category: CategoryKey;
  avgAmount: number;
  occurrences: number;
}

/** Detecta gastos recorrentes analisando descrições repetidas em pelo menos 2 dos últimos 3 meses. */
export function detectRecurring(state: AppState): RecurringCandidate[] {
  const groups = new Map<string, Transaction[]>();
  const cutoff = addMonthsISO(todayISO(), -3);

  for (const t of state.transactions) {
    if (t.type !== "expense") continue;
    if (t.date < cutoff) continue;
    const key = `${t.description.trim().toLowerCase()}|${t.category}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const candidates: RecurringCandidate[] = [];
  for (const [key, txs] of groups) {
    const months = new Set(txs.map((t) => t.date.slice(0, 7)));
    if (months.size < 2) continue;
    const amounts = txs.map((t) => t.amount);
    const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const variance = Math.max(...amounts) - Math.min(...amounts);
    if (avg > 0 && variance / avg > 0.4) continue; // valores muito diferentes: provavelmente não é recorrente
    const [description, category] = key.split("|");
    candidates.push({ description, category: category as CategoryKey, avgAmount: avg, occurrences: months.size });
  }

  return candidates.sort((a, b) => b.avgAmount - a.avgAmount);
}

export interface AnomalyInsight {
  category: CategoryKey;
  current: number;
  average: number;
  pctAbove: number;
  message: string;
}

/** Compara o gasto do mês atual com a média dos 3 meses anteriores, por categoria. */
export function detectAnomalies(state: AppState): AnomalyInsight[] {
  const today = todayISO();
  const results: AnomalyInsight[] = [];

  for (const cat of Object.keys(CATEGORIES) as CategoryKey[]) {
    if (CATEGORIES[cat].type !== "expense") continue;
    const current = categorySpend(state, cat, today);
    const avg = trailingCategoryAverage(state, cat, 3, today);
    if (avg < 50 || current < 50) continue;
    const pctAbove = ((current - avg) / avg) * 100;
    if (pctAbove >= 30) {
      results.push({
        category: cat,
        current,
        average: avg,
        pctAbove,
        message: `Seu gasto com ${CATEGORIES[cat].label.toLowerCase()} este mês está ${pctAbove.toFixed(0)}% acima da sua média.`,
      });
    }
  }

  return results.sort((a, b) => b.pctAbove - a.pctAbove);
}

export interface TrendInsight {
  direction: "up" | "down" | "stable";
  monthlyDeltaEstimate: number;
  message: string;
}

/** Tendência simples de gasto total mensal olhando os últimos 3 meses (regressão linear leve). */
export function detectExpenseTrend(state: AppState): TrendInsight {
  const today = todayISO();
  const points: { x: number; y: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const iso = addMonthsISO(today, -i);
    const total = (Object.keys(CATEGORIES) as CategoryKey[])
      .filter((c) => CATEGORIES[c].type === "expense")
      .reduce((s, c) => s + categorySpend(state, c, iso), 0);
    points.push({ x: 2 - i, y: total });
  }

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;

  if (Math.abs(slope) < 30) {
    return { direction: "stable", monthlyDeltaEstimate: slope, message: "Seus gastos mensais estão estáveis nos últimos meses." };
  }
  if (slope > 0) {
    return {
      direction: "up",
      monthlyDeltaEstimate: slope,
      message: `Se continuar nesse ritmo, seus gastos mensais devem aumentar aproximadamente R$ ${slope.toFixed(0)} por mês.`,
    };
  }
  return {
    direction: "down",
    monthlyDeltaEstimate: slope,
    message: `Seus gastos mensais vêm caindo aproximadamente R$ ${Math.abs(slope).toFixed(0)} por mês — continue assim.`,
  };
}

export interface Opportunity {
  message: string;
}

/** Oportunidades: quanto uma redução de gastos variáveis antecipa a meta principal. */
export function detectOpportunities(state: AppState): Opportunity[] {
  const opportunities: Opportunity[] = [];
  const main = getMainGoal(state);
  if (!main) return opportunities;

  const analysis = analyzeGoal(state, main);
  if (analysis.remaining <= 0 || analysis.monthlyContributionRate <= 0) return opportunities;

  const discretionary = getDiscretionaryMonthlyAvg(state);
  if (discretionary < 30) return opportunities;

  const reduction = Math.round((discretionary * 0.25) / 10) * 10;
  if (reduction < 20) return opportunities;

  const currentAmount = getGoalCurrentAmount(state, main);
  const withCurrent = simulateReach(currentAmount, main.targetAmount, analysis.monthlyContributionRate);
  const withReduction = simulateReach(currentAmount, main.targetAmount, analysis.monthlyContributionRate + reduction);

  if (withCurrent.months !== null && withReduction.months !== null && withCurrent.months > withReduction.months) {
    const monthsSaved = withCurrent.months - withReduction.months;
    opportunities.push({
      message: `Você poderia antecipar a meta "${main.name}" em ${monthsSaved} mês(es) reduzindo cerca de R$ ${reduction} por mês em gastos variáveis.`,
    });
  }

  return opportunities;
}
