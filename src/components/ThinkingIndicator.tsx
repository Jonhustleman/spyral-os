"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SPYRAL Thinking Indicator — UX-only stage indicators.
 *
 * Shows cycling stage messages while SPYRAL is processing.
 * These are UI indicators ONLY — never reveals chain of thought.
 *
 * Stages cycle through common cognitive pipeline phases.
 */
const STAGES = [
  { icon: "🧭", label: "Understanding your objective..." },
  { icon: "🔍", label: "Looking for hidden assumptions..." },
  { icon: "🧠", label: "Building your Reality Model..." },
  { icon: "🧩", label: "Detecting hidden patterns..." },
  { icon: "⚖️", label: "Stress-testing strategies..." },
  { icon: "📍", label: "Designing your execution path..." },
  { icon: "✨", label: "Thinking with the SPYRAL Cognitive Core..." },
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
