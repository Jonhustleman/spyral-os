/**
 * POST /api/working-mind — Unified AI Gateway for all SPYRAL experiences.
 *
 * Every page calls this endpoint. No page contains AI logic.
 *
 * Modes:
 *   research    → Discovery Lab (explore ideas, investigate)
 *   content     → Content Studio (create campaigns, content)
 *   consultant  → Strategy (business/life consulting)
 *   navigation  → Navigator (goal mapping)
 *   command     → Mission Control (unified command)
 *
 * Request:  { input, mode, conversation?, conversationHistory? }
 * Response: Server-Sent Events (text/event-stream)
 *   data: {"type":"chunk","content":"..."}
 *   data: {"type":"complete","response":{...}}
 *   data: {"type":"error","message":"..."}
 */
import { NextResponse } from "next/server";
import { SpyralCognitiveCore } from "@/core";
import type { ThinkInput, AgentType, ResearchMode, ConversationContext } from "@/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODE_TO_AGENT_TYPE: Record<string, AgentType> = {
  research: "research",
  content: "content",
  consultant: "consultant",
  navigation: "navigation",
  command: "command",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { input, mode, conversation, conversationHistory } = body;

    // Validate
    if (!input || !mode) {
      return NextResponse.json(
        { success: false, error: "input and mode are required." },
        { status: 400 },
      );
    }

    const agentType = MODE_TO_AGENT_TYPE[mode as string];
    if (!agentType) {
      return NextResponse.json(
        { success: false, error: `Invalid mode "${mode}". Must be one of: research, content, consultant, navigation, command.` },
        { status: 400 },
      );
    }

console.log(`[WorkingMind][GATEWAY] mode=${mode} agentType=${agentType} input="${input.substring(0, 80)}..."`);

    // Build the think input
    const thinkInput: ThinkInput = {
      input,
      agentType,
      conversation: conversation as ConversationContext | undefined,
      conversationHistory: conversationHistory as any[] | undefined,
    };

    // Create a ReadableStream to push SSE events to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call thinkStream on the server — this has access to process.env
          const cognitiveResponse = await SpyralCognitiveCore.thinkStream(
            thinkInput,
            (chunk: string) => {
              // Push each chunk as an SSE event
              const sseData = JSON.stringify({ type: "chunk", content: chunk });
              controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
            },
          );

          // Send the final response as an SSE event
          const completeData = JSON.stringify({
            type: "complete",
            response: {
              gateway: "working-mind-v1",
              input: cognitiveResponse.input,
              agentType: cognitiveResponse.agentType,
              mode,
              response: cognitiveResponse.response,
              reasoningResult: {
                provider: cognitiveResponse.reasoningResult.provider,
                model: cognitiveResponse.reasoningResult.model,
                usage: cognitiveResponse.reasoningResult.usage,
                reasoning: cognitiveResponse.reasoningResult.reasoning,
                cached: cognitiveResponse.reasoningResult.cached,
                error: cognitiveResponse.reasoningResult.error || undefined,
              },
              conversation: cognitiveResponse.conversation,
            },
          });
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
          controller.close();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "WorkingMind failed";
          console.error("[WorkingMind] Error:", errorMessage);
          const errorData = JSON.stringify({ type: "error", message: errorMessage });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 },
    );
  }
}
