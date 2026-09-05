import type { CategoryKey } from "./types";

// Paleta fixa em hex para uso direto no Recharts (evita depender de var(--...) em SVG).
export const CHART_PALETTE: Record<CategoryKey, string> = {
  moradia: "#4f46e5",
  alimentacao: "#f59e0b",
  transporte: "#10b981",
  saude: "#ef4444",
  educacao: "#06b6d4",
  lazer: "#ec4899",
  assinaturas: "#8b5cf6",
  compras: "#f97316",
  dividas: "#64748b",
  investimentos: "#14b8a6",
  reserva: "#a855f7",
  receita: "#22c55e",
  outros: "#94a3b8",
};

export const COLOR_PRIMARY = "#6366f1";
export const COLOR_SUCCESS = "#10b981";
export const COLOR_DANGER = "#ef4444";
export const COLOR_WARNING = "#f59e0b";
export const COLOR_MUTED = "#94a3b8";
