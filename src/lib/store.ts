import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppState,
  Budget,
  CategoryKey,
  Debt,
  Goal,
  RecurringTransaction,
  Settings,
  Transaction,
  ChatMessage,
} from "./types";
import { EMPTY_STATE } from "./seed";
import { genId } from "./id";
import { profileScopedKey } from "./profiles";
import { nowISO, todayISO } from "./format";
import { computeHealthScore } from "./engine/health";
import { getBalance, getTotalInvested, getTotalSaved, getTotalDebtRemaining } from "./engine/selectors";

export interface OnboardingFixedExpense {
  category: CategoryKey;
  description: string;
  amount: number;
}

export interface OnboardingGoalInput {
  name: string;
  kind: Goal["kind"];
  targetAmount: number;
  targetDate?: string;
  currentAmount?: number;
}

export interface OnboardingDebtInput {
  creditor: string;
  totalAmount: number;
  remainingAmount: number;
  installmentAmount: number;
  installmentsTotal: number;
  installmentsPaid: number;
  interestRateMonthly: number;
  dueDay: number;
}

export interface OnboardingPayload {
  displayName: string;
  monthlyIncomeExpected: number;
  incomeFrequency: Settings["incomeFrequency"];
  paydays: number[];
  fixedExpenses: OnboardingFixedExpense[];
  variableExpenses: OnboardingFixedExpense[];
  debts: OnboardingDebtInput[];
  currentSavings: number;
  currentInvested: number;
  goals: OnboardingGoalInput[];
}

interface StoreActions {
  hydrated: boolean;
  setHydrated: () => void;

  completeOnboarding: (payload: OnboardingPayload) => void;

  addTransaction: (input: Omit<Transaction, "id" | "createdAt">) => Transaction;
  updateTransaction: (id: string, changes: Partial<Omit<Transaction, "id">>) => void;
  deleteTransaction: (id: string) => void;

  addGoal: (input: Omit<Goal, "id" | "createdAt">) => Goal;
  updateGoal: (id: string, changes: Partial<Omit<Goal, "id">>) => void;
  deleteGoal: (id: string) => void;
  completeGoal: (id: string) => void;

  addDebt: (input: Omit<Debt, "id" | "createdAt">) => Debt;
  updateDebt: (id: string, changes: Partial<Omit<Debt, "id">>) => void;
  deleteDebt: (id: string) => void;

  setBudget: (category: CategoryKey, monthlyLimit: number) => void;
  setBudgets: (budgets: Budget[]) => void;

  addRecurring: (input: Omit<RecurringTransaction, "id" | "createdAt">) => RecurringTransaction;
  updateRecurring: (id: string, changes: Partial<Omit<RecurringTransaction, "id">>) => void;
  deleteRecurring: (id: string) => void;

  updateSettings: (changes: Partial<Settings>) => void;
  setPinHash: (hash: string | undefined) => void;

  addChatMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => ChatMessage;
  clearChat: () => void;

  takeSnapshotIfNeeded: () => void;
  markNotificationsRead: () => void;

  resetAllData: () => void;
  importState: (state: AppState) => void;
}

export type Store = AppState & StoreActions;

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      completeOnboarding: (payload) => {
        const now = nowISO();
        const budgets: Budget[] = [...payload.fixedExpenses, ...payload.variableExpenses].reduce<Budget[]>(
          (acc, item) => {
            const existing = acc.find((b) => b.category === item.category);
            if (existing) existing.monthlyLimit += item.amount;
            else acc.push({ category: item.category, monthlyLimit: item.amount });
            return acc;
          },
          []
        );

        const goals: Goal[] = payload.goals.map((g, index) => ({
          id: genId("goal"),
          name: g.name,
          kind: g.kind,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount ?? 0,
          targetDate: g.targetDate,
          createdAt: now,
          priority: index + 1,
        }));

        const debts: Debt[] = payload.debts.map((d) => ({
          id: genId("debt"),
          creditor: d.creditor,
          totalAmount: d.totalAmount,
          remainingAmount: d.remainingAmount,
          installmentAmount: d.installmentAmount,
          interestRateMonthly: d.interestRateMonthly,
          dueDay: d.dueDay,
          installmentsTotal: d.installmentsTotal,
          installmentsPaid: d.installmentsPaid,
          createdAt: now,
        }));

        set({
          settings: {
            ...get().settings,
            onboardingComplete: true,
            displayName: payload.displayName,
            monthlyIncomeExpected: payload.monthlyIncomeExpected,
            incomeFrequency: payload.incomeFrequency,
            paydays: payload.paydays.length > 0 ? payload.paydays : [5],
            initialBalance: payload.currentSavings,
            initialInvested: payload.currentInvested,
          },
          budgets,
          goals,
          debts,
        });
      },

      addTransaction: (input) => {
        const tx: Transaction = { ...input, id: genId("tx"), createdAt: nowISO() };
        set((state) => ({ transactions: [tx, ...state.transactions] }));
        return tx;
      },

      updateTransaction: (id, changes) => {
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...changes } : t)),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
      },

      addGoal: (input) => {
        const goal: Goal = { ...input, id: genId("goal"), createdAt: nowISO() };
        set((state) => ({ goals: [...state.goals, goal] }));
        return goal;
      },

      updateGoal: (id, changes) => {
        set((state) => ({ goals: state.goals.map((g) => (g.id === id ? { ...g, ...changes } : g)) }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          transactions: state.transactions.map((t) => (t.goalId === id ? { ...t, goalId: undefined } : t)),
        }));
      },

      completeGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, completedAt: todayISO() } : g)),
        }));
      },

      addDebt: (input) => {
        const debt: Debt = { ...input, id: genId("debt"), createdAt: nowISO() };
        set((state) => ({ debts: [...state.debts, debt] }));
        return debt;
      },

      updateDebt: (id, changes) => {
        set((state) => ({ debts: state.debts.map((d) => (d.id === id ? { ...d, ...changes } : d)) }));
      },

      deleteDebt: (id) => {
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
          transactions: state.transactions.map((t) => (t.debtId === id ? { ...t, debtId: undefined } : t)),
        }));
      },

      setBudget: (category, monthlyLimit) => {
        set((state) => {
          const exists = state.budgets.some((b) => b.category === category);
          return {
            budgets: exists
              ? state.budgets.map((b) => (b.category === category ? { ...b, monthlyLimit } : b))
              : [...state.budgets, { category, monthlyLimit }],
          };
        });
      },

      setBudgets: (budgets) => set({ budgets }),

      addRecurring: (input) => {
        const item: RecurringTransaction = { ...input, id: genId("rec"), createdAt: nowISO() };
        set((state) => ({ recurring: [...state.recurring, item] }));
        return item;
      },

      updateRecurring: (id, changes) => {
        set((state) => ({ recurring: state.recurring.map((r) => (r.id === id ? { ...r, ...changes } : r)) }));
      },

      deleteRecurring: (id) => {
        set((state) => ({ recurring: state.recurring.filter((r) => r.id !== id) }));
      },

      updateSettings: (changes) => {
        set((state) => ({ settings: { ...state.settings, ...changes } }));
      },

      setPinHash: (hash) => {
        set((state) => ({ settings: { ...state.settings, pinHash: hash, pinEnabled: !!hash } }));
      },

      addChatMessage: (message) => {
        const msg: ChatMessage = { ...message, id: genId("msg"), createdAt: nowISO() };
        set((state) => ({ chatMessages: [...state.chatMessages, msg] }));
        return msg;
      },

      clearChat: () => set({ chatMessages: [] }),

      takeSnapshotIfNeeded: () => {
        const state = get();
        const today = todayISO();
        const already = state.snapshots.some((s) => s.date === today);
        if (already) return;
        const health = computeHealthScore(state);
        set((s) => ({
          snapshots: [
            ...s.snapshots,
            {
              date: today,
              balance: getBalance(state),
              totalIncome: state.transactions.filter((t) => t.type === "income" && t.date === today).reduce((a, t) => a + t.amount, 0),
              totalExpense: state.transactions.filter((t) => t.type === "expense" && t.date === today).reduce((a, t) => a + t.amount, 0),
              totalSaved: getTotalSaved(state),
              totalInvested: getTotalInvested(state),
              totalDebt: getTotalDebtRemaining(state),
              healthScore: health.score,
            },
          ],
        }));
      },

      markNotificationsRead: () => {
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
      },

      resetAllData: () => set({ ...EMPTY_STATE, hydrated: true }),

      importState: (state) => set({ ...state, hydrated: true }),
    }),
    {
      name: "gfi-storage",
      // Cada pessoa (perfil) tem seu próprio espaço isolado no localStorage,
      // resolvido em tempo de leitura/escrita para funcionar com a troca de perfil.
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(profileScopedKey(name)),
        setItem: (name, value) => localStorage.setItem(profileScopedKey(name), value),
        removeItem: (name) => localStorage.removeItem(profileScopedKey(name)),
      })),
      skipHydration: true,
      partialize: (state) => {
        const { hydrated: _hydrated, ...rest } = state;
        void _hydrated;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
