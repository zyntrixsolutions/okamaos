'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, CheckCircle, XCircle, FileCode, GitCommit, Eye, Trash2, Search, List, GitBranch, AlertCircle, Copy, Check, ChevronDown, ChevronRight, Zap } from "lucide-react";
import { streamAI, type ModelId, type HistoryMessage } from "@/lib/ai/router";
import { AGENT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { parseToolCalls, executeToolCall, buildProjectContext, type ToolExecution, type ToolCall, type AgentToolContext } from "@/lib/ai/agentTools";
import type { ProjectFile } from "@/lib/store/projects";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  rawContent: string;
  toolExecutions: ToolExecution[];
  timestamp: number;
}

interface AgentChatProps {
  projectFiles: ProjectFile[];
  projectName: string;
  projectId: string;
  model: ModelId;
  geminiKey: string;
  qwenKey: string;
  onFilesChange: (files: ProjectFile[]) => void;
  onCommit: (message: string) => void;
  onCreateBranch: (name: string) => void;
  onCreateIssue: (title: string, body: string, labels: string[]) => void;
  onRunPreview: () => void;
  errorContext?: string;
}

// ─── Tool Icon Map ────────────────────────────────────────────────────────────

function ToolIcon({ tool }: { tool: ToolCall["tool"] }) {
  const icons: Record<string, React.ReactNode> = {
    write_file: <FileCode size={11} />,
    read_file: <Eye size={11} />,
    delete_file: <Trash2 size={11} />,
    list_files: <List size={11} />,
    search_files: <Search size={11} />,
    commit: <GitCommit size={11} />,
    create_branch: <GitBranch size={11} />,
    create_issue: <AlertCircle size={11} />,
    run_preview: <Zap size={11} />,
  };
  return <>{icons[tool] ?? <Zap size={11} />}</>;
}

// ─── Tool Execution Badge ─────────────────────────────────────────────────────

function ToolBadge({ exec, expanded, onToggle }: {
  exec: ToolExecution;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { call, result, status } = exec;
  const label =
    call.tool === "write_file" ? `write ${call.params.path}` :
    call.tool === "read_file" ? `read ${call.params.path}` :
    call.tool === "delete_file" ? `delete ${call.params.path}` :
    call.tool === "commit" ? `commit "${call.params.message}"` :
    call.tool === "create_branch" ? `branch ${call.params.name}` :
    call.tool === "create_issue" ? `issue "${call.params.title}"` :
    call.tool === "search_files" ? `search "${call.params.query}"` :
    call.tool === "run_preview" ? "run preview" :
    call.tool;

  const color =
    status === "running" ? "#ffcf4a" :
    status === "done" && result?.success ? "#8df77f" :
    status === "error" || (result && !result.success) ? "#f26d5b" :
    "#c9c3b3";

  const hasOutput = result?.output && result.output.length > 0 &&
    call.tool !== "commit" && call.tool !== "run_preview" && call.tool !== "create_branch";

  return (
    <div className="my-1">
      <button
        onClick={hasOutput ? onToggle : undefined}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-colors"
        style={{
          background: "rgba(243,239,228,0.05)",
          border: `1px solid ${color}30`,
          color,
          cursor: hasOutput ? "pointer" : "default",
        }}
      >
        {status === "running" ? (
          <Loader2 size={10} className="animate-spin" />
        ) : result?.success ? (
          <CheckCircle size={10} />
        ) : (
          <XCircle size={10} />
        )}
        <ToolIcon tool={call.tool} />
        <span>{label}</span>
        {hasOutput && (expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />)}
      </button>
      {expanded && hasOutput && result?.output && (
        <pre
          className="mt-1 px-2 py-1.5 rounded text-xs font-mono overflow-auto max-h-32"
          style={{ background: "rgba(0,0,0,0.3)", color: "#8df77f", borderLeft: `2px solid ${color}` }}
        >
          {result.output.slice(0, 800)}
        </pre>
      )}
    </div>
  );
}

// ─── Message Renderer ─────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3).replace(/^(python|py|json)\n/, "");
      return (
        <pre key={i} className="my-2 p-3 rounded-lg text-xs font-mono overflow-auto" style={{ background: "#0d0f0c", color: "#8df77f", border: "1px solid rgba(141,247,127,0.12)" }}>
          {inner}
        </pre>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="px-1 rounded text-xs font-mono" style={{ background: "rgba(141,247,127,0.10)", color: "#8df77f" }}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#f3efe4" }}>{part.slice(2, -2)}</strong>;
    }
    // Handle line breaks
    return part.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>{line}{j < part.split("\n").length - 1 && <br />}</span>
    ));
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentChat({
  projectFiles,
  projectName,
  projectId,
  model,
  geminiKey,
  qwenKey,
  onFilesChange,
  onCommit,
  onCreateBranch,
  onCreateIssue,
  onRunPreview,
  errorContext,
}: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `# Okama Agent Ready\n\nI'm your agentic game dev AI. I can **write, edit, and organize files directly** — no copy-paste needed.\n\n**What I can do:**\n- Build full games across multiple files\n- Create branches, commits, and issues\n- Split code into clean modules automatically\n- Run previews and debug errors\n\nTell me what to build, or ask me to improve the current project.`,
      rawContent: "",
      toolExecutions: [],
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track files ref so the agent loop always has latest
  const filesRef = useRef(projectFiles);
  filesRef.current = projectFiles;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Handle error context from preview
  useEffect(() => {
    if (!errorContext) return;
    const prompt = `Fix this runtime error in my game:\n\`\`\`\n${errorContext}\n\`\`\``;
    setInput(prompt);
  }, [errorContext]);

  const toggleToolExpand = (execId: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      next.has(execId) ? next.delete(execId) : next.add(execId);
      return next;
    });
  };

  const copyCode = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // ─── Agentic Send ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || streaming) return;
    setInput("");
    setError("");

    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      rawContent: userText,
      toolExecutions: [],
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = crypto.randomUUID();
    const assistantMsg: AgentMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      rawContent: "",
      toolExecutions: [],
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setStreaming(true);
    setStreamingText("");

    try {
      // Build history (skip welcome, include real conversation)
      const history: HistoryMessage[] = messages
        .filter((m) => m.id !== "welcome" && m.content)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          content: m.role === "assistant" ? m.content : m.content,
        }));

      // Enrich user message with project context
      const projectContext = buildProjectContext(filesRef.current, projectName);
      const enrichedMessage = `${userText}\n\n---\n${projectContext}`;

      // Stream AI response
      let fullResponse = "";
      for await (const chunk of streamAI(
        { model, geminiKey, qwenKey },
        "game",
        history,
        history.length === 0 ? enrichedMessage : userText,
        AGENT_SYSTEM_PROMPT
      )) {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      }

      // Parse and execute tool calls
      const { calls, displayText } = parseToolCalls(fullResponse);
      const executions: ToolExecution[] = calls.map((call) => ({
        call,
        result: null,
        status: "pending" as const,
      }));

      // Set message with pending executions
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId
          ? { ...m, content: displayText, rawContent: fullResponse, toolExecutions: executions }
          : m
        )
      );
      setStreamingText("");

      // Execute tools sequentially
      if (calls.length > 0) {
        let currentFiles = filesRef.current;

        for (let i = 0; i < calls.length; i++) {
          const call = calls[i];
          const execId = `${assistantId}-${i}`;

          // Mark as running
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId
              ? { ...m, toolExecutions: m.toolExecutions.map((e, idx) => idx === i ? { ...e, status: "running" as const } : e) }
              : m
            )
          );

          const ctx: AgentToolContext = {
            files: currentFiles,
            projectId,
            projectName,
            onFilesChange: (newFiles) => {
              currentFiles = newFiles;
              onFilesChange(newFiles);
            },
            onCommit: (msg) => onCommit(msg),
            onCreateBranch: (name) => onCreateBranch(name),
            onCreateIssue: (title, body, labels) => onCreateIssue(title, body, labels),
            onRunPreview: () => onRunPreview(),
          };

          const result = await executeToolCall(call, ctx);

          // Mark as done
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId
              ? {
                  ...m,
                  toolExecutions: m.toolExecutions.map((e, idx) =>
                    idx === i ? { ...e, result, status: result.success ? "done" as const : "error" as const } : e
                  ),
                }
              : m
            )
          );
          void execId; // suppress unused warning
        }

        // If read_file / list_files / search returned data, do a follow-up turn
        const dataResults = executions
          .map((e, i) => ({ call: e.call, result: calls[i] }))
          .filter((_, i) => {
            const tool = calls[i].tool;
            return tool === "read_file" || tool === "list_files" || tool === "search_files";
          });

        if (dataResults.length > 0) {
          // Build tool results message and continue
          // (simplified: just feed results back in a follow-up - future enhancement)
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, content: `Error: ${msg}` } : m
      ));
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  }, [streaming, messages, model, geminiKey, qwenKey, projectName, projectId, onFilesChange, onCommit, onCreateBranch, onCreateIssue, onRunPreview]);

  const send = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const hasKey = geminiKey || qwenKey;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" style={{ background: "#10120f" }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0"
        style={{ borderColor: "rgba(243,239,228,0.08)", background: "#181a16" }}
      >
        <Zap size={14} style={{ color: "#8df77f" }} />
        <span className="text-xs font-bold" style={{ color: "#f3efe4" }}>Okama Agent</span>
        <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(141,247,127,0.08)", color: "#8df77f" }}>
          {model.replace("gemini-", "").replace("-preview", "")}
        </span>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: "#6b7464" }}>
          {projectFiles.filter(f => f.type !== "asset").length} files
        </span>
      </div>

      {/* No-key warning */}
      {!hasKey && (
        <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: "rgba(243,239,228,0.08)", background: "rgba(242,109,91,0.06)" }}>
          <p className="text-xs" style={{ color: "#f26d5b" }}>
            No API key set.{" "}
            <a href="/settings" className="underline">Add in Settings →</a>
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: msg.role === "assistant" ? "rgba(141,247,127,0.12)" : "rgba(243,239,228,0.08)",
              }}
            >
              {msg.role === "assistant"
                ? <Bot size={12} style={{ color: "#8df77f" }} />
                : <User size={12} style={{ color: "#c9c3b3" }} />
              }
            </div>

            {/* Bubble */}
            <div className={`flex-1 min-w-0 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
              <div
                className="rounded-xl px-3 py-2.5 text-xs leading-relaxed max-w-full"
                style={{
                  background: msg.role === "user" ? "rgba(243,239,228,0.06)" : "transparent",
                  color: "#c9c3b3",
                  border: msg.role === "user" ? "1px solid rgba(243,239,228,0.08)" : "none",
                }}
              >
                {msg.role === "assistant" ? (
                  <div>{renderMarkdown(msg.content)}</div>
                ) : (
                  <span style={{ color: "#f3efe4" }}>{msg.content}</span>
                )}

                {/* Tool executions */}
                {msg.toolExecutions.length > 0 && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: "rgba(243,239,228,0.06)" }}>
                    {msg.toolExecutions.map((exec, i) => (
                      <ToolBadge
                        key={i}
                        exec={exec}
                        expanded={expandedTools.has(`${msg.id}-${i}`)}
                        onToggle={() => toggleToolExpand(`${msg.id}-${i}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {streaming && streamingText && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(141,247,127,0.12)" }}>
              <Bot size={12} style={{ color: "#8df77f" }} />
            </div>
            <div className="flex-1 rounded-xl px-3 py-2.5 text-xs leading-relaxed" style={{ color: "#6b7464" }}>
              <Loader2 size={10} className="inline animate-spin mr-1" />
              <span style={{ color: "#c9c3b3" }}>{streamingText.slice(-200)}</span>
            </div>
          </div>
        )}

        {streaming && !streamingText && (
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(141,247,127,0.12)" }}>
              <Loader2 size={12} className="animate-spin" style={{ color: "#8df77f" }} />
            </div>
            <span className="text-xs" style={{ color: "#6b7464" }}>Agent thinking…</span>
          </div>
        )}

        {error && (
          <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(242,109,91,0.08)", color: "#f26d5b", border: "1px solid rgba(242,109,91,0.2)" }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t shrink-0 p-2" style={{ borderColor: "rgba(243,239,228,0.08)" }}>
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ background: "#181a16", border: "1px solid rgba(243,239,228,0.10)" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder={streaming ? "Agent is working…" : "Ask the agent to build, fix, or improve your game…"}
            disabled={streaming}
            rows={1}
            className="flex-1 bg-transparent text-xs resize-none outline-none min-h-[20px]"
            style={{ color: "#f3efe4", caretColor: "#8df77f" }}
          />
          <button
            onClick={send}
            disabled={streaming || !input.trim() || !hasKey}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: streaming || !input.trim() || !hasKey ? "rgba(141,247,127,0.06)" : "#8df77f",
              color: streaming || !input.trim() || !hasKey ? "#6b7464" : "#10120f",
            }}
          >
            {streaming ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
        <p className="text-xs mt-1 px-1" style={{ color: "#6b7464" }}>
          Agent writes full files directly · Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
