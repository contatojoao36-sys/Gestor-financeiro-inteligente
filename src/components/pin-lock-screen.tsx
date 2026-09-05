"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Lock, Wallet2 } from "lucide-react";
import { verifyPin } from "@/lib/pin";
import { cn } from "@/lib/utils";

interface Props {
  pinHash: string;
  onUnlock: () => void;
}

export function PinLockScreen({ pinHash, onUnlock }: Props) {
  const [digits, setDigits] = React.useState("");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (digits.length < 4) return;
    verifyPin(digits, pinHash).then((ok) => {
      if (ok) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setDigits("");
          setError(false);
        }, 500);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  function press(d: string) {
    if (digits.length >= 4) return;
    setDigits((prev) => prev + d);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background px-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Wallet2 className="h-6 w-6" />
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Lock className="h-3.5 w-3.5" /> Digite seu PIN para continuar
        </p>
      </div>

      <motion.div
        animate={error ? { x: [0, -8, 8, -8, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="flex gap-3"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-3.5 w-3.5 rounded-full border-2 transition-colors",
              digits.length > i ? "border-primary bg-primary" : "border-border-strong",
              error && "border-danger"
            )}
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"].map((d, i) =>
          d === "" ? (
            <div key={i} />
          ) : d === "back" ? (
            <button
              key={i}
              onClick={() => setDigits((prev) => prev.slice(0, -1))}
              className="h-16 w-16 rounded-full text-sm text-muted transition-colors hover:bg-surface-muted"
            >
              apagar
            </button>
          ) : (
            <button
              key={i}
              onClick={() => press(d)}
              className="h-16 w-16 rounded-full text-xl font-medium transition-colors hover:bg-surface-muted active:scale-95"
            >
              {d}
            </button>
          )
        )}
      </div>
    </div>
  );
}
