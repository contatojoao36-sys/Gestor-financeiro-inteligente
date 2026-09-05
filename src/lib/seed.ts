import type { AppState, Settings } from "./types";
import { nowISO } from "./format";

export const DEFAULT_SETTINGS: Settings = {
  onboardingComplete: false,
  currency: "BRL",
  theme: "system",
  monthlyIncomeExpected: 0,
  incomeFrequency: "fixed",
  paydays: [5],
  pinEnabled: false,
  displayName: "",
  createdAt: nowISO(),
  initialBalance: 0,
  initialInvested: 0,
};

export const EMPTY_STATE: AppState = {
  settings: DEFAULT_SETTINGS,
  transactions: [],
  budgets: [],
  goals: [],
  debts: [],
  recurring: [],
  snapshots: [],
  notifications: [],
  chatMessages: [],
};
