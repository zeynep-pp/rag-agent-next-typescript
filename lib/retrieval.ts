import { VectorizeService } from "@/lib/vectorize";
import type { ChatSource } from "@/types/chat";

export interface RetrievalResult {
  contextDocuments: string;
  sources: ChatSource[];
}

export class RetrievalService {
  private vectorizeService: VectorizeService;

  constructor() {
    this.vectorizeService = new VectorizeService();
  }

  async retrieveContext(query: string): Promise<RetrievalResult> {
    try {
      const documents = await this.vectorizeService.retrieveDocuments(query);
      const contextDocuments =
        this.vectorizeService.formatDocumentsForContext(documents);
      const sources =
        this.vectorizeService.convertDocumentsToChatSources(documents);

      return {
        contextDocuments,
        sources,
      };
    } catch (error) {
      console.error("Retrieval failed:", error);
      return {
        contextDocuments: "Unable to retrieve relevant documents at this time.",
        sources: [],
      };
    }
  }

  async searchDocuments(query: string): Promise<string> {
    const result = await this.retrieveContext(query);
    return result.contextDocuments || "No relevant documents found.";
  }
}
