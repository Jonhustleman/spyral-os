/**
 * WorkingMind — Unified client-side interface for all SPYRAL AI interactions.
 *
 * Every page calls WorkingMind.run(). No page contains AI logic.
 *
 * Usage:
 *   const response = await WorkingMind.run("What is gravity?", "research");
 *   // response.response contains the full response text
 *   // response.reasoningResult contains provider/model/tokens
 *
 * Streaming:
 *   const stream = await WorkingMind.stream("explore X", "research");
 *   for await (const chunk of stream) { setContent(prev => prev + chunk); }
 *   const result = await stream.complete();
 */

export type WorkingMindMode =
  | "research"
  | "content"
  | "consultant"
  | "navigation"
  | "command";

export interface WorkingMindResult {
  gateway: string;
  input: string;
  agentType: string;
  mode: string;
  response: string;
  reasoningResult?: {
    provider: string;
    model: string;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
    reasoning?: { durationMs: number };
    cached: boolean;
    error?: string;
  };
  conversation?: {
    currentInvestigation?: string;
    currentProject?: string;
    currentStrategy?: string;
    currentAssumptions: string[];
    currentHypotheses: string[];
    recentTopics: string[];
    turnCount: number;
  };
}

export interface WorkingMindChunk {
  type: "chunk";
  content: string;
}

export interface WorkingMindComplete {
  type: "complete";
  response: WorkingMindResult;
}

export interface WorkingMindError {
  type: "error";
  message: string;
}

export type WorkingMindEvent = WorkingMindChunk | WorkingMindComplete | WorkingMindError;

/**
 * Streaming response from the WorkingMind API.
 * Yields content chunks and resolves to the complete result.
 *
 * Example:
 *   const stream = await WorkingMind.stream("explore X", "research");
 *   for await (const chunk of stream) {
 *     setContent(prev => prev + chunk);
 *   }
 *   const result = await stream.complete();
 */
export class WorkingMindStream {
  private _reader: ReadableStreamDefaultReader<Uint8Array>;
  private _completePromise: Promise<WorkingMindResult>;
  private _resolveComplete!: (value: WorkingMindResult) => void;
  private _rejectComplete!: (err: Error) => void;

  constructor(reader: ReadableStreamDefaultReader<Uint8Array>) {
    this._reader = reader;
    this._completePromise = new Promise((resolve, reject) => {
      this._resolveComplete = resolve;
      this._rejectComplete = reject;
    });
  }

  /**
   * Wait for the stream to complete and return the full response.
   */
  complete(): Promise<WorkingMindResult> {
    return this._completePromise;
  }

  /**
   * Iterate over content chunks as they arrive.
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<string, void, undefined> {
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await this._reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr) as WorkingMindEvent;

            if (event.type === "chunk") {
              yield event.content;
            } else if (event.type === "complete") {
              this._resolveComplete(event.response);
              return;
            } else if (event.type === "error") {
              this._rejectComplete(new Error(event.message));
              return;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err) {
      this._rejectComplete(err instanceof Error ? err : new Error("Stream read failed"));
    }
  }
}

/**
 * WorkingMind — the ONLY way pages interact with AI.
 *
 * Pages call WorkingMind.run() or WorkingMind.stream().
 * They never import SpyralCognitiveCore.
 * They never build prompts.
 * They never handle AI logic.
 */
export class WorkingMind {
  /**
   * Run synchronously (non-streaming) — wait for the full response.
   *
   * Suitable for simple commands or when streaming isn't needed.
   */
  static async run(
    input: string,
    mode: WorkingMindMode,
    options?: {
      conversation?: Record<string, unknown>;
      conversationHistory?: { role: "user" | "assistant"; content: string }[];
    },
  ): Promise<WorkingMindResult> {
    const stream = await WorkingMind.stream(input, mode, options);
    for await (const _chunk of stream) {
      // drain the stream
    }
    return stream.complete();
  }

  /**
   * Stream the response — yields content chunks as they arrive.
   */
  static async stream(
    input: string,
    mode: WorkingMindMode,
    options?: {
      conversation?: Record<string, unknown>;
      conversationHistory?: { role: "user" | "assistant"; content: string }[];
    },
  ): Promise<WorkingMindStream> {
    const response = await fetch("/api/working-mind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input,
        mode,
        conversation: options?.conversation,
        conversationHistory: options?.conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`WorkingMind API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response stream");
    }

    return new WorkingMindStream(reader);
  }
}
