/**
 * SPYRAL OS — Memory React Hook
 *
 * React integration for the Memory Engine.
 * Provides reactive hook for components to use.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { MemoryEngine } from "@/core/memory";
import type {
  MemoryMetrics,
  MemoryState,
  RetrievedContext,
  SearchResult,
  Prediction,
  Reflection,
  ReflectionType,
  DetectedPattern,
  SemanticFact,
  EpisodeMemory,
  GraphNode,
  GraphEdge,
} from "@/core/memory";

/**
 * Hook to access memory engine state reactively.
 */
export function useMemory() {
  const [metrics, setMetrics] = useState<MemoryMetrics>(MemoryEngine.getMetrics());
  const [state, setState] = useState<MemoryState | null>(null);
  const [isInitialized, setIsInitialized] = useState(MemoryEngine.isInitialized());

  useEffect(() => {
    // Initialize if needed
    if (!MemoryEngine.isInitialized()) {
      MemoryEngine.init();
      setIsInitialized(true);
    }

    // Subscribe to changes
    const unsubscribe = MemoryEngine.subscribe(() => {
      setMetrics(MemoryEngine.getMetrics());
    });

    return unsubscribe;
  }, []);

  const refresh = useCallback(() => {
    setMetrics(MemoryEngine.getMetrics());
    setState(MemoryEngine.getState());
  }, []);

  return {
    isInitialized,
    metrics,
    state,
    refresh,
    engine: MemoryEngine,
  };
}

/**
 * Hook for memory search.
 */
export function useMemorySearch() {
  const search = useCallback((query: string, limit?: number): SearchResult[] => {
    return MemoryEngine.search(query, limit);
  }, []);

  return { search };
}

/**
 * Hook for memory predictions.
 */
export function usePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    setPredictions(MemoryEngine.predict());

    const unsubscribe = MemoryEngine.subscribe(() => {
      setPredictions(MemoryEngine.predict());
    });

    return unsubscribe;
  }, []);

  return predictions;
}

/**
 * Hook for memory reflections.
 */
export function useReflections() {
  const getReflection = useCallback((type: ReflectionType): Reflection | null => {
    return MemoryEngine.reflect(type);
  }, []);

  const generateReflection = useCallback((type: ReflectionType): Reflection | null => {
    return MemoryEngine.reflect(type, true);
  }, []);

  return { getReflection, generateReflection };
}

/**
 * Hook for patterns.
 */
export function usePatterns() {
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);

  useEffect(() => {
    setPatterns(MemoryEngine.getPatterns());

    const unsubscribe = MemoryEngine.subscribe(() => {
      setPatterns(MemoryEngine.getPatterns());
    });

    return unsubscribe;
  }, []);

  const detectPatterns = useCallback(() => {
    const newPatterns = MemoryEngine.detectPatterns();
    setPatterns(MemoryEngine.getPatterns());
    return newPatterns;
  }, []);

  return { patterns, detectPatterns };
}

/**
 * Hook for facts (semantic memory).
 */
export function useFacts() {
  const [facts, setFacts] = useState<SemanticFact[]>([]);

  useEffect(() => {
    setFacts(MemoryEngine.getFacts());

    const unsubscribe = MemoryEngine.subscribe(() => {
      setFacts(MemoryEngine.getFacts());
    });

    return unsubscribe;
  }, []);

  const learnFact = useCallback((statement: string, category: string, source: string) => {
    return MemoryEngine.learnFact(statement, category, source);
  }, []);

  return { facts, learnFact };
}

/**
 * Hook for knowledge graph.
 */
export function useKnowledgeGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);

  useEffect(() => {
    setNodes(MemoryEngine.getNodes());
    setEdges(MemoryEngine.getEdges());

    const unsubscribe = MemoryEngine.subscribe(() => {
      setNodes(MemoryEngine.getNodes());
      setEdges(MemoryEngine.getEdges());
    });

    return unsubscribe;
  }, []);

  return {
    nodes,
    edges,
    summary: MemoryEngine.getGraphSummary(),
    addNode: MemoryEngine.addNode.bind(MemoryEngine),
    addEdge: MemoryEngine.addEdge.bind(MemoryEngine),
  };
}

/**
 * Hook for timeline.
 */
export function useTimeline() {
  const recordEvent = useCallback(
    (type: import("@/core/memory").TimelineType, title: string, description: string) => {
      return MemoryEngine.recordTimeline(type, title, description);
    },
    [],
  );

  return { recordEvent };
}

/**
 * Hook for consolidation.
 */
export function useConsolidation() {
  const [lastConsolidated, setLastConsolidated] = useState<number | null>(
    MemoryEngine.getMetrics().lastConsolidation,
  );

  const consolidate = useCallback(() => {
    const result = MemoryEngine.consolidate();
    setLastConsolidated(result.timestamp);
    return result;
  }, []);

  return {
    lastConsolidated,
    consolidate,
    shouldConsolidate: MemoryEngine.shouldConsolidate(),
  };
}
