/**
 * ReasoningResult — The universal return type from any reasoning provider.
 *
 * RC7: Every adapter returns this. Every composer receives this.
 * No provider-specific types leak into the application.
 *
 * This is the ONLY thing the rest of SPYRAL should consume.
 * No pipeline stages. No internal structures. Just the result.
 */

export interface ReasoningResult {
  /** The natural language response text */
  content: string;

  /** Which model produced this response */
  model: string;

  /** The provider used */
  provider: string;

  /** Token usage */
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  /** Reasoning metadata */
  reasoning?: {
    /** How long the model spent reasoning (ms) */
    durationMs: number;
    /** Any reasoning trace or chain-of-thought */
    trace?: string;
  };

  /** Whether this was served from cache/mock */
  cached: boolean;

  /** Error information (if applicable) */
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}
