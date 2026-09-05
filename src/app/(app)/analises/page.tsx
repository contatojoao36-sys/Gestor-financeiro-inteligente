"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetCategoryCard } from "@/components/budget-category-card";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { useAppStore } from "@/lib/store";
import { useFinancialData } from "@/lib/hooks/use-financial-data";
import { getMonthlySeries } from "@/lib/engine/selectors";
import { analyzeBudget } from "@/lib/engine/budget";
import { formatCurrency } from "@/lib/format";
import type { AppState } from "@/lib/types";

export default function AnalisesPage() {
  const state = useAppStore((s) => s) as AppState;
  const { categorySpendMap, projection, recurring, anomalies, trend, opportunities } = useFinancialData();

  const series = getMonthlySeries(state, 6);
  const budgetAnalyses = state.budgets.filter((b) => b.monthlyLimit > 0).map((b) => analyzeBudget(state, b));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold">Análises</h1>

      <Tabs defaultValue="orcamento">
        <TabsList>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="inteligencia">Inteligência</TabsTrigger>
        </TabsList>

        <TabsContent value="orcamento">
          {budgetAnalyses.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted">
                Nenhum orçamento definido ainda. Configure limites por categoria em Configurações.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {budgetAnalyses.map((a) => (
                <BudgetCategoryCard key={a.budget.category} analysis={a} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="graficos" className="space-y-6">
          <Card>
            <CardContent className="py-5">
              <p className="mb-3 text-sm font-medium">Receitas x despesas (6 meses)</p>
              <IncomeExpenseChart data={series} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <p className="mb-3 text-sm font-medium">Gastos por categoria (mês atual)</p>
              <CategoryPieChart data={categorySpendMap} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <p className="mb-1 text-sm font-medium">Projeção futura</p>
              <p className="mb-3 text-xs text-muted">Estimativa com base no seu ritmo médio recente — não é garantia.</p>
              <ProjectionChart data={projection} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inteligencia" className="space-y-4">
          <InsightSection title="Gastos recorrentes detectados">
            {recurring.length === 0 ? (
              <EmptyInsight text="Ainda não identifiquei padrões recorrentes suficientes." />
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {recurring.slice(0, 8).map((r) => (
                  <Card key={r.description}>
                    <CardContent className="flex items-center justify-between py-3 text-sm">
                      <span className="capitalize">{r.description}</span>
                      <span className="font-medium">{formatCurrency(r.avgAmount)}/mês</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </InsightSection>

          <InsightSection title="Gastos anormais">
            {anomalies.length === 0 ? (
              <EmptyInsight text="Nenhum gasto fora do padrão este mês." />
            ) : (
              <div className="space-y-2">
                {anomalies.map((a) => (
                  <Card key={a.category}><CardContent className="py-3 text-sm">⚠️ {a.message}</CardContent></Card>
                ))}
              </div>
            )}
          </InsightSection>

          <InsightSection title="Tendência">
            <Card><CardContent className="py-3 text-sm">{trend.direction === "up" ? "📈" : trend.direction === "down" ? "📉" : "➖"} {trend.message}</CardContent></Card>
          </InsightSection>

          <InsightSection title="Oportunidades">
            {opportunities.length === 0 ? (
              <EmptyInsight text="Sem oportunidades claras de aceleração no momento." />
            ) : (
              <div className="space-y-2">
                {opportunities.map((o, i) => (
                  <Card key={i}><CardContent className="py-3 text-sm">💡 {o.message}</CardContent></Card>
                ))}
              </div>
            )}
          </InsightSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InsightSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      {children}
    </div>
  );
}

function EmptyInsight({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="py-6 text-center text-sm text-muted">{text}</CardContent>
    </Card>
  );
}
