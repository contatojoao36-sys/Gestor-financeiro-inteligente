import { AlertTriangle, AlertCircle, TrendingUp, PiggyBank, Target, Info } from "lucide-react";
import type { Notification, NotificationLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  PiggyBank,
  Target,
};

const LEVEL_STYLE: Record<NotificationLevel, string> = {
  danger: "bg-danger-bg text-danger",
  warning: "bg-warning-bg text-warning",
  success: "bg-success-bg text-success",
  info: "bg-info-bg text-info",
};

export function AlertItem({ alert }: { alert: Notification }) {
  const Icon = ICONS[alert.icon] ?? Info;
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border p-3">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", LEVEL_STYLE[alert.level])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{alert.title}</p>
        <p className="text-xs text-muted">{alert.message}</p>
      </div>
    </div>
  );
}
