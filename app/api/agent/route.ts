import { ToolInvocation, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { RetrievalService } from "@/lib/retrieval";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolInvocations?: ToolInvocation[];
}

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: "You are a helpful assistant.",
    messages,
    onStepFinish(result) {},
    tools: {
      getSources: {
        description: "This will pull information from your proprietary sources",
        parameters: z.object({
          query: z
            .string()
            .describe("The search query to find relevant documents"),
        }),
        execute: async ({ query }) => {
          const retrievalService = new RetrievalService();
          const documents = await retrievalService.searchDocuments(query);
          return documents;
        },
      },
      analyzeData: {
        description: "Analyze data from the retrieved documents",
        parameters: z.object({
          documents: z.array(z.string()).describe("The documents to analyze"),
        }),
        execute: async ({ documents }) => {
          // Example analysis logic
          const analysisResult = documents.map((doc: string) => `Analysis of ${doc}`);
          return `Analysis completed. Results: ${analysisResult.join(", ")}`;
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
