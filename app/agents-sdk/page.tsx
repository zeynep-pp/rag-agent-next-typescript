"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AgentsSDKPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/agents-sdk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                done = true;
                break;
              }
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastIndex = newMessages.length - 1;
                      if (
                        lastIndex >= 0 &&
                        newMessages[lastIndex].role === "assistant"
                      ) {
                        newMessages[lastIndex] = {
                          ...newMessages[lastIndex],
                          content:
                            newMessages[lastIndex].content + parsed.content,
                        };
                      }
                      return newMessages;
                    });
                  }
                } catch (e) {
                  console.warn("Failed to parse streaming data:", data);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.content =
            "Sorry, there was an error processing your request.";
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">OpenAI Agents SDK Demo</h1>
        <p className="text-gray-600">
          Test the OpenAI Agents SDK with AI SDK adapter integration
        </p>
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Available tools:</strong> Analyze Data, Search
            Documents
          </p>
        </div>
      </div>

      <div className="border rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center mt-8">
            <p>Start a conversation with the agent!</p>
            <p className="text-sm mt-2">
              Try asking: "Analyze these documents" or "Search for information
              about..."
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-100 ml-8"
                  : "bg-white mr-8 border"
              }`}
            >
              <div className="font-semibold text-sm mb-1">
                {message.role === "user" ? "You" : "Agent"}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="bg-white mr-8 border p-3 rounded-lg">
            <div className="font-semibold text-sm mb-1">Agent</div>
            <div className="text-gray-500">Thinking...</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the agent something..."
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
