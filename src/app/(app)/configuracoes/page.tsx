"use client";

import * as React from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Download, Upload, RotateCcw, Lock, Sun, Moon, Monitor } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PinSetupDialog } from "@/components/pin-setup-dialog";
import { useActiveProfile } from "@/components/profile-gate";
import { useAppStore } from "@/lib/store";
import { CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";
import type { AppState, CategoryKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ConfiguracoesPage() {
  const state = useAppStore((s) => s) as AppState;
  const updateSettings = useAppStore((s) => s.updateSettings);
  const setBudget = useAppStore((s) => s.setBudget);
  const setPinHash = useAppStore((s) => s.setPinHash);
  const resetAllData = useAppStore((s) => s.resetAllData);
  const importState = useAppStore((s) => s.importState);
  const { theme, setTheme } = useTheme();
  const { profileName, switchProfile } = useActiveProfile();

  const [pinDialogOpen, setPinDialogOpen] = React.useState(false);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function budgetFor(category: CategoryKey) {
    return state.budgets.find((b) => b.category === category)?.monthlyLimit ?? 0;
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gestor-financeiro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado.");
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.settings || !Array.isArray(parsed.transactions)) throw new Error("Formato inválido");
        importState(parsed);
        toast.success("Dados importados com sucesso.");
      } catch {
        toast.error("Arquivo inválido. Verifique se é um backup exportado por este app.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold">Configurações</h1>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-3">
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">Perfil ativo: {profileName}</p>
                <p className="text-xs text-muted">Cada pessoa tem seus próprios dados, isolados neste dispositivo.</p>
              </div>
              <Button variant="outline" onClick={switchProfile}>Trocar de perfil</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 py-5">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={state.settings.displayName} onChange={(e) => updateSettings({ displayName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Renda mensal esperada</Label>
                  <Input
                    inputMode="decimal"
                    value={state.settings.monthlyIncomeExpected}
                    onChange={(e) => updateSettings({ monthlyIncomeExpected: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select value={state.settings.incomeFrequency} onValueChange={(v) => updateSettings({ incomeFrequency: v as "fixed" | "variable" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixa</SelectItem>
                      <SelectItem value="variable">Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dias de recebimento (separados por vírgula)</Label>
                <Input
                  value={state.settings.paydays.join(", ")}
                  onChange={(e) =>
                    updateSettings({
                      paydays: e.target.value.split(",").map((d) => parseInt(d.trim(), 10)).filter((d) => !isNaN(d)),
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Saldo já em conta</Label>
                  <Input inputMode="decimal" value={state.settings.initialBalance} onChange={(e) => updateSettings({ initialBalance: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Total já investido</Label>
                  <Input inputMode="decimal" value={state.settings.initialInvested} onChange={(e) => updateSettings({ initialInvested: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamento">
          <Card>
            <CardContent className="space-y-3 py-5">
              <p className="text-sm text-muted">Defina o limite mensal de cada categoria para acompanhar seu orçamento em Análises.</p>
              {EXPENSE_CATEGORIES.map((c) => (
                <div key={c} className="flex items-center justify-between gap-3">
                  <Label className="flex-1">{CATEGORIES[c].label}</Label>
                  <Input
                    className="w-32"
                    inputMode="decimal"
                    value={budgetFor(c) || ""}
                    placeholder="0"
                    onChange={(e) => setBudget(c, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia">
          <Card>
            <CardContent className="space-y-2 py-5">
              <Label>Tema</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "light", label: "Claro", icon: Sun },
                  { value: "dark", label: "Escuro", icon: Moon },
                  { value: "system", label: "Sistema", icon: Monitor },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-border p-4 text-sm transition-colors",
                      theme === opt.value ? "border-primary bg-primary/5 text-primary" : "hover:bg-surface-muted"
                    )}
                  >
                    <opt.icon className="h-5 w-5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardContent className="space-y-4 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-sm font-medium">PIN de acesso</p>
                    <p className="text-xs text-muted">Protege o app com um PIN local de 4 dígitos.</p>
                  </div>
                </div>
                <Switch
                  checked={state.settings.pinEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) setPinDialogOpen(true);
                    else {
                      setPinHash(undefined);
                      toast.success("PIN desativado.");
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted">
                Seus dados ficam salvos apenas neste dispositivo (armazenamento local do navegador). Nenhuma informação financeira é enviada a servidores externos.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dados" className="space-y-3">
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">Exportar backup</p>
                <p className="text-xs text-muted">Baixe um arquivo JSON com todos os seus dados.</p>
              </div>
              <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" /> Exportar</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">Importar backup</p>
                <p className="text-xs text-muted">Restaure dados de um arquivo exportado anteriormente.</p>
              </div>
              <Button variant="outline" onClick={handleImportClick}><Upload className="h-4 w-4" /> Importar</Button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
            </CardContent>
          </Card>
          <Card className="border-danger/40">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-danger">Redefinir tudo</p>
                <p className="text-xs text-muted">Apaga todos os dados e reinicia o onboarding.</p>
              </div>
              <Button variant="destructive" onClick={() => setResetDialogOpen(true)}><RotateCcw className="h-4 w-4" /> Resetar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PinSetupDialog open={pinDialogOpen} onOpenChange={setPinDialogOpen} onConfirm={(hash) => setPinHash(hash)} />

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tem certeza?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted">Essa ação apaga permanentemente todas as transações, metas, dívidas e configurações deste dispositivo. Não é possível desfazer.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetDialogOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetAllData();
                setResetDialogOpen(false);
                toast.success("Todos os dados foram apagados.");
              }}
            >
              Apagar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
