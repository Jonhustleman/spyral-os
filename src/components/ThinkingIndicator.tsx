"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Thinking Indicator — human-readable stage indicators.
 *
 * Shows cycling stage messages while processing.
 * These are UI indicators ONLY — never reveals internal reasoning.
 */
const STAGES = [
  { icon: "🧭", label: "Understanding your goal..." },
  { icon: "🔍", label: "Looking for similar situations..." },
  { icon: "🧠", label: "Finding hidden assumptions..." },
  { icon: "🧩", label: "Testing possible paths..." },
  { icon: "⚖️", label: "Comparing alternatives..." },
  { icon: "📍", label: "Designing the strongest approach..." },
  { icon: "✨", label: "Almost ready..." },
];

interface ThinkingIndicatorProps {
  isThinking: boolean;
}

export function ThinkingIndicator({ isThinking }: ThinkingIndicatorProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!isThinking) {
      setStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isThinking]);

  if (!isThinking) return null;

  const stage = STAGES[stageIndex];

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-800/40 border border-zinc-700/50 text-sm">
      <AnimatePresence mode="wait">
        <motion.span
          key={stageIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <span className="text-lg">{stage.icon}</span>
          <span className="text-zinc-300">{stage.label}</span>
        </motion.span>
      </AnimatePresence>
      <span className="flex gap-1 ml-auto">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  );
}
