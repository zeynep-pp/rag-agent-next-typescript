import { Agent, Runner, tool } from "@openai/agents";
import { openai } from "@ai-sdk/openai";
import { aisdk } from "@openai/agents-extensions";
import { z } from "zod";
import { RetrievalService } from "@/lib/retrieval";
import { fetchConnectedPapers } from "@/lib/connectedPapersTool";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: AgentMessage[] } = await req.json();

    const model = aisdk(openai("gpt-4o"));

    const agent = new Agent({
      name: "AI SDK Agent Assistant",
      instructions: `You are a helpful assistant that can access proprietary document sources and analyze data from them. 
      
      When users ask questions:
      1. Use available tools to gather and analyze relevant information
      2. Provide comprehensive answers based on the data retrieved and analyzed
      3. Be clear about what information comes from which sources`,
      model,
      tools: [
        tool({
          name: "searchDocuments",
          description:
            "Search through proprietary document sources for relevant information",
          parameters: z.object({
            query: z
              .string()
              .describe("The search query to find relevant documents"),
          }),
          execute: async ({ query }) => {
            const retrievalService = new RetrievalService();
            const documents = await retrievalService.searchDocuments(query);
            return `Search completed for query: ${query}. Documents retrieved: ${documents}.`;
          },
        }),
        tool({
          name: "analyzeData",
          description: "Analyze data from the retrieved documents",
          parameters: z.object({
            documents: z.array(z.string()).describe("The documents to analyze"),
          }),
          execute: async ({ documents }) => {
            // Example analysis logic
            const analysisResult = documents.map(doc => `Analysis of ${doc}`);
            return `Analysis completed. Results: ${analysisResult.join(", ")}`;
          },
        }),
        tool({
          name: "fetchConnectedPapers",
          description: "Fetch a visual overview of papers related to a specific field using Connected Papers",
          parameters: z.object({
            seedPaperId: z.string().describe("The ID of the seed paper to find related papers"),
          }),
          execute: async ({ seedPaperId }) => {
            const papers = await fetchConnectedPapers(seedPaperId);
            return papers;
          },
        }),
      ],
    });

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== "user") {
      return Response.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    const runner = new Runner({
      model,
    });

    const stream = await runner.run(agent, latestMessage.content, {
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const textStream = stream.toTextStream({
            compatibleWithNodeStreams: false,
          });

          for await (const chunk of textStream) {
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          await stream.completed;
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in agents SDK endpoint:", error);
    return Response.json(
      { error: "Failed to process request with Agents SDK" },
      { status: 500 }
    );
  }
}
