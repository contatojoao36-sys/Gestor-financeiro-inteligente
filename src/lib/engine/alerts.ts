import type { AppState, Notification } from "../types";
import { CATEGORIES } from "../categories";
import { addMonthsISO, nowISO, todayISO } from "../format";
import { categorySpend, getActiveGoals, trailingAverage, trailingCategoryAverage } from "./selectors";
import { analyzeGoal } from "./goals";

let counter = 0;
function nid() {
  counter += 1;
  return `alert-${Date.now()}-${counter}`;
}

/** Gera os alertas inteligentes atuais a partir do estado. Não persiste — quem chama decide o que salvar. */
export function computeAlerts(state: AppState): Notification[] {
  const alerts: Notification[] = [];
  const today = todayISO();
  const now = nowISO();

  for (const budget of state.budgets) {
    if (budget.monthlyLimit <= 0) continue;
    const spent = categorySpend(state, budget.category, today);
    const pct = (spent / budget.monthlyLimit) * 100;
    const label = CATEGORIES[budget.category].label;
    if (pct >= 100) {
      alerts.push({
        id: nid(),
        level: "danger",
        icon: "AlertTriangle",
        title: `Orçamento de ${label} estourado`,
        message: `Você já ultrapassou o orçamento de ${label} este mês (${pct.toFixed(0)}% utilizado).`,
        createdAt: now,
        read: false,
        category: "budget",
      });
    } else if (pct >= 80) {
      alerts.push({
        id: nid(),
        level: "warning",
        icon: "AlertTriangle",
        title: `Atenção ao orçamento de ${label}`,
        message: `Você já utilizou ${pct.toFixed(0)}% do orçamento de ${label} este mês.`,
        createdAt: now,
        read: false,
        category: "budget",
      });
    }
  }

  for (const budget of state.budgets) {
    const catAvg = trailingCategoryAverage(state, budget.category, 3, today);
    const current = categorySpend(state, budget.category, today);
    if (catAvg > 50 && current > catAvg * 1.3) {
      const pctAbove = ((current - catAvg) / catAvg) * 100;
      alerts.push({
        id: nid(),
        level: "warning",
        icon: "TrendingUp",
        title: `Gasto acima da média em ${CATEGORIES[budget.category].label}`,
        message: `Seus gastos com ${CATEGORIES[budget.category].label} estão ${pctAbove.toFixed(0)}% acima da sua média mensal.`,
        createdAt: now,
        read: false,
        category: "trend",
      });
    }
  }

  const lastMonth = addMonthsISO(today, -1);
  const savedThisMonth = trailingAverage(state, 1, (t) => t.saved + t.invested, today);
  const savedLastMonth = trailingAverage(state, 1, (t) => t.saved + t.invested, lastMonth);
  if (savedLastMonth > 0 && savedThisMonth > savedLastMonth) {
    alerts.push({
      id: nid(),
      level: "success",
      icon: "PiggyBank",
      title: "Economia em alta",
      message: `Você economizou R$ ${(savedThisMonth - savedLastMonth).toFixed(0)} a mais que no mês passado.`,
      createdAt: now,
      read: false,
      category: "trend",
    });
  }

  for (const goal of getActiveGoals(state)) {
    const analysis = analyzeGoal(state, goal);
    if (analysis.remaining <= 0) continue;

    alerts.push({
      id: nid(),
      level: "info",
      icon: "Target",
      title: `Meta "${goal.name}"`,
      message: `Faltam R$ ${analysis.remaining.toFixed(0)} para essa meta.`,
      createdAt: now,
      read: false,
      category: "goal",
    });

    if (analysis.status === "late" && analysis.monthsAheadOrBehind !== null) {
      alerts.push({
        id: nid(),
        level: "danger",
        icon: "AlertCircle",
        title: `Meta "${goal.name}" atrasada`,
        message: `No ritmo atual, essa meta atrasará aproximadamente ${Math.abs(analysis.monthsAheadOrBehind).toFixed(1)} meses em relação ao prazo.`,
        createdAt: now,
        read: false,
        category: "goal",
      });
    } else if (analysis.monthsAheadOrBehind !== null && analysis.monthsAheadOrBehind > 0.5) {
      alerts.push({
        id: nid(),
        level: "success",
        icon: "TrendingUp",
        title: `Meta "${goal.name}" adiantada`,
        message: `Mantendo esse ritmo, você alcançará essa meta cerca de ${analysis.monthsAheadOrBehind.toFixed(1)} meses antes do prazo.`,
        createdAt: now,
        read: false,
        category: "goal",
      });
    }
  }

  const incomeAvg = trailingAverage(state, 3, (t) => t.income) || state.settings.monthlyIncomeExpected;
  const expenseAvg = trailingAverage(state, 3, (t) => t.expense);
  if (incomeAvg > 0 && expenseAvg > incomeAvg) {
    alerts.push({
      id: nid(),
      level: "danger",
      icon: "AlertTriangle",
      title: "Saldo projetado negativo",
      message: "Seus gastos médios estão superando sua renda. Recomendo limitar gastos variáveis até o próximo recebimento.",
      createdAt: now,
      read: false,
      category: "trend",
    });
  }

  return alerts;
}
