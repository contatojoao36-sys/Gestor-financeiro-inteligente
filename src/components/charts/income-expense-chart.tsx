"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLOR_DANGER, COLOR_SUCCESS } from "@/lib/chart-colors";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

interface Props {
  data: { month: string; income: number; expense: number }[];
}

export function IncomeExpenseChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted)" />
        <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted)" tickFormatter={(v) => formatCompactCurrency(v)} width={56} />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
        />
        <Bar dataKey="income" name="Receitas" fill={COLOR_SUCCESS} radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Despesas" fill={COLOR_DANGER} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
