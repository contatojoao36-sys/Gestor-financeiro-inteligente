"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";
import { todayISO } from "@/lib/format";
import type { CategoryKey, Transaction, TransactionType } from "@/lib/types";

const TYPE_LABEL: Record<TransactionType, string> = {
  income: "Receita",
  expense: "Despesa",
  transfer: "Aporte em meta / reserva",
  investment: "Investimento",
  debt_payment: "Pagamento de dívida",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Transaction | null;
}

export function TransactionFormDialog({ open, onOpenChange, editing }: Props) {
  const goals = useAppStore((s) => s.goals);
  const debts = useAppStore((s) => s.debts);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);

  const [type, setType] = React.useState<TransactionType>("expense");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<CategoryKey>("outros");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState(todayISO());
  const [goalId, setGoalId] = React.useState<string>("");
  const [debtId, setDebtId] = React.useState<string>("");

  React.useEffect(() => {
    if (open) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicializa o formulário ao abrir o diálogo
        setType(editing.type);
        setAmount(String(editing.amount));
        setCategory(editing.category);
        setDescription(editing.description);
        setDate(editing.date);
        setGoalId(editing.goalId ?? "");
        setDebtId(editing.debtId ?? "");
      } else {
        setType("expense");
        setAmount("");
        setCategory("outros");
        setDescription("");
        setDate(todayISO());
        setGoalId("");
        setDebtId("");
      }
    }
  }, [open, editing]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    if (!description.trim()) {
      toast.error("Informe uma descrição.");
      return;
    }

    const finalCategory: CategoryKey =
      type === "income" ? "receita" : type === "investment" ? "investimentos" : type === "transfer" ? "reserva" : type === "debt_payment" ? "dividas" : category;

    const payload = {
      type,
      amount: value,
      category: finalCategory,
      description: description.trim(),
      date,
      goalId: type === "transfer" && goalId ? goalId : undefined,
      debtId: type === "debt_payment" && debtId ? debtId : undefined,
      source: "manual" as const,
    };

    if (editing) {
      updateTransaction(editing.id, payload);
      toast.success("Transação atualizada.");
    } else {
      addTransaction(payload);
      toast.success("Transação registrada.");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar transação" : "Nova transação"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABEL) as TransactionType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {type === "expense" && (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CategoryKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORIES[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "transfer" && goals.length > 0 && (
            <div className="space-y-2">
              <Label>Meta (opcional)</Label>
              <Select value={goalId || "none"} onValueChange={(v) => setGoalId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma / reserva geral</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "debt_payment" && debts.length > 0 && (
            <div className="space-y-2">
              <Label>Dívida</Label>
              <Select value={debtId || "none"} onValueChange={(v) => setDebtId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não vincular</SelectItem>
                  {debts.filter((d) => !d.closedAt).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.creditor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Mercado, Uber, Salário..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Salvar" : "Registrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
