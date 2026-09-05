# Gestor Financeiro Inteligente

Um gestor financeiro pessoal completo — dashboard, chat financeiro em linguagem natural, metas com cálculo automático de prazo, orçamento por categoria, simulador de cenários, controle de dívidas e calendário financeiro.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** (motion design)
- **Recharts** (gráficos)
- **Zustand** (estado global, com persistência em `localStorage`)
- **Radix UI** (primitivos acessíveis: dialog, tabs, select, slider, switch)

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Na primeira visita você passa por um onboarding de 8 etapas que monta seu perfil financeiro inicial (renda, gastos fixos/variáveis, dívidas, reserva, metas).

Outros scripts:

```bash
npm run build   # build de produção
npm run lint    # eslint
```

## Arquitetura

Todo o "motor financeiro" é código puro e testável, separado da UI:

- `src/lib/types.ts` — modelo de dados (Transaction, Goal, Debt, Budget, RecurringTransaction, Settings...)
- `src/lib/engine/` — cálculos: saldo, orçamento, metas (prazo, cenários, status), distribuição de recebimentos, saúde financeira, projeções futuras, alertas, insights (recorrência, anomalias, tendências, oportunidades) e o parser de linguagem natural usado pela barra de registro rápido e pelo assistente.
- `src/lib/store.ts` — estado global (Zustand) com todas as ações que recalculam o app automaticamente a cada transação.
- `src/app/` — telas (Next.js App Router): Início, Transações, Metas, Análises, Assistente, Simulador, Dívidas, Calendário, Configurações.

## Persistência e privacidade

Esta é uma aplicação **local-first**: todos os dados ficam salvos apenas no `localStorage` do navegador do dispositivo, sem backend nem envio de dados financeiros a servidores externos. Há um PIN de acesso local opcional (Configurações → Segurança) e exportação/importação de backup em JSON (Configurações → Dados).

A estrutura de dados foi desenhada para, no futuro, ser migrada para um backend real (Postgres/Supabase) e eventualmente integrar Open Finance — mas nenhuma integração bancária real está implementada nesta versão.

## Assistente financeiro

O "chat" e a barra de registro rápido usam um interpretador de linguagem natural baseado em regras (não um LLM externo): ele reconhece padrões como "Recebi R$ 4.000 hoje", "Gastei R$ 80 no mercado", "Quero juntar R$ 20.000 em 10 meses" e perguntas como "Quanto posso gastar hoje?", sempre respondendo com base nos dados reais cadastrados no app.
