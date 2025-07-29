"use client";

import { MenuIcon, PanelLeftCloseIcon, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import AiInput from "../components/ai-input";
import { useSidebar } from "@/components/ui/sidebar";
import ChatBubble from "../components/chat-bubble";

export default function WorkingChatbot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggleSidebar, isMobile } = useSidebar();

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
      console.log("Response Source:", source);
    },
  });

  // Check if the AI is currently generating a response
  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (!input.trim()) return;
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

        <div
          ref={containerRef}
          className="border-primary/20 bg-card/40 text-card-foreground h-full flex-1 overflow-y-auto rounded-xl border p-4 text-sm leading-6 shadow-md sm:text-base sm:leading-7"
        >
          {messages.length > 0 ? (
            messages.map((message) => {
              return (
                <ChatBubble
                  key={message.id}
                  message={message.content}
                  isUser={message.role === "user"}
                  timestamp={new Date()}
                />
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
