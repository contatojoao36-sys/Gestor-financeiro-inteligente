"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wallet, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuickAdd } from "@/components/quick-add";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { useAppStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/categories";
import { formatCurrency, formatDateLong, monthKey } from "@/lib/format";
import type { CategoryKey, Transaction, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<TransactionType, string> = {
  income: "Receita",
  expense: "Despesa",
  transfer: "Transferência",
  investment: "Investimento",
  debt_payment: "Dívida",
};

const TYPE_COLOR: Record<TransactionType, string> = {
  income: "text-success",
  expense: "text-danger",
  transfer: "text-primary",
  investment: "text-warning",
  debt_payment: "text-muted",
};

export default function TransacoesPage() {
  const transactions = useAppStore((s) => s.transactions);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [monthFilter, setMonthFilter] = React.useState<string>("all");

  const months = React.useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const filtered = transactions
    .filter((t) => typeFilter === "all" || t.type === typeFilter)
    .filter((t) => categoryFilter === "all" || t.category === categoryFilter)
    .filter((t) => monthFilter === "all" || monthKey(t.date) === monthFilter)
    .filter((t) => !search || t.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1));

  const grouped = React.useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function handleEdit(t: Transaction) {
    setEditing(t);
    setFormOpen(true);
  }

  function handleDelete(t: Transaction) {
    deleteTransaction(t.id);
    toast.success("Transação removida.", {
      action: { label: "Desfazer", onClick: () => useAppStore.getState().addTransaction(t) },
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transações</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <QuickAdd placeholder='Registre rápido: "Gastei R$ 45 no Uber"' />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar descrição..." className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {(Object.keys(TYPE_LABEL) as TransactionType[]).map((t) => (
              <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {(Object.keys(CATEGORIES) as CategoryKey[]).map((c) => (
              <SelectItem key={c} value={c}>{CATEGORIES[c].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Mês" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Wallet className="h-8 w-8 text-muted" />
            <p className="font-medium">Nenhuma transação encontrada</p>
            <p className="text-sm text-muted">Registre uma transação acima ou ajuste os filtros.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <AnimatePresence initial={false}>
            {grouped.map(([date, txs]) => (
              <motion.div key={date} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{formatDateLong(date)}</p>
                <Card className="divide-y divide-border overflow-hidden">
                  {txs.map((t) => {
                    const cat = CATEGORIES[t.category];
                    const sign = t.type === "income" ? "+" : "-";
                    return (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="group flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.description}</p>
                          <p className="text-xs text-muted">
                            {TYPE_LABEL[t.type]} · {cat.label}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-semibold tabular-nums", TYPE_COLOR[t.type])}>
                            {sign} {formatCurrency(t.amount)}
                          </span>
                          <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t)}>
                              <Trash2 className="h-3.5 w-3.5 text-danger" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <TransactionFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </div>
  );
}
