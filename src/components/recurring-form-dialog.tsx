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
import type { CategoryKey, RecurringTransaction } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: RecurringTransaction | null;
}

export function RecurringFormDialog({ open, onOpenChange, editing }: Props) {
  const addRecurring = useAppStore((s) => s.addRecurring);
  const updateRecurring = useAppStore((s) => s.updateRecurring);

  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<CategoryKey>("assinaturas");
  const [dayOfMonth, setDayOfMonth] = React.useState("5");

  React.useEffect(() => {
    if (open) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicializa o formulário ao abrir o diálogo
        setDescription(editing.description);
        setAmount(String(editing.amount));
        setCategory(editing.category);
        setDayOfMonth(String(editing.dayOfMonth ?? 5));
      } else {
        setDescription("");
        setAmount("");
        setCategory("assinaturas");
        setDayOfMonth("5");
      }
    }
  }, [open, editing]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount.replace(",", "."));
    if (!description.trim() || !value || value <= 0) {
      toast.error("Informe descrição e valor válidos.");
      return;
    }
    const payload = {
      type: "expense" as const,
      amount: value,
      category,
      description: description.trim(),
      frequency: "monthly" as const,
      dayOfMonth: parseInt(dayOfMonth, 10) || 1,
      active: true,
    };
    if (editing) {
      updateRecurring(editing.id, payload);
      toast.success("Conta fixa atualizada.");
    } else {
      addRecurring(payload);
      toast.success("Conta fixa adicionada ao calendário.");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar conta fixa" : "Nova conta fixa"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Internet, Netflix, Aluguel" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="99" />
            </div>
            <div className="space-y-2">
              <Label>Dia do vencimento</Label>
              <Input inputMode="numeric" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} placeholder="10" />
            </div>
          </div>
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
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
