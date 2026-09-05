import type { AppState } from "../types";
import { getActiveGoals, getGoalCurrentAmount, getMonthlySavingsCapacity } from "./selectors";
import { analyzeGoal } from "./goals";

export interface DistributionSuggestion {
  expenses: number;
  mainGoal: number;
  reserve: number;
  investments: number;
  free: number;
  total: number;
  reasoning: string[];
}

/**
 * Sugere como dividir um recebimento com base na situação real cadastrada:
 * despesas essenciais pendentes, dívidas, status das metas e reserva de emergência.
 * Nenhum percentual é fixo — os pesos mudam conforme os dados do usuário.
 */
export function suggestDistribution(state: AppState, incomingAmount: number): DistributionSuggestion {
  const reasoning: string[] = [];

  const essentialCategories = ["moradia", "alimentacao", "transporte", "saude", "educacao"] as const;
  const essentialMonthly = state.budgets
    .filter((b) => essentialCategories.includes(b.category as (typeof essentialCategories)[number]))
    .reduce((s, b) => s + b.monthlyLimit, 0);

  const openDebts = state.debts.filter((d) => !d.closedAt);
  const debtInstallments = openDebts.reduce((s, d) => s + d.installmentAmount, 0);

  const essentials = Math.min(essentialMonthly, incomingAmount);
  reasoning.push(
    essentials > 0
      ? `R$ ${essentials.toFixed(0)} reservado para contas essenciais (moradia, alimentação, transporte, saúde, educação).`
      : `Nenhum orçamento essencial cadastrado ainda — considere revisar em Configurações.`
  );

  let remainder = Math.max(incomingAmount - essentials, 0);

  const debtShare = Math.min(debtInstallments, remainder);
  remainder -= debtShare;
  if (debtShare > 0) reasoning.push(`R$ ${debtShare.toFixed(0)} reservado para parcelas de dívidas em aberto.`);

  if (remainder <= 0) {
    return {
      expenses: essentials,
      mainGoal: 0,
      reserve: 0,
      investments: 0,
      free: 0,
      total: essentials + debtShare,
      reasoning: [...reasoning, "A renda recebida cobre apenas os compromissos essenciais deste ciclo."],
    };
  }

  const activeGoals = getActiveGoals(state);
  const mainGoal = activeGoals[0];
  const reserveGoal = activeGoals.find((g) => g.kind === "reserve");

  let wGoal = 0.35;
  let wReserve = 0.25;
  let wInvest = 0.15;
  let wFree = 0.25;

  if (reserveGoal) {
    const idealReserve = essentialMonthly * 3;
    const reserveCoverage = idealReserve > 0 ? getGoalCurrentAmount(state, reserveGoal) / idealReserve : 1;
    if (reserveCoverage < 1) {
      wReserve += 0.15;
      wFree -= 0.1;
      wInvest -= 0.05;
      reasoning.push("Sua reserva de emergência ainda não cobre 3 meses de gastos essenciais, por isso ela recebeu peso maior.");
    }
  }

  if (mainGoal) {
    const analysis = analyzeGoal(state, mainGoal);
    if (analysis.status === "late") {
      wGoal += 0.15;
      wFree -= 0.15;
      reasoning.push(`Sua meta "${mainGoal.name}" está atrasada em relação ao prazo, então priorizamos um aporte maior.`);
    } else if (analysis.status === "on_track") {
      reasoning.push(`Sua meta "${mainGoal.name}" está no ritmo certo — mantendo o aporte sugerido.`);
    }
  } else {
    wGoal = 0;
  }

  if (openDebts.length === 0 && (!reserveGoal || reserveGoal.currentAmount >= essentialMonthly * 3)) {
    wInvest += 0.1;
    reasoning.push("Sem dívidas em aberto e reserva completa: direcionamos mais para investimentos.");
  }

  const total = wGoal + wReserve + wInvest + wFree;
  const norm = total > 0 ? 1 / total : 0;

  const mainGoalAmount = Math.round((remainder * wGoal * norm) / 10) * 10;
  const reserveAmount = Math.round((remainder * wReserve * norm) / 10) * 10;
  const investAmount = Math.round((remainder * wInvest * norm) / 10) * 10;
  const freeAmount = Math.max(remainder - mainGoalAmount - reserveAmount - investAmount, 0);

  return {
    expenses: essentials + debtShare,
    mainGoal: mainGoalAmount,
    reserve: reserveAmount,
    investments: investAmount,
    free: freeAmount,
    total: incomingAmount,
    reasoning,
  };
}

export function getTodayRecommendation(state: AppState): string {
  const capacity = getMonthlySavingsCapacity(state);
  const activeGoals = getActiveGoals(state);
  if (capacity <= 0 && activeGoals.length > 0) {
    return "Seus gastos estão consumindo praticamente toda a sua renda. Recomendo revisar categorias variáveis antes de assumir novos compromissos.";
  }
  if (activeGoals.length === 0) {
    return "Você ainda não tem metas cadastradas. Que tal definir um objetivo financeiro para direcionar sua economia mensal?";
  }
  const main = activeGoals[0];
  const analysis = analyzeGoal(state, main);
  if (analysis.status === "late") {
    return `Sua meta "${main.name}" está atrasada. Considere aumentar o aporte mensal para cerca de R$ ${analysis.requiredMonthlyForDeadline?.toFixed(0) ?? "-"} para retomar o ritmo.`;
  }
  if (analysis.status === "on_track") {
    return `Você está no caminho certo com "${main.name}". Mantenha o aporte de aproximadamente R$ ${analysis.monthlyContributionRate.toFixed(0)}/mês.`;
  }
  return `Registre seus recebimentos e gastos de hoje para manter o planejamento sempre atualizado.`;
}
