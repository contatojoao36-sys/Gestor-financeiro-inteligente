"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, PlusCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GoalStatusBadge } from "@/components/goals/goal-status-badge";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { useAppStore } from "@/lib/store";
import { analyzeGoal, buildGoalScenarios } from "@/lib/engine/goals";
import { getGoalCurrentAmount } from "@/lib/engine/selectors";
import { formatCurrency, formatDateLong, todayISO } from "@/lib/format";
import type { AppState } from "@/lib/types";

const SCENARIO_LABEL: Record<string, string> = { atual: "Cenário atual", economico: "Cenário econômico", agressivo: "Cenário agressivo" };

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const state = useAppStore((s) => s) as AppState;
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const completeGoal = useAppStore((s) => s.completeGoal);
  const addTransaction = useAppStore((s) => s.addTransaction);

  const [editOpen, setEditOpen] = React.useState(false);
  const [contribOpen, setContribOpen] = React.useState(false);
  const [contribAmount, setContribAmount] = React.useState("");

  const goal = state.goals.find((g) => g.id === params.id);

  if (!goal) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-center">
        <p className="text-muted">Meta não encontrada.</p>
        <Button variant="outline" onClick={() => router.push("/metas")}>Voltar para Metas</Button>
      </div>
    );
  }

  const analysis = analyzeGoal(state, goal);
  const scenarios = buildGoalScenarios(state, goal);
  const contributions = state.transactions
    .filter((t) => t.goalId === goal.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(contribAmount.replace(",", "."));
    if (!value || value <= 0 || !goal) {
      toast.error("Informe um valor válido.");
      return;
    }
    addTransaction({
      type: "transfer",
      amount: value,
      category: "reserva",
      description: `Aporte para "${goal.name}"`,
      date: todayISO(),
      goalId: goal.id,
      source: "manual",
    });
    toast.success(`Aporte de ${formatCurrency(value)} registrado.`);
    setContribOpen(false);
    setContribAmount("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 md:px-8 md:py-8">
      <Button variant="ghost" size="sm" onClick={() => router.push("/metas")}>
        <ArrowLeft className="h-4 w-4" /> Metas
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{goal.name}</h1>
          <GoalStatusBadge status={analysis.status} />
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /></Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              deleteGoal(goal.id);
              toast.success("Meta excluída.");
              router.push("/metas");
            }}
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold tabular-nums">{formatCurrency(getGoalCurrentAmount(state, goal))}</span>
            <span className="text-sm text-muted">de {formatCurrency(goal.targetAmount)}</span>
          </div>
          <Progress value={analysis.pctComplete} />
          <div className="flex justify-between text-xs text-muted">
            <span>{analysis.pctComplete.toFixed(0)}% concluído</span>
            <span>Faltam {formatCurrency(analysis.remaining)}</span>
          </div>
          {analysis.idealPctNow !== null && (
            <p className="text-xs text-muted">Progresso ideal até hoje: {analysis.idealPctNow.toFixed(0)}%</p>
          )}
          <div className="flex gap-2 pt-2">
            {analysis.remaining > 0 ? (
              <Button size="sm" onClick={() => setContribOpen(true)}>
                <PlusCircle className="h-4 w-4" /> Registrar aporte
              </Button>
            ) : (
              <Button size="sm" variant="success" onClick={() => { completeGoal(goal.id); toast.success("Meta marcada como concluída! 🎉"); }}>
                <CheckCircle2 className="h-4 w-4" /> Marcar como concluída
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="py-4"><p className="text-xs text-muted">Necessário / mês</p><p className="font-semibold">{formatCurrency(analysis.requiredMonthlyForDeadline ?? analysis.monthlyContributionRate)}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted">Necessário / semana</p><p className="font-semibold">{formatCurrency((analysis.requiredWeeklyForDeadline ?? analysis.monthlyContributionRate / 4.345))}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted">Previsão de conclusão</p><p className="font-semibold">{analysis.projectedCompletionDate ? formatDateLong(analysis.projectedCompletionDate) : "—"}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted">Prazo desejado</p><p className="font-semibold">{goal.targetDate ? formatDateLong(goal.targetDate) : "Sem prazo definido"}</p></CardContent></Card>
      </div>

      {analysis.monthsAheadOrBehind !== null && (
        <Card>
          <CardContent className="py-4 text-sm">
            {analysis.monthsAheadOrBehind >= 0
              ? `📈 No ritmo atual, você concluirá essa meta cerca de ${Math.abs(analysis.monthsAheadOrBehind).toFixed(1)} meses antes do prazo.`
              : `🔴 No ritmo atual, essa meta atrasará aproximadamente ${Math.abs(analysis.monthsAheadOrBehind).toFixed(1)} meses em relação ao prazo desejado.`}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Cenários</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {scenarios.map((s) => (
            <Card key={s.label}>
              <CardContent className="space-y-1 py-4">
                <p className="text-xs text-muted">{SCENARIO_LABEL[s.label]}</p>
                <p className="text-sm">Aporte: <span className="font-semibold">{formatCurrency(s.monthlyAmount)}</span>/mês</p>
                <p className="text-sm text-muted">{s.months !== null ? `${s.months} meses` : "sem previsão"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {contributions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted">Histórico de aportes</h2>
          <Card className="divide-y divide-border">
            {contributions.map((c) => (
              <div key={c.id} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted">{formatDateLong(c.date)}</span>
                <span className="font-medium">{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <GoalFormDialog open={editOpen} onOpenChange={setEditOpen} editing={goal} />

      <Dialog open={contribOpen} onOpenChange={setContribOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar aporte para &quot;{goal.name}&quot;</DialogTitle></DialogHeader>
          <form onSubmit={handleContribute} className="space-y-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input inputMode="decimal" autoFocus value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} placeholder="0,00" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setContribOpen(false)}>Cancelar</Button>
              <Button type="submit">Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
