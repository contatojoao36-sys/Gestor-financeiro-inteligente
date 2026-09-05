"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import type { Goal, GoalKind } from "@/lib/types";

const GOAL_KIND_LABEL: Record<GoalKind, string> = {
  purchase: "Compra",
  reserve: "Reserva de emergência",
  travel: "Viagem",
  investment: "Investimento",
  debt_free: "Quitar dívidas",
  custom: "Outro",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Goal | null;
}

export function GoalFormDialog({ open, onOpenChange, editing }: Props) {
  const addGoal = useAppStore((s) => s.addGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const goalsCount = useAppStore((s) => s.goals.length);

  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<GoalKind>("custom");
  const [targetAmount, setTargetAmount] = React.useState("");
  const [currentAmount, setCurrentAmount] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");

  React.useEffect(() => {
    if (open) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicializa o formulário ao abrir o diálogo
        setName(editing.name);
        setKind(editing.kind);
        setTargetAmount(String(editing.targetAmount));
        setCurrentAmount(String(editing.currentAmount));
        setTargetDate(editing.targetDate ?? "");
      } else {
        setName("");
        setKind("custom");
        setTargetAmount("");
        setCurrentAmount("");
        setTargetDate("");
      }
    }
  }, [open, editing]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = parseFloat(targetAmount.replace(",", "."));
    if (!name.trim() || !target || target <= 0) {
      toast.error("Informe um nome e um valor de meta válido.");
      return;
    }
    const current = parseFloat(currentAmount.replace(",", ".")) || 0;

    if (editing) {
      updateGoal(editing.id, { name: name.trim(), kind, targetAmount: target, currentAmount: current, targetDate: targetDate || undefined });
      toast.success("Meta atualizada.");
    } else {
      addGoal({ name: name.trim(), kind, targetAmount: target, currentAmount: current, targetDate: targetDate || undefined, priority: goalsCount + 1 });
      toast.success("Meta criada.");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar meta" : "Nova meta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da meta</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Comprar um iPhone" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as GoalKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(GOAL_KIND_LABEL) as GoalKind[]).map((k) => (
                  <SelectItem key={k} value={k}>{GOAL_KIND_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor da meta (R$)</Label>
              <Input inputMode="decimal" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="6000" />
            </div>
            <div className="space-y-2">
              <Label>Já possui (R$)</Label>
              <Input inputMode="decimal" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prazo desejado (opcional)</Label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Salvar" : "Criar meta"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
