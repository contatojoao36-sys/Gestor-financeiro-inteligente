"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashPin } from "@/lib/pin";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (hash: string) => void;
}

export function PinSetupDialog({ open, onOpenChange, onConfirm }: Props) {
  const [pin, setPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicializa o formulário ao abrir o diálogo
      setPin("");
      setConfirmPin("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      toast.error("O PIN deve ter exatamente 4 números.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("Os PINs não coincidem.");
      return;
    }
    const hash = await hashPin(pin);
    onConfirm(hash);
    onOpenChange(false);
    toast.success("PIN configurado com sucesso.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Definir PIN de acesso</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Novo PIN (4 dígitos)</Label>
            <Input inputMode="numeric" type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} maxLength={4} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Confirmar PIN</Label>
            <Input inputMode="numeric" type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} maxLength={4} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Confirmar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
