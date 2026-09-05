"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "success" | "danger" | "warning" | "primary";
  index?: number;
}

const TONE_STYLE: Record<string, string> = {
  neutral: "bg-surface-muted text-foreground",
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  warning: "bg-warning-bg text-warning",
  primary: "bg-primary/10 text-primary",
};

export function StatCard({ label, value, icon: Icon, tone = "neutral", index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="p-4">
        <div className={cn("mb-3 flex h-8 w-8 items-center justify-center rounded-full", TONE_STYLE[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs text-muted">{label}</p>
        <AnimatedNumber value={value} className="text-lg font-semibold" />
      </Card>
    </motion.div>
  );
}
