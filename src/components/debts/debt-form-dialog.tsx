"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import type { Debt } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Debt | null;
}

export function DebtFormDialog({ open, onOpenChange, editing }: Props) {
  const addDebt = useAppStore((s) => s.addDebt);
  const updateDebt = useAppStore((s) => s.updateDebt);

  const [creditor, setCreditor] = React.useState("");
  const [remainingAmount, setRemainingAmount] = React.useState("");
  const [totalAmount, setTotalAmount] = React.useState("");
  const [installmentAmount, setInstallmentAmount] = React.useState("");
  const [installmentsTotal, setInstallmentsTotal] = React.useState("1");
  const [installmentsPaid, setInstallmentsPaid] = React.useState("0");
  const [interestRateMonthly, setInterestRateMonthly] = React.useState("0");
  const [dueDay, setDueDay] = React.useState("10");

  React.useEffect(() => {
    if (open) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicializa o formulário ao abrir o diálogo
        setCreditor(editing.creditor);
        setRemainingAmount(String(editing.remainingAmount));
        setTotalAmount(String(editing.totalAmount));
        setInstallmentAmount(String(editing.installmentAmount));
        setInstallmentsTotal(String(editing.installmentsTotal));
        setInstallmentsPaid(String(editing.installmentsPaid));
        setInterestRateMonthly(String(editing.interestRateMonthly));
        setDueDay(String(editing.dueDay));
      } else {
        setCreditor("");
        setRemainingAmount("");
        setTotalAmount("");
        setInstallmentAmount("");
        setInstallmentsTotal("1");
        setInstallmentsPaid("0");
        setInterestRateMonthly("0");
        setDueDay("10");
      }
    }
  }, [open, editing]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const remaining = parseFloat(remainingAmount.replace(",", "."));
    if (!creditor.trim() || !remaining || remaining <= 0) {
      toast.error("Informe o credor e o valor restante.");
      return;
    }
    const payload = {
      creditor: creditor.trim(),
      totalAmount: parseFloat(totalAmount.replace(",", ".")) || remaining,
      remainingAmount: remaining,
      installmentAmount: parseFloat(installmentAmount.replace(",", ".")) || 0,
      installmentsTotal: parseInt(installmentsTotal, 10) || 1,
      installmentsPaid: parseInt(installmentsPaid, 10) || 0,
      interestRateMonthly: parseFloat(interestRateMonthly.replace(",", ".")) || 0,
      dueDay: parseInt(dueDay, 10) || 10,
    };
    if (editing) {
      updateDebt(editing.id, payload);
      toast.success("Dívida atualizada.");
    } else {
      addDebt(payload);
      toast.success("Dívida cadastrada.");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar dívida" : "Nova dívida"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Credor</Label>
            <Input value={creditor} onChange={(e) => setCreditor(e.target.value)} placeholder="Ex: Cartão Nubank" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor total original</Label>
              <Input inputMode="decimal" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="2000" />
            </div>
            <div className="space-y-2">
              <Label>Valor restante</Label>
              <Input inputMode="decimal" value={remainingAmount} onChange={(e) => setRemainingAmount(e.target.value)} placeholder="1500" />
            </div>
            <div className="space-y-2">
              <Label>Valor da parcela</Label>
              <Input inputMode="decimal" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} placeholder="200" />
            </div>
            <div className="space-y-2">
              <Label>Taxa de juros (% a.m.)</Label>
              <Input inputMode="decimal" value={interestRateMonthly} onChange={(e) => setInterestRateMonthly(e.target.value)} placeholder="2.5" />
            </div>
            <div className="space-y-2">
              <Label>Parcelas totais</Label>
              <Input inputMode="numeric" value={installmentsTotal} onChange={(e) => setInstallmentsTotal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Parcelas já pagas</Label>
              <Input inputMode="numeric" value={installmentsPaid} onChange={(e) => setInstallmentsPaid(e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Dia de vencimento</Label>
              <Input inputMode="numeric" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
