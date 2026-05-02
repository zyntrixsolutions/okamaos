'use client';

import type { ProjectFile } from "@/lib/store/projects";

// ─── Tool Types ──────────────────────────────────────────────────────────────

export type ToolName =
  | "write_file"
  | "read_file"
  | "delete_file"
  | "list_files"
  | "search_files"
  | "commit"
  | "create_branch"
  | "create_issue"
  | "run_preview";

export interface ToolCall {
  tool: ToolName;
  params: Record<string, string>;
}

export interface ToolResult {
  tool: ToolName;
  params: Record<string, string>;
  success: boolean;
  output: string;
}

export interface ToolExecution {
  call: ToolCall;
  result: ToolResult | null;
  status: "pending" | "running" | "done" | "error";
}

export interface AgentToolContext {
  files: ProjectFile[];
  projectId: string;
  projectName: string;
  onFilesChange: (files: ProjectFile[]) => void;
  onCommit: (message: string) => void;
  onCreateBranch: (name: string) => void;
  onCreateIssue: (title: string, body: string, labels: string[]) => void;
  onRunPreview: () => void;
}

// ─── Tool Call Parser ─────────────────────────────────────────────────────────

/**
 * Parse tool calls from raw AI response text.
 * Returns the calls found and a display-ready version of the text.
 */
export function parseToolCalls(text: string): { calls: ToolCall[]; displayText: string } {
  const calls: ToolCall[] = [];
  let display = text;

  // <write_file path="...">content</write_file>
  const writeRe = /<write_file\s+path="([^"]+)">([\s\S]*?)<\/write_file>/g;
  let m: RegExpExecArray | null;
  while ((m = writeRe.exec(text)) !== null) {
    calls.push({ tool: "write_file", params: { path: m[1], content: m[2].replace(/^\n/, "") } });
    const lines = m[2].split("\n").length;
    display = display.replace(m[0], `\`[write_file: ${m[1]} — ${lines} lines]\``);
  }

  // <read_file path="..." />
  const readRe = /<read_file\s+path="([^"]+)"\s*\/>/g;
  while ((m = readRe.exec(text)) !== null) {
    calls.push({ tool: "read_file", params: { path: m[1] } });
    display = display.replace(m[0], `\`[read_file: ${m[1]}]\``);
  }

  // <delete_file path="..." />
  const deleteRe = /<delete_file\s+path="([^"]+)"\s*\/>/g;
  while ((m = deleteRe.exec(text)) !== null) {
    calls.push({ tool: "delete_file", params: { path: m[1] } });
    display = display.replace(m[0], `\`[delete_file: ${m[1]}]\``);
  }

  // <list_files />
  if (/<list_files\s*\/>/.test(text)) {
    calls.push({ tool: "list_files", params: {} });
    display = display.replace(/<list_files\s*\/>/g, "`[list_files]`");
  }

  // <search_files query="..." />
  const searchRe = /<search_files\s+query="([^"]+)"\s*\/>/g;
  while ((m = searchRe.exec(text)) !== null) {
    calls.push({ tool: "search_files", params: { query: m[1] } });
    display = display.replace(m[0], `\`[search_files: "${m[1]}"]\``);
  }

  // <commit message="..." />
  const commitRe = /<commit\s+message="([^"]+)"\s*\/>/g;
  while ((m = commitRe.exec(text)) !== null) {
    calls.push({ tool: "commit", params: { message: m[1] } });
    display = display.replace(m[0], `\`[commit: "${m[1]}"]\``);
  }

  // <create_branch name="..." />
  const branchRe = /<create_branch\s+name="([^"]+)"\s*\/>/g;
  while ((m = branchRe.exec(text)) !== null) {
    calls.push({ tool: "create_branch", params: { name: m[1] } });
    display = display.replace(m[0], `\`[create_branch: ${m[1]}]\``);
  }

  // <create_issue title="..." body="..." labels="..." />
  const issueRe = /<create_issue\s+title="([^"]+)"\s+body="([^"]+)"(?:\s+labels="([^"]*)")?\s*\/>/g;
  while ((m = issueRe.exec(text)) !== null) {
    calls.push({ tool: "create_issue", params: { title: m[1], body: m[2], labels: m[3] ?? "" } });
    display = display.replace(m[0], `\`[create_issue: "${m[1]}"]\``);
  }

  // <run_preview />
  if (/<run_preview\s*\/>/.test(text)) {
    calls.push({ tool: "run_preview", params: {} });
    display = display.replace(/<run_preview\s*\/>/g, "`[run_preview]`");
  }

  return { calls, displayText: display };
}

// ─── Tool Executor ────────────────────────────────────────────────────────────

export async function executeToolCall(
  call: ToolCall,
  ctx: AgentToolContext
): Promise<ToolResult> {
  const { files, onFilesChange, onCommit, onCreateBranch, onCreateIssue, onRunPreview } = ctx;

  switch (call.tool) {
    case "write_file": {
      const { path, content } = call.params;
      const ext = path.split(".").pop() ?? "text";
      const type: ProjectFile["type"] =
        ext === "py" ? "python" : ext === "json" ? "json" : "text";
      const existing = files.findIndex((f) => f.name === path);
      let newFiles: ProjectFile[];
      if (existing >= 0) {
        newFiles = files.map((f, i) => (i === existing ? { ...f, content } : f));
      } else {
        newFiles = [...files, { name: path, content, type }];
      }
      onFilesChange(newFiles);
      const lines = content.split("\n").length;
      return { tool: "write_file", params: call.params, success: true, output: `Wrote ${path} (${lines} lines)` };
    }

    case "read_file": {
      const f = files.find((f) => f.name === call.params.path);
      if (!f) return { tool: "read_file", params: call.params, success: false, output: `File not found: ${call.params.path}` };
      return { tool: "read_file", params: call.params, success: true, output: f.content ?? "" };
    }

    case "delete_file": {
      const before = files.length;
      const newFiles = files.filter((f) => f.name !== call.params.path);
      if (newFiles.length === before)
        return { tool: "delete_file", params: call.params, success: false, output: `Not found: ${call.params.path}` };
      onFilesChange(newFiles);
      return { tool: "delete_file", params: call.params, success: true, output: `Deleted ${call.params.path}` };
    }

    case "list_files": {
      const listing = files
        .map((f) => `${f.name}  (${(f.content?.length ?? 0).toLocaleString()} chars)`)
        .join("\n");
      return { tool: "list_files", params: {}, success: true, output: listing || "(empty project)" };
    }

    case "search_files": {
      const q = call.params.query.toLowerCase();
      const hits: string[] = [];
      for (const f of files) {
        (f.content ?? "").split("\n").forEach((line, i) => {
          if (line.toLowerCase().includes(q))
            hits.push(`${f.name}:${i + 1}: ${line.trim()}`);
        });
      }
      return {
        tool: "search_files", params: call.params, success: true,
        output: hits.slice(0, 30).join("\n") || "No matches",
      };
    }

    case "commit": {
      onCommit(call.params.message);
      return { tool: "commit", params: call.params, success: true, output: `Committed: "${call.params.message}"` };
    }

    case "create_branch": {
      onCreateBranch(call.params.name);
      return { tool: "create_branch", params: call.params, success: true, output: `Branch created: ${call.params.name}` };
    }

    case "create_issue": {
      const labels = call.params.labels
        ? call.params.labels.split(",").map((l) => l.trim()).filter(Boolean)
        : [];
      onCreateIssue(call.params.title, call.params.body, labels);
      return { tool: "create_issue", params: call.params, success: true, output: `Issue created: "${call.params.title}"` };
    }

    case "run_preview": {
      onRunPreview();
      return { tool: "run_preview", params: {}, success: true, output: "Preview triggered" };
    }

    default:
      return { tool: call.tool, params: call.params, success: false, output: `Unknown tool: ${call.tool}` };
  }
}

// ─── Context Builder ──────────────────────────────────────────────────────────

/** Build a rich project context string to inject into AI messages */
export function buildProjectContext(files: ProjectFile[], projectName: string): string {
  const tree = files.map((f) => {
    const lines = (f.content ?? "").split("\n").length;
    return `  ${f.name} (${lines} lines)`;
  }).join("\n");

  const fileContents = files
    .filter((f) => f.type !== "asset")
    .map((f) => {
      const content = f.content ?? "";
      const truncated = content.length > 3000 ? content.slice(0, 3000) + "\n... (truncated)" : content;
      return `### ${f.name}\n\`\`\`python\n${truncated}\n\`\`\``;
    })
    .join("\n\n");

  return `## Project: ${projectName}\n\n### File Tree\n${tree}\n\n### File Contents\n${fileContents}`;
}
