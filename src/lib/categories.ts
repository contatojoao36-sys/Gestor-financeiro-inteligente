import type { Category, CategoryKey } from "./types";

export const CATEGORIES: Record<CategoryKey, Category> = {
  moradia: { key: "moradia", label: "Moradia", icon: "Home", color: "var(--chart-1)", type: "expense" },
  alimentacao: { key: "alimentacao", label: "Alimentação", icon: "UtensilsCrossed", color: "var(--chart-2)", type: "expense" },
  transporte: { key: "transporte", label: "Transporte", icon: "Car", color: "var(--chart-3)", type: "expense" },
  saude: { key: "saude", label: "Saúde", icon: "HeartPulse", color: "var(--chart-4)", type: "expense" },
  educacao: { key: "educacao", label: "Educação", icon: "GraduationCap", color: "var(--chart-5)", type: "expense" },
  lazer: { key: "lazer", label: "Lazer", icon: "Ticket", color: "var(--chart-6)", type: "expense" },
  assinaturas: { key: "assinaturas", label: "Assinaturas", icon: "Repeat", color: "var(--chart-7)", type: "expense" },
  compras: { key: "compras", label: "Compras", icon: "ShoppingBag", color: "var(--chart-8)", type: "expense" },
  dividas: { key: "dividas", label: "Dívidas", icon: "CreditCard", color: "var(--chart-9)", type: "expense" },
  investimentos: { key: "investimentos", label: "Investimentos", icon: "TrendingUp", color: "var(--chart-10)", type: "neutral" },
  reserva: { key: "reserva", label: "Reserva", icon: "PiggyBank", color: "var(--chart-11)", type: "neutral" },
  receita: { key: "receita", label: "Receita", icon: "Wallet", color: "var(--chart-12)", type: "income" },
  outros: { key: "outros", label: "Outros", icon: "MoreHorizontal", color: "var(--chart-13)", type: "expense" },
};

export const EXPENSE_CATEGORIES: CategoryKey[] = [
  "moradia",
  "alimentacao",
  "transporte",
  "saude",
  "educacao",
  "lazer",
  "assinaturas",
  "compras",
  "outros",
];

export const CATEGORY_ORDER: CategoryKey[] = [
  "moradia",
  "alimentacao",
  "transporte",
  "saude",
  "educacao",
  "lazer",
  "assinaturas",
  "compras",
  "dividas",
  "investimentos",
  "reserva",
  "outros",
];

// Palavras-chave usadas pelo parser/categorizador automático de linguagem natural.
export const CATEGORY_KEYWORDS: Partial<Record<CategoryKey, string[]>> = {
  moradia: ["aluguel", "condominio", "condomínio", "iptu", "agua", "água", "luz", "energia", "gas", "internet", "moradia"],
  alimentacao: ["mercado", "supermercado", "restaurante", "ifood", "comida", "almoco", "almoço", "janta", "lanche", "padaria", "feira", "delivery"],
  transporte: ["uber", "99", "gasolina", "combustivel", "combustível", "onibus", "ônibus", "metro", "metrô", "estacionamento", "carro", "transporte"],
  saude: ["farmacia", "farmácia", "remedio", "remédio", "medico", "médico", "consulta", "plano de saude", "academia", "dentista"],
  educacao: ["curso", "faculdade", "livro", "escola", "mensalidade", "educacao", "educação"],
  lazer: ["cinema", "show", "viagem", "passeio", "bar", "festa", "lazer", "streaming"],
  assinaturas: ["netflix", "spotify", "amazon prime", "disney", "assinatura", "hbo", "youtube premium"],
  compras: ["roupa", "tenis", "tênis", "loja", "shopping", "compra", "eletronico", "eletrônico", "celular", "iphone"],
  dividas: ["divida", "dívida", "parcela", "cartao", "cartão", "emprestimo", "empréstimo", "financiamento"],
  investimentos: ["investimento", "investir", "cdb", "tesouro", "acao", "ação", "fundo"],
  reserva: ["reserva", "poupanca", "poupança", "guardar"],
};
