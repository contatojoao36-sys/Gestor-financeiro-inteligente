import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CATEGORIES } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import type { BudgetAnalysis } from "@/lib/engine/budget";

export function BudgetCategoryCard({ analysis }: { analysis: BudgetAnalysis }) {
  const { budget, spent, remaining, pctUsed, projectedClosing } = analysis;
  const cat = CATEGORIES[budget.category];
  const color = pctUsed >= 100 ? "bg-danger" : pctUsed >= 80 ? "bg-warning" : "bg-primary";

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{cat.label}</p>
          <p className="text-xs text-muted">{formatCurrency(spent)} / {formatCurrency(budget.monthlyLimit)}</p>
        </div>
        <Progress value={Math.min(pctUsed, 100)} colorClassName={color} />
        <div className="flex justify-between text-xs text-muted">
          <span>{remaining >= 0 ? `${formatCurrency(remaining)} restante` : `${formatCurrency(Math.abs(remaining))} acima`}</span>
          <span>{pctUsed.toFixed(0)}% utilizado</span>
        </div>
        <p className="text-xs text-muted">Previsão de fechamento: {formatCurrency(projectedClosing)}</p>
      </CardContent>
    </Card>
  );
}
