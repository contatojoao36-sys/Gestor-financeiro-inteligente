"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { GoalStatusBadge } from "./goal-status-badge";
import type { GoalAnalysis } from "@/lib/engine/goals";
import { formatCurrency, formatDateLong } from "@/lib/format";

const PROGRESS_COLOR: Record<string, string> = {
  on_track: "bg-success",
  attention: "bg-warning",
  late: "bg-danger",
  done: "bg-success",
  no_data: "bg-muted",
};

export function GoalProgressCard({ analysis, compact }: { analysis: GoalAnalysis; compact?: boolean }) {
  const { goal, remaining, pctComplete, status, projectedCompletionDate, requiredMonthlyForDeadline } = analysis;

  return (
    <Card>
      <CardContent className={compact ? "space-y-3 p-4" : "space-y-4"}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{goal.name}</p>
            <p className="text-xs text-muted">
              <AnimatedNumber value={goal.targetAmount - remaining} className="font-medium text-foreground" /> de {formatCurrency(goal.targetAmount)}
            </p>
          </div>
          <GoalStatusBadge status={status} />
        </div>

        <div className="space-y-1.5">
          <Progress value={pctComplete} colorClassName={PROGRESS_COLOR[status]} />
          <div className="flex justify-between text-xs text-muted">
            <span>{pctComplete.toFixed(0)}% concluído</span>
            <span>Faltam {formatCurrency(remaining)}</span>
          </div>
        </div>

        {!compact && (
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
            <div>
              <p className="text-muted">Previsão de conclusão</p>
              <p className="font-medium">{projectedCompletionDate ? formatDateLong(projectedCompletionDate) : "Sem aportes ainda"}</p>
            </div>
            <div>
              <p className="text-muted">{requiredMonthlyForDeadline ? "Necessário/mês para o prazo" : "Aporte médio atual"}</p>
              <p className="font-medium">
                {formatCurrency(requiredMonthlyForDeadline ?? analysis.monthlyContributionRate)}
              </p>
            </div>
          </div>
        )}

        {!compact && (
          <motion.div whileHover={{ x: 2 }}>
            <Link href={`/metas/${goal.id}`} className="text-xs font-medium text-primary hover:underline">
              Ver detalhes e cenários →
            </Link>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
