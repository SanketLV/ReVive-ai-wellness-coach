"use client";

import {
  ActivityIcon,
  HeartIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import AiInput from "../components/ai-input";
import { useSidebar } from "@/components/ui/sidebar";
import ChatBubble from "../components/chat-bubble";

export default function WorkingChatbot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggleSidebar, isMobile } = useSidebar();
  const [hasHealthContext, setHasHealthContext] = useState(false);
  const [responseSource, setResponseSource] = useState<
    "cache" | "generated" | null
  >(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    status,
    error,
  } = useChat({
    api: "/api/chat",
    onResponse: (response) => {
      const source = response.headers.get("X-Response-Source");
      const healthContext = response.headers.get("X-Health-Context") === "true";

      setResponseSource(
        source === "cache" || source === "generated" ? source : null
      );
      setHasHealthContext(healthContext);

      console.log("Response Source:", source);
      console.log("Health Context:", healthContext);
    },
  });

  // Check if the AI is currently generating a response
  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (!input.trim()) return;
      setResponseSource(null); //* Reset for new message
      originalHandleSubmit(e);
    },
    [originalHandleSubmit, input]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <div className="p-6 space-y-6 mx-auto flex h-svh w-full max-w-4xl flex-col pb-0.5">
        {/* Header with Health Context Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isMobile ? (
              <MenuIcon className="size-6" onClick={toggleSidebar} />
            ) : (
              <PanelLeftCloseIcon
                className="size-6 cursor-pointer"
                onClick={toggleSidebar}
              />
            )}
            <h1 className="text-3xl font-bold font-rockSalt">Chat</h1>
          </div>

          {/* Health Context Status */}
          {hasHealthContext && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
              <HeartIcon className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Health data active
              </span>
            </div>
          )}
        </div>

        <div
          ref={containerRef}
          className="border-primary/20 bg-card/40 text-card-foreground h-full flex-1 overflow-y-auto rounded-xl border p-4 text-sm leading-6 shadow-md sm:text-base sm:leading-7"
        >
          {messages.length > 0 ? (
            messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isAssistant = message.role === "assistant";

              return (
                <div key={message.id} className="relative">
                  <ChatBubble
                    key={message.id}
                    message={message.content}
                    isUser={message.role === "user"}
                    timestamp={new Date()}
                  />
                  {/* Response indicators for the last assistant message */}
                  {isLastMessage && isAssistant && responseSource && (
                    <div className="flex items-center gap-2 mt-2 mb-4">
                      {responseSource === "cache" ? (
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                          <Sparkles className="h-3 w-3" />
                          <span>Cached response</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                          <ActivityIcon className="h-3 w-3" />
                          <span>Generated response</span>
                        </div>
                      )}

                      {hasHealthContext && (
                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <HeartIcon className="h-3 w-3" />
                          <span>With health data</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <p className="text-muted-foreground mx-auto px-2 text-center text-xl font-semibold tracking-wide md:text-2xl">
                Start Chatting with
                <br />
                <span className="text-primary text-2xl font-bold md:text-4xl font-rockSalt">
                  ReVive
                </span>
                <br />
                Your Personal AI Wellness Coach
              </p>

              {/* Health-aware suggestions */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <button
                  onClick={() =>
                    handleInputChange({
                      target: { value: "How has my sleep been this week?" },
                    } as any)
                  }
                  className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ActivityIcon className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Sleep Analysis
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Ask about your sleep patterns and trends
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleInputChange({
                      target: {
                        value: "Am I meeting my daily activity goals?",
                      },
                    } as any)
                  }
                  className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <HeartIcon className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">
                      Goal Progress
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    Check your progress toward health goals
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleInputChange({
                      target: {
                        value: "Give me personalized health recommendations",
                      },
                    } as any)
                  }
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-900">
                      Recommendations
                    </span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Get AI-powered health suggestions
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleInputChange({
                      target: {
                        value:
                          "What insights do you have about my health data?",
                      },
                    } as any)
                  }
                  className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 text-left transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ActivityIcon className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-900">
                      Health Insights
                    </span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Discover patterns in your health data
                  </p>
                </button>
              </div>

              <div className="group relative mt-6">
                <div className="from-primary/30 to-primary/10 absolute -inset-1 rounded-full bg-gradient-to-r opacity-75 blur-md transition-opacity duration-500 group-hover:opacity-100"></div>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="bg-primary/5 mx-auto flex w-fit items-center gap-2 rounded-full px-4 py-2">
              <Sparkles className="text-primary h-4 w-4 animate-pulse" />
              <span className="from-primary/80 to-primary animate-pulse bg-gradient-to-r bg-clip-text text-sm font-medium text-transparent">
                Generating response...
              </span>
            </div>
          )}
          {error && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive mx-auto w-fit rounded-lg border p-3">
              Something went wrong! Please try again.
            </div>
          )}
        </div>

        <form
          className="my-2 border-2 rounded-xl shadow-md"
          onSubmit={handleSubmit}
        >
          <div className="relative rounded-xl">
            <AiInput
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
            />
          </div>
        </form>
      </div>
    </>
  );
}
