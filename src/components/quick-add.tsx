"use client";

import * as React from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { parseMessage } from "@/lib/engine/parser";
import { processUserMessage } from "@/lib/engine/process-message";

export function QuickAdd({ placeholder }: { placeholder?: string }) {
  const [text, setText] = React.useState("");
  const [answer, setAnswer] = React.useState<string | null>(null);
  const store = useAppStore();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const parsed = parseMessage(trimmed);
    const response = processUserMessage(trimmed, store);

    if (parsed.intent === "question") {
      setAnswer(response);
    } else {
      setAnswer(null);
      const failed = response.startsWith("Não consegui");
      if (failed) toast.error(response);
      else toast.success(response);
    }
    setText("");
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder ?? 'Ex: "Recebi R$ 4.000 hoje" ou "Gastei R$ 80 no mercado"'}
            className="pl-10"
          />
        </div>
        <Button type="submit" size="icon" aria-label="Enviar">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <AnimatePresence>
        {answer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted p-3 text-sm"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
