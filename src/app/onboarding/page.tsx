"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { useAppStore, type OnboardingPayload } from "@/lib/store";
import type { CategoryKey, GoalKind } from "@/lib/types";

interface ExpenseRow {
  id: string;
  category: CategoryKey;
  description: string;
  amount: string;
}

interface DebtRow {
  id: string;
  creditor: string;
  totalAmount: string;
  remainingAmount: string;
  installmentAmount: string;
  installmentsTotal: string;
  installmentsPaid: string;
  interestRateMonthly: string;
  dueDay: string;
}

interface GoalRow {
  id: string;
  name: string;
  kind: GoalKind;
  targetAmount: string;
  targetDate: string;
  currentAmount: string;
}

let rid = 0;
function newId() {
  rid += 1;
  return `row-${rid}`;
}

const GOAL_KIND_LABEL: Record<GoalKind, string> = {
  purchase: "Compra",
  reserve: "Reserva de emergência",
  travel: "Viagem",
  investment: "Investimento",
  debt_free: "Quitar dívidas",
  custom: "Outro",
};

const TOTAL_STEPS = 8;

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const onboardingComplete = useAppStore((s) => s.settings.onboardingComplete);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = React.useState(0);
  const [displayName, setDisplayName] = React.useState("");
  const [monthlyIncomeExpected, setMonthlyIncomeExpected] = React.useState("");
  const [incomeFrequency, setIncomeFrequency] = React.useState<"fixed" | "variable">("fixed");
  const [paydaysText, setPaydaysText] = React.useState("5");
  const [fixedExpenses, setFixedExpenses] = React.useState<ExpenseRow[]>([
    { id: newId(), category: "moradia", description: "Aluguel/Financiamento", amount: "" },
  ]);
  const [variableExpenses, setVariableExpenses] = React.useState<ExpenseRow[]>([
    { id: newId(), category: "alimentacao", description: "Mercado e restaurantes", amount: "" },
  ]);
  const [debts, setDebts] = React.useState<DebtRow[]>([]);
  const [currentSavings, setCurrentSavings] = React.useState("");
  const [currentInvested, setCurrentInvested] = React.useState("");
  const [goals, setGoals] = React.useState<GoalRow[]>([
    { id: newId(), name: "Reserva de emergência", kind: "reserve", targetAmount: "", targetDate: "", currentAmount: "" },
  ]);

  React.useEffect(() => {
    if (hydrated && onboardingComplete) router.replace("/");
  }, [hydrated, onboardingComplete, router]);

  function updateRow<T extends { id: string }>(list: T[], setList: (v: T[]) => void, id: string, changes: Partial<T>) {
    setList(list.map((row) => (row.id === id ? { ...row, ...changes } : row)));
  }

  function totalOf(rows: ExpenseRow[]) {
    return rows.reduce((s, r) => s + (parseFloat(r.amount.replace(",", ".")) || 0), 0);
  }

  const income = parseFloat(monthlyIncomeExpected.replace(",", ".")) || 0;
  const totalFixed = totalOf(fixedExpenses);
  const totalVariable = totalOf(variableExpenses);
  const estimatedCapacity = Math.max(income - totalFixed - totalVariable, 0);

  function finish() {
    const payload: OnboardingPayload = {
      displayName: displayName.trim() || "Você",
      monthlyIncomeExpected: income,
      incomeFrequency,
      paydays: paydaysText
        .split(",")
        .map((d) => parseInt(d.trim(), 10))
        .filter((d) => !isNaN(d) && d >= 1 && d <= 31),
      fixedExpenses: fixedExpenses
        .filter((r) => parseFloat(r.amount) > 0)
        .map((r) => ({ category: r.category, description: r.description || CATEGORIES[r.category].label, amount: parseFloat(r.amount.replace(",", ".")) || 0 })),
      variableExpenses: variableExpenses
        .filter((r) => parseFloat(r.amount) > 0)
        .map((r) => ({ category: r.category, description: r.description || CATEGORIES[r.category].label, amount: parseFloat(r.amount.replace(",", ".")) || 0 })),
      debts: debts
        .filter((d) => d.creditor.trim() && parseFloat(d.remainingAmount) > 0)
        .map((d) => ({
          creditor: d.creditor,
          totalAmount: parseFloat(d.totalAmount.replace(",", ".")) || parseFloat(d.remainingAmount.replace(",", ".")) || 0,
          remainingAmount: parseFloat(d.remainingAmount.replace(",", ".")) || 0,
          installmentAmount: parseFloat(d.installmentAmount.replace(",", ".")) || 0,
          installmentsTotal: parseInt(d.installmentsTotal, 10) || 1,
          installmentsPaid: parseInt(d.installmentsPaid, 10) || 0,
          interestRateMonthly: parseFloat(d.interestRateMonthly.replace(",", ".")) || 0,
          dueDay: parseInt(d.dueDay, 10) || 10,
        })),
      currentSavings: parseFloat(currentSavings.replace(",", ".")) || 0,
      currentInvested: parseFloat(currentInvested.replace(",", ".")) || 0,
      goals: goals
        .filter((g) => g.name.trim() && parseFloat(g.targetAmount) > 0)
        .map((g) => ({
          name: g.name,
          kind: g.kind,
          targetAmount: parseFloat(g.targetAmount.replace(",", ".")) || 0,
          targetDate: g.targetDate || undefined,
          currentAmount: parseFloat(g.currentAmount.replace(",", ".")) || 0,
        })),
    };
    completeOnboarding(payload);
    router.replace("/");
  }

  const canAdvance = (() => {
    if (step === 0) return displayName.trim().length > 0;
    if (step === 1) return income > 0;
    return true;
  })();

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet2 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Gestor Financeiro Inteligente</p>
          <p className="text-xs text-muted">Vamos montar seu planejamento em {TOTAL_STEPS} passos rápidos</p>
        </div>
      </div>

      <div className="mb-8 flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-surface-muted"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5"
        >
          {step === 0 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Como podemos te chamar?</h1>
              <p className="text-sm text-muted">Isso personaliza suas recomendações no dia a dia.</p>
              <Input autoFocus value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Quanto você recebe por mês?</h1>
              <div className="space-y-2">
                <Label>Renda mensal esperada</Label>
                <Input inputMode="decimal" value={monthlyIncomeExpected} onChange={(e) => setMonthlyIncomeExpected(e.target.value)} placeholder="Ex: 4000" />
              </div>
              <div className="space-y-2">
                <Label>Sua renda é fixa ou variável?</Label>
                <Select value={incomeFrequency} onValueChange={(v) => setIncomeFrequency(v as "fixed" | "variable")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixa</SelectItem>
                    <SelectItem value="variable">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Em quais dias normalmente recebe? (separe por vírgula)</Label>
                <Input value={paydaysText} onChange={(e) => setPaydaysText(e.target.value)} placeholder="Ex: 5, 20" />
              </div>
            </div>
          )}

          {step === 2 && (
            <ExpenseStep
              title="Quais são seus gastos fixos?"
              subtitle="Aluguel, contas, assinaturas — o que se repete todo mês."
              rows={fixedExpenses}
              setRows={setFixedExpenses}
              updateRow={(id, c) => updateRow(fixedExpenses, setFixedExpenses, id, c)}
            />
          )}

          {step === 3 && (
            <ExpenseStep
              title="Quais são seus gastos variáveis?"
              subtitle="Alimentação, transporte, lazer — estimativa mensal média."
              rows={variableExpenses}
              setRows={setVariableExpenses}
              updateRow={(id, c) => updateRow(variableExpenses, setVariableExpenses, id, c)}
            />
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Você possui dívidas?</h1>
              <p className="text-sm text-muted">Se não tiver, pode pular esta etapa.</p>
              <div className="space-y-3">
                {debts.map((d) => (
                  <div key={d.id} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
                    <div className="flex items-center justify-between">
                      <Input
                        className="mr-2"
                        placeholder="Credor (ex: Cartão Nubank)"
                        value={d.creditor}
                        onChange={(e) => updateRow(debts, setDebts, d.id, { creditor: e.target.value })}
                      />
                      <Button variant="ghost" size="icon" onClick={() => setDebts(debts.filter((x) => x.id !== d.id))}>
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input inputMode="decimal" placeholder="Valor restante" value={d.remainingAmount} onChange={(e) => updateRow(debts, setDebts, d.id, { remainingAmount: e.target.value })} />
                      <Input inputMode="decimal" placeholder="Valor da parcela" value={d.installmentAmount} onChange={(e) => updateRow(debts, setDebts, d.id, { installmentAmount: e.target.value })} />
                      <Input inputMode="numeric" placeholder="Parcelas restantes" value={d.installmentsTotal} onChange={(e) => updateRow(debts, setDebts, d.id, { installmentsTotal: e.target.value })} />
                      <Input inputMode="numeric" placeholder="Dia de vencimento" value={d.dueDay} onChange={(e) => updateRow(debts, setDebts, d.id, { dueDay: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDebts([
                    ...debts,
                    { id: newId(), creditor: "", totalAmount: "", remainingAmount: "", installmentAmount: "", installmentsTotal: "1", installmentsPaid: "0", interestRateMonthly: "0", dueDay: "10" },
                  ])
                }
              >
                <Plus className="h-4 w-4" /> Adicionar dívida
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Reserva e investimentos</h1>
              <div className="space-y-2">
                <Label>Quanto você possui atualmente guardado?</Label>
                <Input inputMode="decimal" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} placeholder="Ex: 2000" />
              </div>
              <div className="space-y-2">
                <Label>Possui investimentos? Quanto, aproximadamente?</Label>
                <Input inputMode="decimal" value={currentInvested} onChange={(e) => setCurrentInvested(e.target.value)} placeholder="Ex: 5000" />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Quais são seus objetivos financeiros?</h1>
              <div className="space-y-3">
                {goals.map((g) => (
                  <div key={g.id} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Input placeholder="Nome da meta" value={g.name} onChange={(e) => updateRow(goals, setGoals, g.id, { name: e.target.value })} />
                      <Button variant="ghost" size="icon" onClick={() => setGoals(goals.filter((x) => x.id !== g.id))}>
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={g.kind} onValueChange={(v) => updateRow(goals, setGoals, g.id, { kind: v as GoalKind })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(GOAL_KIND_LABEL) as GoalKind[]).map((k) => (
                            <SelectItem key={k} value={k}>{GOAL_KIND_LABEL[k]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input inputMode="decimal" placeholder="Valor da meta" value={g.targetAmount} onChange={(e) => updateRow(goals, setGoals, g.id, { targetAmount: e.target.value })} />
                      <Input type="date" value={g.targetDate} onChange={(e) => updateRow(goals, setGoals, g.id, { targetDate: e.target.value })} />
                      <Input inputMode="decimal" placeholder="Já possui (opcional)" value={g.currentAmount} onChange={(e) => updateRow(goals, setGoals, g.id, { currentAmount: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGoals([...goals, { id: newId(), name: "", kind: "custom", targetAmount: "", targetDate: "", currentAmount: "" }])}
              >
                <Plus className="h-4 w-4" /> Adicionar meta
              </Button>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Tudo pronto, {displayName || "Você"}!</h1>
              <p className="text-sm text-muted">Aqui está o resumo do que vamos montar para você:</p>
              <div className="space-y-2 rounded-[var(--radius-md)] border border-border p-4 text-sm">
                <Row label="Renda mensal esperada" value={formatCurrency(income)} />
                <Row label="Gastos fixos" value={formatCurrency(totalFixed)} />
                <Row label="Gastos variáveis" value={formatCurrency(totalVariable)} />
                <Row label="Capacidade estimada de poupança" value={formatCurrency(estimatedCapacity)} highlight />
                <Row label="Metas cadastradas" value={String(goals.filter((g) => g.name.trim() && parseFloat(g.targetAmount) > 0).length)} />
                <Row label="Dívidas cadastradas" value={String(debts.filter((d) => d.creditor.trim()).length)} />
              </div>
              <p className="text-xs text-muted">Você pode ajustar tudo isso depois em Configurações, Metas e Dívidas.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < TOTAL_STEPS - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            Continuar <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={finish} variant="success">
            Concluir <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={highlight ? "font-semibold text-success" : "font-medium"}>{value}</span>
    </div>
  );
}

function ExpenseStep({
  title,
  subtitle,
  rows,
  setRows,
  updateRow,
}: {
  title: string;
  subtitle: string;
  rows: ExpenseRow[];
  setRows: (rows: ExpenseRow[]) => void;
  updateRow: (id: string, changes: Partial<ExpenseRow>) => void;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted">{subtitle}</p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2">
            <Select value={row.category} onValueChange={(v) => updateRow(row.id, { category: v as CategoryKey })}>
              <SelectTrigger className="w-36 shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORIES[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Descrição"
              value={row.description}
              onChange={(e) => updateRow(row.id, { description: e.target.value })}
            />
            <Input
              className="w-28 shrink-0"
              inputMode="decimal"
              placeholder="R$"
              value={row.amount}
              onChange={(e) => updateRow(row.id, { amount: e.target.value })}
            />
            <Button variant="ghost" size="icon" onClick={() => setRows(rows.filter((r) => r.id !== row.id))}>
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setRows([...rows, { id: newId(), category: "outros", description: "", amount: "" }])}
      >
        <Plus className="h-4 w-4" /> Adicionar
      </Button>
    </div>
  );
}
