"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { simulateReach } from "@/lib/engine/goals";
import { useAppStore } from "@/lib/store";

export default function SimuladorPage() {
  const goals = useAppStore((s) => s.goals);
  const [selectedGoalId, setSelectedGoalId] = React.useState<string>("custom");

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);
  const [current, setCurrent] = React.useState(0);
  const [target, setTarget] = React.useState(20000);
  const [monthly, setMonthly] = React.useState(800);

  React.useEffect(() => {
    if (selectedGoal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega valores da meta selecionada no simulador
      setCurrent(selectedGoal.currentAmount);
      setTarget(selectedGoal.targetAmount);
    }
  }, [selectedGoal]);

  const result = simulateReach(current, target, monthly);
  const comparisons = [monthly - 300, monthly, monthly + 300].filter((v) => v > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-xl font-semibold">Simulador</h1>
        <p className="text-sm text-muted">Altere as variáveis e veja o impacto instantaneamente.</p>
      </div>

      <Card>
        <CardContent className="space-y-5 py-5">
          <div className="space-y-2">
            <Label>Simular a partir de</Label>
            <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Valores personalizados</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Valor já acumulado</Label>
              <Input inputMode="decimal" value={current} onChange={(e) => setCurrent(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Valor da meta</Label>
              <Input inputMode="decimal" value={target} onChange={(e) => setTarget(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Aporte mensal</Label>
              <span className="text-sm font-semibold tabular-nums">{formatCurrency(monthly)}</span>
            </div>
            <Slider min={0} max={Math.max(target, 5000)} step={50} value={[monthly]} onValueChange={([v]) => setMonthly(v)} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="space-y-1 py-5 text-center">
          <p className="text-sm text-white/80">Com esse aporte, você atinge a meta em</p>
          <p className="text-3xl font-semibold">{result.months !== null ? `${result.months} meses` : "—"}</p>
          {result.date && <p className="text-sm text-white/80">Por volta de {formatDateLong(result.date)}</p>}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Comparação de cenários</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {comparisons.map((amount) => {
            const r = simulateReach(current, target, amount);
            return (
              <Card key={amount} className={amount === monthly ? "border-primary" : undefined}>
                <CardContent className="space-y-1 py-4 text-center">
                  <p className="text-xs text-muted">Economizando {formatCurrency(amount)}/mês</p>
                  <p className="text-lg font-semibold">{r.months !== null ? `${r.months} meses` : "—"}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
