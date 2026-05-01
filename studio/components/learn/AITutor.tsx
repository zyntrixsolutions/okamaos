'use client';

import { useState, useRef, useEffect } from "react";
import { Send, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { streamAI, type ModelId, type HistoryMessage } from "@/lib/ai/router";
import type { Lesson } from "@/lib/lessons/curriculum";

interface AITutorProps {
  lesson: Lesson;
  userCode?: string;
  model: ModelId;
  geminiKey: string;
  qwenKey: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AITutor({ lesson, userCode, model, geminiKey, qwenKey }: AITutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content: `Hi! I'm your AI tutor for **${lesson.title}**. 🎓\n\nAsk me anything about this lesson — what a variable is, why loops are useful, or "why is my code not working?". I'm here to help you understand, not just give you answers!\n\nWhat's on your mind? 😊`,
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setError("");

    const uid = crypto.randomUUID();
    const aid = crypto.randomUUID();
    setMessages((p) => [
      ...p,
      { id: uid, role: "user", content: text },
      { id: aid, role: "assistant", content: "" },
    ]);
    setStreaming(true);

    const history: HistoryMessage[] = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      content: m.content,
    }));

    const context = `[Lesson: ${lesson.title} (Chapter ${lesson.chapter})]\n[Concept: ${lesson.concept}]\n${userCode ? `[Student's current code]:\n\`\`\`python\n${userCode.slice(0, 400)}\n\`\`\`\n` : ""}\n\nStudent question: ${text}`;

    try {
      let full = "";
      for await (const chunk of streamAI({ model, geminiKey, qwenKey }, "tutor", history, context)) {
        full += chunk;
        setMessages((p) => p.map((m) => m.id === aid ? { ...m, content: full } : m));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setMessages((p) => p.filter((m) => m.id !== aid));
    } finally {
      setStreaming(false);
    }
  };

  const formatContent = (content: string) =>
    content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, `<code style="background:rgba(83,217,230,0.12);color:#53d9e6;padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>`);

  return (
    <div
      className="rounded-xl border flex flex-col overflow-hidden"
      style={{ borderColor: "rgba(243,239,228,0.10)", background: "#181a16", height: 380 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
        style={{ borderColor: "rgba(243,239,228,0.08)" }}
      >
        <BookOpen size={14} style={{ color: "#53d9e6" }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#53d9e6" }}>
          AI Tutor
        </span>
        <span className="text-xs ml-auto" style={{ color: "#6b7464" }}>{model}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 text-xs font-bold"
              style={{
                background: msg.role === "assistant" ? "rgba(83,217,230,0.12)" : "rgba(141,247,127,0.12)",
                color: msg.role === "assistant" ? "#53d9e6" : "#8df77f",
              }}
            >
              {msg.role === "assistant" ? "AI" : "U"}
            </div>
            <div
              className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs leading-relaxed"
              style={{
                background: msg.role === "assistant" ? "rgba(243,239,228,0.04)" : "rgba(83,217,230,0.06)",
                color: "#f3efe4",
                border: "1px solid",
                borderColor: msg.role === "assistant" ? "rgba(243,239,228,0.06)" : "rgba(83,217,230,0.12)",
                maxWidth: "calc(100% - 32px)",
              }}
            >
              {msg.content ? (
                <span
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  style={{ whiteSpace: "pre-wrap" }}
                />
              ) : (
                <span style={{ color: "#6b7464" }}>
                  <span className="animate-pulse">●</span>{" "}
                  <span className="animate-pulse" style={{ animationDelay: "0.15s" }}>●</span>{" "}
                  <span className="animate-pulse" style={{ animationDelay: "0.3s" }}>●</span>
                </span>
              )}
            </div>
          </div>
        ))}
        {error && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#f26d5b" }}>
            <AlertCircle size={12} /> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="border-t p-2 shrink-0"
        style={{ borderColor: "rgba(243,239,228,0.08)" }}
      >
        <div
          className="flex gap-1.5 rounded-lg overflow-hidden border"
          style={{ borderColor: "rgba(243,239,228,0.10)", background: "#10120f" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask your tutor…"
            disabled={streaming}
            className="flex-1 bg-transparent px-3 py-2 text-xs outline-none"
            style={{ color: "#f3efe4" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="flex items-center justify-center w-8 my-1 mr-1 rounded transition-colors"
            style={{
              background: input.trim() && !streaming ? "#8df77f" : "rgba(141,247,127,0.08)",
              color: input.trim() && !streaming ? "#10120f" : "#6b7464",
            }}
          >
            {streaming ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}
