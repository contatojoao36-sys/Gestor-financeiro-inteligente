"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLOR_PRIMARY, COLOR_SUCCESS } from "@/lib/chart-colors";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import type { ProjectionPoint } from "@/lib/engine/projections";

export function ProjectionChart({ data }: { data: ProjectionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted)" />
        <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted)" tickFormatter={(v) => formatCompactCurrency(v)} width={56} />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
        />
        <Line type="monotone" dataKey="balance" name="Saldo" stroke={COLOR_PRIMARY} strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="netWorth" name="Patrimônio líquido" stroke={COLOR_SUCCESS} strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  );
}
