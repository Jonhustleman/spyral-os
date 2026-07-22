/**
 * Product Intelligence — Barrel Export
 *
 * Phase G.0 Self-Evolving Product Intelligence engines.
 * These NEVER replace the Cognitive Core — they observe and recommend.
 */

export { ExperienceRecorder } from "./ExperienceRecorder";
export type { ExperienceEvent, ExperienceEventType, ExperienceSession } from "./ExperienceRecorder";

export { ProductMetrics } from "./ProductMetrics";
export type { ProductMetricsSnapshot } from "./ProductMetrics";

export { ExperienceAdaptationEngine } from "./ExperienceAdaptationEngine";
export type { AdaptationRecommendation } from "./ExperienceAdaptationEngine";

export { ProductResearchEngine } from "./ProductResearchEngine";
export type { ResearchQuestion, Hypothesis, EvidenceItem, Experiment } from "./ProductResearchEngine";

export { ImprovementRecommendationEngine } from "./ImprovementRecommendationEngine";
export type { ImprovementRecommendation } from "./ImprovementRecommendationEngine";

export { ProductKnowledgeGraph } from "./ProductKnowledgeGraph";
export type { GraphNode, GraphEdge, NodeType, KnowledgeGraphSnapshot } from "./ProductKnowledgeGraph";

export { DeveloperInsights } from "./DeveloperInsights";
export type { DeveloperDashboardData } from "./DeveloperInsights";
