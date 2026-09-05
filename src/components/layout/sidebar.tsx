"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet2 } from "lucide-react";
import { ALL_NAV } from "./nav-items";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../theme-toggle";
import { useAppStore } from "@/lib/store";

export function Sidebar() {
  const pathname = usePathname();
  const name = useAppStore((s) => s.settings.displayName);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface/60 md:px-4 md:py-6">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
          <Wallet2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Gestor Financeiro</p>
          <p className="text-xs text-muted leading-tight">{name || "Seu CFO pessoal"}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {ALL_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-foreground" : "text-muted hover:bg-surface-muted hover:text-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-[var(--radius-md)] bg-surface-muted"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 h-[18px] w-[18px]" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between px-2 pt-4">
        <span className="text-xs text-muted">Aparência</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
