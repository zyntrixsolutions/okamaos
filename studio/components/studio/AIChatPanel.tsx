'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Sparkles, Copy, Check, AlertCircle, ExternalLink } from "lucide-react";
import { streamAI, type ModelId, type HistoryMessage } from "@/lib/ai/router";

interface AIChatPanelProps {
  projectCode: string;
  projectName: string;
  model: ModelId;
  geminiKey: string;
  qwenKey: string;
  onApplyCode?: (code: string) => void;
  mode?: "game" | "tutor";
  errorContext?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const ONBOARDING_PROMPT = `Hi! I'm your Okama Studio AI — let's build something amazing together! 🎮

Before I start generating code, I have a few quick questions:

1. **Who's the main character?** (human, robot, animal, spaceship, something weird?)
2. **What's the vibe?** (dark/moody, bright cartoon, retro pixel, cinematic?)
3. **What's the core mechanic?** (platformer jump, top-down shooting, RPG dialogue, puzzle solving?)
4. **Any specific assets you want to use?** Drop images or audio in the Assets tab and I'll integrate them.

Answer any or all — even one sentence is enough to get started! ✨`;

function extractCodeBlocks(text: string): string[] {
  const regex = /```(?:python|py)?\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

function renderMessage(content: string, onApply?: (code: string) => void) {
  const parts = content.split(/(```(?:python|py)?[\s\S]*?```)/g);
  return parts.map((part, i) => {
    const codeMatch = part.match(/```(?:python|py)?\n([\s\S]*?)```/);
    if (codeMatch) {
      const code = codeMatch[1].trim();
      return (
        <CodeBlock key={i} code={code} onApply={onApply} />
      );
    }
    // Bold and inline code
    const rendered = part
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, '<code style="background:rgba(141,247,127,0.1);color:#8df77f;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:0.85em">$1</code>');
    return (
      <span
        key={i}
        dangerouslySetInnerHTML={{ __html: rendered }}
        style={{ whiteSpace: "pre-wrap" }}
      />
    );
  });
}

function CodeBlock({ code, onApply }: { code: string; onApply?: (code: string) => void }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="my-2 rounded-lg overflow-hidden border"
      style={{ borderColor: "rgba(141,247,127,0.2)", background: "#181a16" }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b"
        style={{ borderColor: "rgba(243,239,228,0.08)" }}
      >
        <span className="text-xs font-mono font-bold" style={{ color: "#8df77f" }}>python</span>
        <div className="flex gap-2">
          <button onClick={copy} className="text-xs flex items-center gap-1" style={{ color: "#c9c3b3" }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          {onApply && (
            <button
              onClick={() => onApply(code)}
              className="text-xs font-bold flex items-center gap-1"
              style={{ color: "#8df77f" }}
            >
              <Sparkles size={12} /> Apply to Editor
            </button>
          )}
        </div>
      </div>
      <pre
        className="p-3 overflow-x-auto text-xs font-mono"
        style={{ color: "#f3efe4", margin: 0, background: "transparent" }}
      >
        {code}
      </pre>
    </div>
  );
}

export default function AIChatPanel({
  projectCode,
  projectName,
  model,
  geminiKey,
  qwenKey,
  onApplyCode,
  mode = "game",
  errorContext,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: ONBOARDING_PROMPT,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle error context from preview
  useEffect(() => {
    if (!errorContext) return;
    const prompt = `I got this error when running my game. Please fix it:\n\n\`\`\`\n${errorContext}\n\`\`\``;
    setInput(prompt);
    // Auto-send if we have keys configured
    if (geminiKey || qwenKey) {
      // Give user a moment to see the error before sending
      const t = setTimeout(() => {
        sendMessage(prompt);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [errorContext]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    setInput("");
    setError("");

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    // Build history for the AI (exclude the empty assistant placeholder)
    const history: HistoryMessage[] = messages
      .filter((m) => m.content)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        content: m.content,
      }));

    // Include current code context in first user turn
    const contextualMessage = `[Current project: ${projectName}]\n[Current main.py preview]:\n\`\`\`python\n${projectCode.slice(0, 800)}${projectCode.length > 800 ? "\n... (truncated)" : ""}\n\`\`\`\n\n${text}`;

    try {
      let full = "";
      for await (const chunk of streamAI(
        { model, geminiKey, qwenKey },
        mode,
        history,
        messages.length <= 1 ? contextualMessage : text
      )) {
        full += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStreaming(false);
    }
  }, [streaming, messages, projectCode, projectName, model, geminiKey, qwenKey, mode]);

  const send = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleApply = (code: string) => {
    // Find the longest/most complete code block as the "main" code
    onApplyCode?.(code);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#10120f" }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0"
        style={{ borderColor: "rgba(243,239,228,0.08)", background: "#181a16" }}
      >
        <Bot size={15} style={{ color: "#8df77f" }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8df77f" }}>
          Okama AI
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-mono ml-auto"
          style={{ background: "rgba(83,217,230,0.10)", color: "#53d9e6", border: "1px solid rgba(83,217,230,0.15)" }}
        >
          {model}
        </span>
      </div>

      {/* No-key warning */}
      {!geminiKey && !qwenKey && (
        <div
          className="mx-3 mt-2 p-3 rounded-xl flex flex-col gap-2 shrink-0"
          style={{ background: "rgba(255,207,74,0.07)", border: "1px solid rgba(255,207,74,0.22)" }}
        >
          <p className="text-xs font-bold" style={{ color: "#ffcf4a" }}>No AI key configured</p>
          <p className="text-xs leading-relaxed" style={{ color: "#c9c3b3" }}>
            AI features require a free Gemini or Qwen key. This is the{" "}
            <strong style={{ color: "#f3efe4" }}>Stellar Drift demo</strong> — you can still run the
            game in the <strong style={{ color: "#f3efe4" }}>Preview</strong> tab and read the code
            without a key.
          </p>
          <div className="flex gap-2 flex-wrap">
            <a
              href="/settings"
              className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
              style={{ background: "#ffcf4a", color: "#10120f" }}
            >
              Add Key
            </a>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs"
              style={{ color: "#6b7464" }}
            >
              Get free Gemini key <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5"
              style={{
                background: msg.role === "assistant" ? "rgba(141,247,127,0.12)" : "rgba(83,217,230,0.12)",
              }}
            >
              {msg.role === "assistant" ? (
                <Bot size={14} style={{ color: "#8df77f" }} />
              ) : (
                <User size={14} style={{ color: "#53d9e6" }} />
              )}
            </div>
            <div
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm leading-relaxed"
              style={{
                background: msg.role === "assistant" ? "#181a16" : "rgba(83,217,230,0.08)",
                color: "#f3efe4",
                border: "1px solid",
                borderColor: msg.role === "assistant" ? "rgba(243,239,228,0.08)" : "rgba(83,217,230,0.15)",
                maxWidth: "calc(100% - 40px)",
              }}
            >
              {msg.content ? (
                renderMessage(msg.content, msg.role === "assistant" ? handleApply : undefined)
              ) : (
                <span className="flex gap-1 items-center" style={{ color: "#6b7464" }}>
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                </span>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg"
            style={{ background: "rgba(242,109,91,0.10)", border: "1px solid rgba(242,109,91,0.25)" }}
          >
            <AlertCircle size={15} style={{ color: "#f26d5b", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: "#f26d5b" }}>Error</p>
              <p className="text-xs" style={{ color: "#c9c3b3" }}>{error}</p>
              {error.includes("key") && (
                <a href="/settings" className="text-xs underline mt-1 inline-block" style={{ color: "#ffcf4a" }}>
                  Go to Settings →
                </a>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="border-t p-3 shrink-0"
        style={{ borderColor: "rgba(243,239,228,0.08)", background: "#181a16" }}
      >
        <div
          className="flex gap-2 rounded-xl border overflow-hidden"
          style={{
            borderColor: streaming ? "rgba(141,247,127,0.3)" : "rgba(243,239,228,0.12)",
            background: "#10120f",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to build, fix, or explain… (Enter to send)"
            rows={2}
            disabled={streaming}
            className="flex-1 bg-transparent resize-none px-3 py-2.5 text-sm outline-none"
            style={{ color: "#f3efe4", caretColor: "#8df77f" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="flex items-center justify-center w-10 m-1.5 rounded-lg transition-colors shrink-0"
            style={{
              background: input.trim() && !streaming ? "#8df77f" : "rgba(141,247,127,0.10)",
              color: input.trim() && !streaming ? "#10120f" : "#6b7464",
              cursor: !input.trim() || streaming ? "not-allowed" : "pointer",
            }}
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-xs mt-1.5 text-center" style={{ color: "#6b7464" }}>
          Shift+Enter for new line · AI builds code you can apply instantly
        </p>
      </div>
    </div>
  );
}
