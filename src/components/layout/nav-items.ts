import { Home, Wallet, Target, BarChart3, Bot, SlidersHorizontal, CreditCard, CalendarDays, Settings } from "lucide-react";

export const PRIMARY_NAV = [
  { href: "/", label: "Início", icon: Home },
  { href: "/transacoes", label: "Transações", icon: Wallet },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/analises", label: "Análises", icon: BarChart3 },
  { href: "/assistente", label: "Assistente", icon: Bot },
] as const;

export const SECONDARY_NAV = [
  { href: "/simulador", label: "Simulador", icon: SlidersHorizontal },
  { href: "/dividas", label: "Dívidas", icon: CreditCard },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];
