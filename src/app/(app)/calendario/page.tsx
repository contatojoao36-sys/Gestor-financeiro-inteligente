"use client";

import * as React from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RecurringFormDialog } from "@/components/recurring-form-dialog";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/format";
import type { RecurringTransaction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CalEvent {
  day: number;
  label: string;
  type: "income" | "bill" | "debt" | "goal";
  amount?: number;
}

const TYPE_DOT: Record<CalEvent["type"], string> = {
  income: "bg-success",
  bill: "bg-warning",
  debt: "bg-danger",
  goal: "bg-primary",
};

const TYPE_LABEL: Record<CalEvent["type"], string> = {
  income: "Recebimento",
  bill: "Conta",
  debt: "Parcela de dívida",
  goal: "Prazo de meta",
};

export default function CalendarioPage() {
  const settings = useAppStore((s) => s.settings);
  const recurring = useAppStore((s) => s.recurring);
  const debts = useAppStore((s) => s.debts);
  const goals = useAppStore((s) => s.goals);
  const updateRecurring = useAppStore((s) => s.updateRecurring);
  const deleteRecurring = useAppStore((s) => s.deleteRecurring);

  const [monthCursor, setMonthCursor] = React.useState(new Date());
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RecurringTransaction | null>(null);
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);

  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDay = React.useMemo(() => {
    const map = new Map<number, CalEvent[]>();
    function push(day: number, ev: CalEvent) {
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(ev);
    }

    for (const p of settings.paydays) {
      push(p, { day: p, label: "Recebimento esperado", type: "income" });
    }
    for (const r of recurring.filter((x) => x.active && x.dayOfMonth)) {
      push(r.dayOfMonth!, { day: r.dayOfMonth!, label: r.description, type: "bill", amount: r.amount });
    }
    for (const d of debts.filter((x) => !x.closedAt)) {
      push(d.dueDay, { day: d.dueDay, label: `Parcela: ${d.creditor}`, type: "debt", amount: d.installmentAmount });
    }
    for (const g of goals.filter((x) => x.targetDate && !x.completedAt)) {
      const date = new Date(g.targetDate! + "T00:00:00");
      if (isSameMonth(date, monthCursor)) {
        push(date.getDate(), { day: date.getDate(), label: `Prazo: ${g.name}`, type: "goal" });
      }
    }
    return map;
  }, [settings.paydays, recurring, debts, goals, monthCursor]);

  const monthEvents = Array.from(eventsByDay.entries())
    .flatMap(([day, evs]) => evs.map((e) => ({ ...e, day })))
    .sort((a, b) => a.day - b.day);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendário financeiro</h1>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Conta fixa
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setMonthCursor((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="font-medium capitalize">{format(monthCursor, "MMMM yyyy", { locale: ptBR })}</p>
            <Button variant="ghost" size="icon" onClick={() => setMonthCursor((m) => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, monthCursor);
              const events = inMonth ? eventsByDay.get(day.getDate()) ?? [] : [];
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day.getDate())}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] text-xs transition-colors",
                    inMonth ? "hover:bg-surface-muted" : "text-muted/40",
                    isToday(day) && "bg-primary/10 font-semibold text-primary",
                    selectedDay === day.getDate() && inMonth && "ring-2 ring-primary"
                  )}
                >
                  {day.getDate()}
                  <div className="flex gap-0.5">
                    {events.slice(0, 3).map((e, i) => (
                      <span key={i} className={cn("h-1.5 w-1.5 rounded-full", TYPE_DOT[e.type])} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Eventos deste mês</h2>
        {monthEvents.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-sm text-muted">Nenhum evento neste mês.</CardContent></Card>
        ) : (
          <Card className="divide-y divide-border">
            {monthEvents.map((e, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", TYPE_DOT[e.type])} />
                  <span>Dia {e.day} · {e.label}</span>
                </div>
                <span className="text-xs text-muted">{TYPE_LABEL[e.type]}{e.amount ? ` · ${formatCurrency(e.amount)}` : ""}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {recurring.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted">Contas fixas cadastradas</h2>
          <Card className="divide-y divide-border">
            {recurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.description}</p>
                  <p className="text-xs text-muted">Dia {r.dayOfMonth} · {formatCurrency(r.amount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={r.active} onCheckedChange={(v) => updateRecurring(r.id, { active: v })} />
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteRecurring(r.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      <RecurringFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </div>
  );
}
