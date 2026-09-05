"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CreditCard, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebtFormDialog } from "@/components/debts/debt-form-dialog";
import { useAppStore } from "@/lib/store";
import { getDebtInstallmentsPaid, getDebtRemainingAmount, trailingAverage } from "@/lib/engine/selectors";
import { formatCurrency, todayISO } from "@/lib/format";
import type { AppState, Debt } from "@/lib/types";

export default function DividasPage() {
  const state = useAppStore((s) => s) as AppState;
  const deleteDebt = useAppStore((s) => s.deleteDebt);
  const addTransaction = useAppStore((s) => s.addTransaction);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Debt | null>(null);

  const openDebts = state.debts.filter((d) => !d.closedAt);
  const totalRemaining = openDebts.reduce((s, d) => s + getDebtRemainingAmount(state, d), 0);
  const totalOriginal = openDebts.reduce((s, d) => s + d.totalAmount, 0);
  const monthlyInstallments = openDebts.reduce((s, d) => s + d.installmentAmount, 0);
  const avgIncome = trailingAverage(state, 3, (t) => t.income) || state.settings.monthlyIncomeExpected;
  const impactPct = avgIncome > 0 ? (monthlyInstallments / avgIncome) * 100 : 0;

  const avalanche = [...openDebts].sort((a, b) => b.interestRateMonthly - a.interestRateMonthly);
  const snowball = [...openDebts].sort((a, b) => getDebtRemainingAmount(state, a) - getDebtRemainingAmount(state, b));

  function payInstallment(debt: Debt) {
    addTransaction({
      type: "debt_payment",
      amount: debt.installmentAmount,
      category: "dividas",
      description: `Parcela de ${debt.creditor}`,
      date: todayISO(),
      debtId: debt.id,
      source: "manual",
    });
    toast.success(`Pagamento de ${formatCurrency(debt.installmentAmount)} registrado para ${debt.creditor}.`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dívidas</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Nova dívida
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><CardContent className="py-4"><p className="text-xs text-muted">Dívida original</p><p className="font-semibold">{formatCurrency(totalOriginal)}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted">Restante</p><p className="font-semibold text-danger">{formatCurrency(totalRemaining)}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted">Parcelas/mês</p><p className="font-semibold">{formatCurrency(monthlyInstallments)}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted">% da renda</p><p className="font-semibold">{impactPct.toFixed(0)}%</p></CardContent></Card>
      </div>

      {impactPct > 30 && openDebts.length > 0 && (
        <Card className="border-danger/40 bg-danger-bg">
          <CardContent className="py-3 text-sm text-danger">
            ⚠️ Suas parcelas de dívida consomem {impactPct.toFixed(0)}% da sua renda média. Isso reduz bastante sua capacidade de poupança — considere priorizar a quitação antes de novos compromissos.
          </CardContent>
        </Card>
      )}

      {openDebts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <CreditCard className="h-8 w-8 text-muted" />
            <p className="font-medium">Nenhuma dívida em aberto</p>
            <p className="text-sm text-muted">Ótimo momento para reforçar sua reserva e investimentos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {openDebts.map((d) => {
            const remaining = getDebtRemainingAmount(state, d);
            const paidInstallments = getDebtInstallmentsPaid(state, d);
            const pct = d.totalAmount > 0 ? ((d.totalAmount - remaining) / d.totalAmount) * 100 : 0;
            return (
              <Card key={d.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{d.creditor}</p>
                      <p className="text-xs text-muted">
                        Parcela {formatCurrency(d.installmentAmount)} · vence dia {d.dueDay} · {d.interestRateMonthly}% a.m.
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { deleteDebt(d.id); toast.success("Dívida removida."); }}>
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={pct} />
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{paidInstallments}/{d.installmentsTotal} parcelas pagas</span>
                    <span>Restam {formatCurrency(remaining)}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => payInstallment(d)}>
                    <CheckCircle2 className="h-4 w-4" /> Registrar pagamento da parcela
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {openDebts.length > 1 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted">Sugestão de prioridade de pagamento</h2>
          <Tabs defaultValue="avalanche">
            <TabsList>
              <TabsTrigger value="avalanche">Maior juros primeiro</TabsTrigger>
              <TabsTrigger value="snowball">Menor saldo primeiro</TabsTrigger>
            </TabsList>
            <TabsContent value="avalanche">
              <PriorityList debts={avalanche} state={state} />
              <p className="mt-2 text-xs text-muted">Reduz o total de juros pagos ao longo do tempo.</p>
            </TabsContent>
            <TabsContent value="snowball">
              <PriorityList debts={snowball} state={state} />
              <p className="mt-2 text-xs text-muted">Gera vitórias rápidas ao eliminar dívidas menores primeiro.</p>
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted">
            Esta é uma sugestão geral de organização, não uma recomendação financeira individualizada — avalie sua situação específica antes de decidir.
          </p>
        </div>
      )}

      <DebtFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </div>
  );
}

function PriorityList({ debts, state }: { debts: Debt[]; state: AppState }) {
  return (
    <div className="space-y-2">
      {debts.map((d, i) => (
        <div key={d.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border p-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="primary">{i + 1}</Badge>
            <span>{d.creditor}</span>
          </div>
          <span className="text-muted">{formatCurrency(getDebtRemainingAmount(state, d))} · {d.interestRateMonthly}% a.m.</span>
        </div>
      ))}
    </div>
  );
}
