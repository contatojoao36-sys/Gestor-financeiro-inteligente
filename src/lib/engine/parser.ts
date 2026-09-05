import type { CategoryKey, TransactionType } from "../types";
import { CATEGORY_KEYWORDS } from "../categories";
import { addDaysISO, todayISO } from "../format";

/** Extrai um valor monetário de um texto livre em português. Aceita "R$ 1.234,56", "1234.56", "1500", "2k", "2 mil". */
export function extractAmount(text: string): number | null {
  const normalized = text.toLowerCase();

  const kMilMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(mil|k)\b/);
  if (kMilMatch) {
    const base = parseFloat(kMilMatch[1].replace(",", "."));
    return base * 1000;
  }

  const currencyMatch = normalized.match(/r?\$?\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/);
  if (currencyMatch) {
    let raw = currencyMatch[1];
    if (raw.includes(",") && raw.includes(".")) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else if (raw.includes(",")) {
      raw = raw.replace(",", ".");
    }
    const value = parseFloat(raw);
    if (!isNaN(value) && value > 0) return value;
  }
  return null;
}

/** Extrai todos os valores monetários mencionados no texto, na ordem em que aparecem. */
export function extractAllAmounts(text: string): number[] {
  const normalized = text.toLowerCase();
  const results: number[] = [];
  const regex = /r?\$?\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(mil|k)?/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(normalized)) !== null) {
    let raw = match[1];
    if (raw.includes(",") && raw.includes(".")) raw = raw.replace(/\./g, "").replace(",", ".");
    else if (raw.includes(",")) raw = raw.replace(",", ".");
    let value = parseFloat(raw);
    if (isNaN(value)) continue;
    if (match[2]) value *= 1000;
    if (value > 0) results.push(value);
  }
  return results;
}

export function extractDate(text: string): string {
  const normalized = text.toLowerCase();
  if (normalized.includes("anteontem")) return addDaysISO(todayISO(), -2);
  if (normalized.includes("ontem")) return addDaysISO(todayISO(), -1);
  if (normalized.includes("hoje")) return todayISO();

  const diaMatch = normalized.match(/dia\s+(\d{1,2})/);
  if (diaMatch) {
    const day = parseInt(diaMatch[1], 10);
    const today = new Date();
    const candidate = new Date(today.getFullYear(), today.getMonth(), day);
    return candidate.toISOString().slice(0, 10);
  }

  return todayISO();
}

export function extractMonthsDuration(text: string): number | null {
  const normalized = text.toLowerCase();
  const match = normalized.match(/(\d+)\s*(mes|mês|meses)/);
  if (match) return parseInt(match[1], 10);
  const yearMatch = normalized.match(/(\d+)\s*(ano|anos)/);
  if (yearMatch) return parseInt(yearMatch[1], 10) * 12;
  return null;
}

export function categorizeText(text: string): CategoryKey {
  const normalized = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords!.some((kw) => normalized.includes(kw))) {
      return category as CategoryKey;
    }
  }
  return "outros";
}

export type Intent =
  | "register_income"
  | "register_expense"
  | "register_investment"
  | "register_debt_payment"
  | "create_debt"
  | "create_goal"
  | "set_goal_deadline"
  | "question"
  | "unknown";

export interface ParsedMessage {
  intent: Intent;
  amount: number | null;
  date: string;
  category: CategoryKey;
  description: string;
  months: number | null;
}

const INCOME_VERBS = ["recebi", "ganhei", "entrou", "caiu na conta", "me pagaram", "faturei"];
const EXPENSE_VERBS = ["gastei", "paguei", "comprei", "gasto de"];
const DEBT_VERBS = ["tenho uma dívida", "tenho uma divida", "devo", "fiquei devendo"];
const INVEST_VERBS = ["investi", "apliquei"];
const GOAL_VERBS = ["quero comprar", "quero juntar", "quero economizar", "minha meta é", "meu objetivo é", "quero guardar", "quero atingir"];
const QUESTION_MARKERS = ["quanto", "posso", "quando", "qual", "se eu", "?"];

export function parseMessage(text: string): ParsedMessage {
  const normalized = text.toLowerCase().trim();
  const amount = extractAmount(normalized);
  const date = extractDate(normalized);
  const months = extractMonthsDuration(normalized);
  const category = categorizeText(normalized);

  let intent: Intent = "unknown";

  const isQuestion = QUESTION_MARKERS.some((m) => normalized.includes(m)) && !GOAL_VERBS.some((v) => normalized.includes(v));

  if (isQuestion) {
    intent = "question";
  } else if (GOAL_VERBS.some((v) => normalized.includes(v))) {
    intent = "create_goal";
  } else if (DEBT_VERBS.some((v) => normalized.includes(v))) {
    intent = "create_debt";
  } else if (INVEST_VERBS.some((v) => normalized.includes(v))) {
    intent = "register_investment";
  } else if (INCOME_VERBS.some((v) => normalized.includes(v))) {
    intent = "register_income";
  } else if (EXPENSE_VERBS.some((v) => normalized.includes(v))) {
    intent = "register_expense";
  } else if (amount !== null) {
    // Padrão razoável: menção a valor sem verbo claro é tratada como despesa,
    // já que é o caso de uso mais comum de registro rápido.
    intent = "register_expense";
  } else if (months !== null) {
    intent = "set_goal_deadline";
  }

  return { intent, amount, date, category, description: text.trim(), months };
}

export function transactionTypeForIntent(intent: Intent): TransactionType {
  switch (intent) {
    case "register_income":
      return "income";
    case "register_investment":
      return "investment";
    case "register_debt_payment":
      return "debt_payment";
    default:
      return "expense";
  }
}
