import { Badge } from "@/components/ui/badge";
import type { GoalStatus } from "@/lib/engine/goals";

const STATUS_MAP: Record<GoalStatus, { label: string; variant: "success" | "warning" | "danger" | "neutral"; emoji: string }> = {
  on_track: { label: "No caminho certo", variant: "success", emoji: "🟢" },
  attention: { label: "Atenção", variant: "warning", emoji: "🟡" },
  late: { label: "Atrasado", variant: "danger", emoji: "🔴" },
  done: { label: "Concluída", variant: "success", emoji: "✅" },
  no_data: { label: "Sem histórico", variant: "neutral", emoji: "⚪" },
};

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  const info = STATUS_MAP[status];
  return (
    <Badge variant={info.variant}>
      <span>{info.emoji}</span> {info.label}
    </Badge>
  );
}
