"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { processUserMessage } from "@/lib/engine/process-message";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Quanto posso gastar hoje?",
  "Quanto gastei com alimentação esse mês?",
  "Qual foi meu maior gasto?",
  "Quanto preciso guardar esse mês?",
  "Se eu guardar R$ 800 por mês, quando chego em R$ 20 mil?",
  "Se eu receber R$ 5 mil amanhã, como você recomenda distribuir?",
];

export default function AssistentePage() {
  const store = useAppStore();
  const messages = useAppStore((s) => s.chatMessages);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const clearChat = useAppStore((s) => s.clearChat);

  const [text, setText] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    addChatMessage({ role: "user", text: trimmed });
    setText("");
    setThinking(true);
    setTimeout(() => {
      const response = processUserMessage(trimmed, store);
      addChatMessage({ role: "assistant", text: response });
      setThinking(false);
    }, 400);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col px-4 py-6 md:h-[calc(100vh-4rem)] md:px-8 md:py-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Assistente Financeiro</h1>
            <p className="text-xs text-muted">Respostas baseadas nos seus dados reais</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearChat} aria-label="Limpar conversa">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="space-y-4 py-6">
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <Card className="max-w-[85%] p-3 text-sm">
                Oi! Pode me contar o que aconteceu (&ldquo;recebi R$...&rdquo;, &ldquo;gastei R$...&rdquo;) ou perguntar sobre sua situação financeira. Aqui vão algumas ideias:
              </Card>
            </div>
            <div className="flex flex-wrap gap-2 pl-10">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex items-start gap-2", m.role === "user" && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                )}
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <Card className={cn("max-w-[80%] p-3 text-sm", m.role === "user" && "bg-primary text-primary-foreground border-primary")}>
                {m.text}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <div className="flex items-center gap-2 pl-10 text-xs text-muted">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="mt-4 flex items-center gap-2"
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua mensagem..." />
        <Button type="submit" size="icon" aria-label="Enviar">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
