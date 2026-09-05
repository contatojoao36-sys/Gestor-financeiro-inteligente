// Modelo de dados central do Gestor Financeiro Pessoal Inteligente.
// Tudo é armazenado localmente (localStorage) via src/lib/store.ts,
// mas as entidades foram desenhadas para mapear 1:1 para tabelas reais
// (Postgres/Supabase) caso o backend seja adicionado no futuro.

export type ID = string;

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "investment"
  | "debt_payment";

export type CategoryKey =
  | "moradia"
  | "alimentacao"
  | "transporte"
  | "saude"
  | "educacao"
  | "lazer"
  | "assinaturas"
  | "compras"
  | "dividas"
  | "investimentos"
  | "reserva"
  | "receita"
  | "outros";

export interface Category {
  key: CategoryKey;
  label: string;
  icon: string; // lucide icon name
  color: string; // hsl token
  type: "expense" | "income" | "neutral";
}

export interface Transaction {
  id: ID;
  type: TransactionType;
  amount: number; // sempre positivo; o sinal é dado por `type`
  category: CategoryKey;
  subcategory?: string;
  description: string;
  date: string; // ISO yyyy-MM-dd
  createdAt: string; // ISO datetime
  goalId?: ID; // se a transação foi um aporte para uma meta
  debtId?: ID; // se foi pagamento de dívida
  source?: "manual" | "chat" | "recurring" | "onboarding" | "distribution";
  notes?: string;
}

export interface Budget {
  category: CategoryKey;
  monthlyLimit: number;
}

export type GoalKind =
  | "purchase"
  | "reserve"
  | "travel"
  | "investment"
  | "debt_free"
  | "custom";

export interface Goal {
  id: ID;
  name: string;
  kind: GoalKind;
  targetAmount: number;
  /** Valor base já acumulado antes de qualquer aporte registrado no app (ex.: informado no onboarding).
   *  O valor "atual" real é sempre `currentAmount + aportes (transactions tipo transfer vinculadas)` —
   *  use `getGoalCurrentAmount()` em vez de ler este campo diretamente. */
  currentAmount: number;
  targetDate?: string; // ISO date, prazo desejado pelo usuário (opcional)
  createdAt: string;
  monthlyAllocation?: number; // aporte mensal planejado manualmente (opcional)
  priority: number; // 1 = mais prioritária
  archived?: boolean;
  completedAt?: string;
}

export type DebtPriorityStrategy = "avalanche" | "snowball";

export interface Debt {
  id: ID;
  creditor: string;
  totalAmount: number;
  /** Valor restante base no momento do cadastro/edição. O saldo real é
   *  `remainingAmount - pagamentos (transactions tipo debt_payment vinculadas)` —
   *  use `getDebtRemainingAmount()` em vez de ler este campo diretamente. */
  remainingAmount: number;
  installmentAmount: number;
  interestRateMonthly: number; // % a.m.
  dueDay: number; // dia do mês do vencimento
  installmentsTotal: number;
  installmentsPaid: number;
  createdAt: string;
  closedAt?: string;
}

export type RecurrenceFrequency = "monthly" | "weekly" | "biweekly" | "yearly";

export interface RecurringTransaction {
  id: ID;
  type: TransactionType;
  amount: number;
  category: CategoryKey;
  description: string;
  frequency: RecurrenceFrequency;
  dayOfMonth?: number; // para monthly/yearly
  weekday?: number; // 0-6 para weekly/biweekly
  active: boolean;
  createdAt: string;
  lastGeneratedDate?: string;
}

export interface FinancialSnapshot {
  date: string; // ISO date (fim do dia)
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalSaved: number;
  totalInvested: number;
  totalDebt: number;
  healthScore: number;
}

export type NotificationLevel = "info" | "success" | "warning" | "danger";

export interface Notification {
  id: ID;
  level: NotificationLevel;
  icon: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  category?: "budget" | "goal" | "debt" | "trend" | "system";
}

export type IncomeFrequency = "fixed" | "variable";

export interface Settings {
  onboardingComplete: boolean;
  currency: "BRL";
  theme: "light" | "dark" | "system";
  monthlyIncomeExpected: number;
  incomeFrequency: IncomeFrequency;
  paydays: number[]; // dias do mês em que costuma receber
  pinHash?: string; // proteção local opcional (SHA-256 hex)
  pinEnabled: boolean;
  displayName: string;
  createdAt: string;
  /** Saldo em conta já existente antes de começar a usar o app (baseline do onboarding). */
  initialBalance: number;
  /** Valor já investido antes de começar a usar o app (baseline do onboarding). */
  initialInvested: number;
}

export interface ChatMessage {
  id: ID;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  meta?: {
    intent?: string;
    createdTransactionId?: ID;
  };
}

export interface AppState {
  settings: Settings;
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  recurring: RecurringTransaction[];
  snapshots: FinancialSnapshot[];
  notifications: Notification[];
  chatMessages: ChatMessage[];
}
