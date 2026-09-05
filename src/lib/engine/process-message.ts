import type { Store } from "../store";
import { parseMessage, transactionTypeForIntent } from "./parser";
import { answerQuestion } from "./assistant";
import { CATEGORIES } from "../categories";
import { formatCurrency } from "../format";

/**
 * Interpreta uma mensagem em linguagem natural, executa a ação correspondente no store
 * (registrar transação, criar meta/dívida, definir prazo) ou responde uma pergunta,
 * e retorna o texto de resposta a ser exibido para o usuário.
 */
export function processUserMessage(text: string, store: Store): string {
  const trimmed = text.trim();
  const parsed = parseMessage(trimmed);

  if (parsed.intent === "question") {
    return answerQuestion(trimmed, store);
  }

  if (parsed.intent === "create_goal") {
    if (parsed.amount === null) {
      return "Não consegui identificar o valor da meta. Tente incluir um valor, ex: R$ 5.000.";
    }
    const goal = store.addGoal({
      name: trimmed.replace(/^(quero comprar|quero juntar|quero economizar|quero guardar|quero atingir)\s*/i, "").trim() || "Nova meta",
      kind: "custom",
      targetAmount: parsed.amount,
      currentAmount: 0,
      priority: store.goals.length + 1,
    });
    return `Meta "${goal.name}" criada com o objetivo de ${formatCurrency(parsed.amount)}. Me diga o prazo desejado (ex: "em 10 meses") para eu calcular o aporte mensal necessário.`;
  }

  if (parsed.intent === "set_goal_deadline" && parsed.months) {
    const lastGoal = [...store.goals].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
    if (!lastGoal) return "Você ainda não tem metas para definir um prazo.";
    const target = new Date();
    target.setMonth(target.getMonth() + parsed.months);
    store.updateGoal(lastGoal.id, { targetDate: target.toISOString().slice(0, 10) });
    return `Prazo de ${parsed.months} meses definido para "${lastGoal.name}". Confira os detalhes na página de Metas.`;
  }

  if (parsed.intent === "create_debt") {
    if (parsed.amount === null) return "Não consegui identificar o valor da dívida.";
    store.addDebt({
      creditor: "Dívida registrada via assistente",
      totalAmount: parsed.amount,
      remainingAmount: parsed.amount,
      installmentAmount: parsed.amount,
      installmentsTotal: 1,
      installmentsPaid: 0,
      interestRateMonthly: 0,
      dueDay: new Date().getDate(),
    });
    return `Dívida de ${formatCurrency(parsed.amount)} registrada. Complete os detalhes (parcelas, juros, vencimento) na página de Dívidas.`;
  }

  if (parsed.amount === null) {
    return "Não consegui identificar um valor nessa mensagem. Tente algo como \"Gastei R$ 50 no mercado\" ou pergunte algo sobre suas finanças.";
  }

  const type = transactionTypeForIntent(parsed.intent === "unknown" ? "register_expense" : parsed.intent);
  store.addTransaction({
    type,
    amount: parsed.amount,
    category: type === "income" ? "receita" : parsed.category,
    description: trimmed,
    date: parsed.date,
    source: "chat",
  });

  const label = type === "income" ? "Receita" : type === "investment" ? "Investimento" : "Despesa";
  const catLabel = type === "expense" ? ` em ${CATEGORIES[parsed.category].label}` : "";
  return `Registrado: ${label} de ${formatCurrency(parsed.amount)}${catLabel}. Atualizei seu saldo, orçamento e projeções.`;
}
