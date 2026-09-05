"use client";

import { motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, PiggyBank, TrendingUp, CreditCard, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { StatCard } from "@/components/stat-card";
import { QuickAdd } from "@/components/quick-add";
import { GoalProgressCard } from "@/components/goals/goal-progress-card";
import { HealthScoreRing } from "@/components/health-score-ring";
import { AlertItem } from "@/components/alert-item";
import { useFinancialData } from "@/lib/hooks/use-financial-data";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export default function DashboardPage() {
  const name = useAppStore((s) => s.settings.displayName);
  const {
    balance,
    currentMonth,
    totalSaved,
    totalInvested,
    totalDebt,
    mainGoalAnalysis,
    health,
    alerts,
    recommendation,
  } = useFinancialData();

  const greeting = getGreeting();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted">
          {greeting}, {name || "por aqui"} 👋
        </p>
        <h1 className="text-xl font-semibold">Como está sua situação financeira hoje</h1>
      </motion.div>

      <Card className="overflow-hidden bg-gradient-to-br from-primary to-accent text-white">
        <CardContent className="space-y-1 py-6">
          <p className="text-sm text-white/80">Saldo atual</p>
          <AnimatedNumber value={balance} className="text-4xl font-semibold tracking-tight" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Receitas (mês)" value={currentMonth.income} icon={ArrowUpCircle} tone="success" index={0} />
        <StatCard label="Despesas (mês)" value={currentMonth.expense} icon={ArrowDownCircle} tone="danger" index={1} />
        <StatCard label="Economizado" value={totalSaved} icon={PiggyBank} tone="primary" index={2} />
        <StatCard label="Investido" value={totalInvested} icon={TrendingUp} tone="warning" index={3} />
        <StatCard label="Dívidas" value={totalDebt} icon={CreditCard} tone="neutral" index={4} />
      </div>

      <Card>
        <CardContent className="py-4">
          <QuickAdd />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lightbulb className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="text-sm font-medium">O que eu deveria fazer hoje?</p>
            <p className="text-sm text-muted">{recommendation}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        {mainGoalAnalysis ? (
          <GoalProgressCard analysis={mainGoalAnalysis} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="font-medium">Você ainda não tem metas</p>
              <p className="text-sm text-muted">Crie sua primeira meta para acompanhar o progresso aqui.</p>
              <Link href="/metas" className="text-sm font-medium text-primary hover:underline">
                Criar meta →
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted">Saúde financeira</p>
            <HealthScoreRing score={health.score} />
            <p className="text-xs text-muted">
              {health.strengths[0] ?? health.weaknesses[0] ?? "Continue registrando seus dados."}
            </p>
          </CardContent>
        </Card>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted">Alertas e recomendações</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {alerts.slice(0, 6).map((a) => (
              <AlertItem key={a.id} alert={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
