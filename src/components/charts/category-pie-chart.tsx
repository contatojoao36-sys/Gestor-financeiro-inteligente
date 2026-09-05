"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORIES } from "@/lib/categories";
import { CHART_PALETTE } from "@/lib/chart-colors";
import { formatCurrency } from "@/lib/format";
import type { CategoryKey } from "@/lib/types";

interface Props {
  data: Record<string, number>;
}

export function CategoryPieChart({ data }: Props) {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ key: key as CategoryKey, name: CATEGORIES[key as CategoryKey].label, value }));

  if (entries.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">Sem gastos registrados neste período.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={entries} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {entries.map((e) => (
            <Cell key={e.key} fill={CHART_PALETTE[e.key]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
