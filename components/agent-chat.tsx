"use client";

import { useChat } from "@ai-sdk/react";

export default function AgentChat() {
  const { messages, input, setInput, append } = useChat({
    api: "/api/agent",
    maxSteps: 10,
  });

  return (
    <div className="flex flex-col h-[90vh] max-w-md mx-auto">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 p-3 rounded-lg ${
              message.role === "user"
                ? "bg-blue-100 ml-auto max-w-xs"
                : "bg-gray-100 mr-auto max-w-xs"
            }`}
          >
            <div className="text-sm font-semibold mb-1 capitalize">
              {message.role}
            </div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 border rounded-lg"
            placeholder="Ask about the analysis or search documents..."
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
            onKeyDown={async (event) => {
              if (event.key === "Enter") {
                append({ content: input, role: "user" });
                setInput("");
              }
            }}
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => {
              if (input.trim()) {
                append({ content: input, role: "user" });
                setInput("");
              }
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
