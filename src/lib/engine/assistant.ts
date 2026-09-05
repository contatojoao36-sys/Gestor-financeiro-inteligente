import type { AppState, CategoryKey } from "../types";
import { CATEGORIES, EXPENSE_CATEGORIES } from "../categories";
import { formatCurrency, formatDateLong, todayISO } from "../format";
import { extractAllAmounts } from "./parser";
import {
  categorySpend,
  getActiveGoals,
  getBalance,
  getMonthlySavingsCapacity,
  monthTotals,
  transactionsInMonth,
} from "./selectors";
import { analyzeGoal, simulateReach } from "./goals";
import { suggestDistribution } from "./distribution";

const DAYS_IN_MONTH = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

function daysRemainingInMonth(): number {
  return Math.max(DAYS_IN_MONTH - new Date().getDate() + 1, 1);
}

function findGoalByText(state: AppState, text: string) {
  const normalized = text.toLowerCase();
  return getActiveGoals(state).find((g) => normalized.includes(g.name.toLowerCase()));
}

/** Responde perguntas em linguagem natural usando somente os dados reais cadastrados no app. */
export function answerQuestion(text: string, state: AppState): string {
  const normalized = text.toLowerCase();
  const today = todayISO();

  // "Se eu receber R$ 5 mil amanhã, como você recomenda distribuir?"
  if (normalized.includes("distribui") || (normalized.includes("receber") && normalized.includes("como"))) {
    const amounts = extractAllAmounts(text);
    if (amounts.length > 0) {
      const suggestion = suggestDistribution(state, amounts[0]);
      return (
        `Para ${formatCurrency(amounts[0])}, sugiro: ${formatCurrency(suggestion.expenses)} para despesas essenciais, ` +
        `${formatCurrency(suggestion.mainGoal)} para sua meta principal, ${formatCurrency(suggestion.reserve)} para reserva, ` +
        `${formatCurrency(suggestion.investments)} para investimentos e ${formatCurrency(suggestion.free)} de margem livre. ` +
        suggestion.reasoning.join(" ")
      );
    }
  }

  // "Se eu guardar R$ 800 por mês, quando chego em R$ 20 mil?"
  if (normalized.includes("guardar") && normalized.includes("quando")) {
    const amounts = extractAllAmounts(text);
    if (amounts.length >= 2) {
      const [monthly, target] = amounts;
      const result = simulateReach(0, target, monthly);
      if (result.months !== null && result.date) {
        return `Guardando ${formatCurrency(monthly)} por mês, você chega a ${formatCurrency(target)} em aproximadamente ${result.months} meses (por volta de ${formatDateLong(result.date)}).`;
      }
    }
  }

  // "Posso comprar um tênis de R$ 500?"
  if (normalized.includes("posso comprar") || (normalized.includes("posso") && normalized.includes("de r$"))) {
    const amounts = extractAllAmounts(text);
    const amount = amounts[0] ?? null;
    if (amount) {
      const balance = getBalance(state);
      const capacity = getMonthlySavingsCapacity(state);
      const safeMargin = balance - capacity; // preserva a capacidade de poupança do mês
      if (amount <= safeMargin) {
        return `Sim, dá para comprar. Seu saldo atual é ${formatCurrency(balance)} e isso não compromete sua capacidade de poupança do mês (${formatCurrency(capacity)}).`;
      }
      if (amount <= balance) {
        return `Dá para pagar com o saldo atual (${formatCurrency(balance)}), mas isso vai reduzir o quanto você consegue guardar este mês. Avalie se vale a pena agora ou se dá para esperar o próximo recebimento.`;
      }
      return `Ainda não. Seu saldo atual é ${formatCurrency(balance)}, abaixo dos ${formatCurrency(amount)} necessários. Recomendo aguardar o próximo recebimento ou reduzir gastos variáveis antes.`;
    }
  }

  // "Quanto posso gastar hoje?"
  if (normalized.includes("quanto posso gastar")) {
    const discretionaryCats: CategoryKey[] = EXPENSE_CATEGORIES.filter((c) => c !== "moradia" && c !== "saude" && c !== "educacao");
    const totalBudget = state.budgets
      .filter((b) => discretionaryCats.includes(b.category))
      .reduce((s, b) => s + b.monthlyLimit, 0);
    const spent = discretionaryCats.reduce((s, c) => s + categorySpend(state, c, today), 0);
    const remaining = Math.max(totalBudget - spent, 0);
    const daily = remaining / daysRemainingInMonth();
    return `Com base no seu orçamento variável restante, você pode gastar com segurança cerca de ${formatCurrency(daily)} por dia até o fim do mês.`;
  }

  // "Quanto preciso guardar esse mês?"
  if (normalized.includes("preciso guardar") || normalized.includes("devo guardar")) {
    const goalsWithDeadline = getActiveGoals(state).map((g) => analyzeGoal(state, g)).filter((a) => a.requiredMonthlyForDeadline !== null);
    if (goalsWithDeadline.length > 0) {
      const total = goalsWithDeadline.reduce((s, a) => s + (a.requiredMonthlyForDeadline ?? 0), 0);
      return `Para manter todas as suas metas com prazo dentro do planejado, você precisa guardar cerca de ${formatCurrency(total)} este mês.`;
    }
    const capacity = getMonthlySavingsCapacity(state);
    return `Você não tem metas com prazo definido ainda. Pela sua capacidade atual, dá para guardar cerca de ${formatCurrency(capacity)} este mês.`;
  }

  // "Quando vou conseguir comprar meu celular?" / genérico sobre uma meta específica
  if (normalized.includes("quando vou conseguir") || normalized.includes("quando consigo") || normalized.includes("quando eu vou")) {
    const goal = findGoalByText(state, text) ?? getActiveGoals(state)[0];
    if (goal) {
      const analysis = analyzeGoal(state, goal);
      if (analysis.projectedCompletionDate) {
        return `No ritmo atual, você deve alcançar "${goal.name}" por volta de ${formatDateLong(analysis.projectedCompletionDate)} (faltam ${formatCurrency(analysis.remaining)}).`;
      }
      return `Ainda não há aportes recentes para "${goal.name}" — defina um valor mensal para eu calcular uma previsão.`;
    }
    return "Você ainda não tem metas cadastradas. Crie uma meta para eu calcular o prazo estimado.";
  }

  // "Quanto gastei com comida esse mês?"
  if (normalized.includes("quanto gastei")) {
    for (const key of Object.keys(CATEGORIES)) {
      const cat = CATEGORIES[key as keyof typeof CATEGORIES];
      if (normalized.includes(cat.label.toLowerCase()) || (key === "alimentacao" && (normalized.includes("comida") || normalized.includes("alimenta")))) {
        const spent = categorySpend(state, cat.key, today);
        return `Você gastou ${formatCurrency(spent)} com ${cat.label.toLowerCase()} este mês.`;
      }
    }
    const totals = monthTotals(state, today);
    return `Você gastou ${formatCurrency(totals.expense)} no total este mês.`;
  }

  // "Qual foi meu maior gasto?"
  if (normalized.includes("maior gasto")) {
    const txs = transactionsInMonth(state, today).filter((t) => t.type === "expense");
    if (txs.length === 0) return "Ainda não há gastos registrados este mês.";
    const max = txs.reduce((a, b) => (b.amount > a.amount ? b : a));
    return `Seu maior gasto este mês foi ${formatCurrency(max.amount)} com "${max.description}" em ${formatDateLong(max.date)}.`;
  }

  // "Quanto economizei comparado ao mês passado?"
  if (normalized.includes("economizei") && normalized.includes("compar")) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastIso = lastMonth.toISOString().slice(0, 10);
    const current = monthTotals(state, today);
    const previous = monthTotals(state, lastIso);
    const diff = current.saved + current.invested - (previous.saved + previous.invested);
    if (diff >= 0) return `Você economizou ${formatCurrency(diff)} a mais que no mês passado. Continue assim!`;
    return `Você economizou ${formatCurrency(Math.abs(diff))} a menos que no mês passado.`;
  }

  // Fallback: resumo geral da situação
  const balance = getBalance(state);
  const capacity = getMonthlySavingsCapacity(state);
  const main = getActiveGoals(state)[0];
  let summary = `Não tenho uma resposta específica para isso ainda, mas aqui vai um resumo: seu saldo atual é ${formatCurrency(balance)} e sua capacidade de poupança mensal estimada é ${formatCurrency(capacity)}.`;
  if (main) {
    const analysis = analyzeGoal(state, main);
    summary += ` Sua meta principal, "${main.name}", está ${analysis.pctComplete.toFixed(0)}% concluída.`;
  }
  return summary;
}
