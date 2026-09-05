"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PRIMARY_NAV } from "./nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
      {PRIMARY_NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
          >
            {active && (
              <motion.div
                layoutId="bottom-nav-active"
                className="absolute top-1 h-1 w-6 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className={cn("h-5 w-5 transition-colors", active ? "text-primary" : "text-muted")} />
            <span className={cn(active ? "text-foreground" : "text-muted")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
