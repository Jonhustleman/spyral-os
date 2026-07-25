/**
 * POST /api/reasoning — Stream a response from the SPYRAL Cognitive Core.
 *
 * Server-side API route that proxies reasoning requests to the LLM.
 * This allows the client to access the reasoning pipeline without
 * exposing API keys or running LLM calls from the browser.
 *
 * Request body:
 *   { input: string, agentType: AgentType, researchMode?: string,
 *     conversation?: ConversationContext, conversationHistory?: Message[] }
 *
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { input, agentType, researchMode, conversation, conversationHistory } = body;

    // Validate required fields
    if (!input || !agentType) {
      return NextResponse.json(
        { success: false, error: "input and agentType are required." },
        { status: 400 },
      );
    }

    // Build the think input
    const thinkInput: ThinkInput = {
      input,
      agentType: agentType as AgentType,
      researchMode: researchMode as ResearchMode | undefined,
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
              input: cognitiveResponse.input,
              agentType: cognitiveResponse.agentType,
              researchMode: cognitiveResponse.researchMode,
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
          const errorMessage = err instanceof Error ? err.message : "Reasoning failed";
          const errorData = JSON.stringify({ type: "error", message: errorMessage });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Return the SSE stream
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
