"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SECONDARY_NAV, ALL_NAV } from "./nav-items";
import { ThemeToggle } from "../theme-toggle";
import { cn } from "@/lib/utils";

export function MobileTopbar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const current = ALL_NAV.find((i) => i.href === pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Wallet2 className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold">{current?.label ?? "Gestor Financeiro"}</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Mais opções" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mais</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-border p-4 text-sm font-medium transition-colors",
                    active ? "border-primary bg-primary/5 text-primary" : "hover:bg-surface-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
