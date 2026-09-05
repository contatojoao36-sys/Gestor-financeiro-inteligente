"use client";

import * as React from "react";
import { useMotionValue, useTransform, animate, motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ value, format = formatCurrency, className, duration = 0.9 }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => format(v));
  const [display, setDisplay] = React.useState(format(0));
  const first = React.useRef(true);

  React.useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: first.current ? duration : 0.5,
      ease: [0.16, 1, 0.3, 1],
    });
    first.current = false;
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  React.useEffect(() => {
    return rounded.on("change", (v) => setDisplay(v));
  }, [rounded]);

  return (
    <motion.span className={cn("tabular-nums", className)} aria-label={format(value)}>
      {display}
    </motion.span>
  );
}
