"use client";

import * as React from "react";
import { Plus, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalProgressCard } from "@/components/goals/goal-progress-card";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { useAppStore } from "@/lib/store";
import { getActiveGoals } from "@/lib/engine/selectors";
import { analyzeGoal } from "@/lib/engine/goals";
import type { AppState } from "@/lib/types";

export default function MetasPage() {
  const state = useAppStore((s) => s) as AppState;
  const [formOpen, setFormOpen] = React.useState(false);

  const activeGoals = getActiveGoals(state);
  const completedGoals = state.goals.filter((g) => g.completedAt);

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Metas</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Nova meta
        </Button>
      </div>

      {activeGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Target className="h-8 w-8 text-muted" />
            <p className="font-medium">Nenhuma meta cadastrada ainda</p>
            <p className="text-sm text-muted">Crie sua primeira meta para eu calcular prazo, aporte mensal e progresso.</p>
            <Button className="mt-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Criar meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activeGoals.map((g) => (
            <GoalProgressCard key={g.id} analysis={analyzeGoal(state, g)} />
          ))}
        </div>
      )}

      {completedGoals.length > 0 && (
        <div className="space-y-2 pt-4">
          <h2 className="text-sm font-semibold text-muted">Concluídas</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {completedGoals.map((g) => (
              <Card key={g.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">{g.name}</span>
                  <span className="text-xs text-success">✅ Concluída</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <GoalFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
