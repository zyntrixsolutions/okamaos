'use client';

import { useState, useEffect, useCallback } from "react";
import { GitCommit, GitBranch, AlertCircle, GitPullRequest, Plus, Check, X, ChevronRight, RotateCcw, GitMerge, Clock } from "lucide-react";
import {
  loadVCS, vcsSwitchBranch, vcsCreatePR, vcsMergePR, vcsClosePR, vcsCloseIssue,
  type VCSState, type Commit, type Branch, type Issue, type PullRequest,
} from "@/lib/store/versionHistory";
import type { ProjectFile } from "@/lib/store/projects";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VersionPanelProps {
  projectId: string;
  currentFiles: ProjectFile[];
  onRestoreCommit: (files: ProjectFile[]) => void;
  refreshKey?: number;
}

type PanelTab = "commits" | "branches" | "issues" | "prs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function LabelBadge({ label }: { label: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    bug: { bg: "rgba(242,109,91,0.15)", text: "#f26d5b" },
    feature: { bg: "rgba(141,247,127,0.12)", text: "#8df77f" },
    enhancement: { bg: "rgba(83,217,230,0.12)", text: "#53d9e6" },
    physics: { bg: "rgba(255,207,74,0.12)", text: "#ffcf4a" },
  };
  const c = colors[label] ?? { bg: "rgba(243,239,228,0.08)", text: "#c9c3b3" };
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: c.bg, color: c.text }}>
      {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VersionPanel({ projectId, currentFiles, onRestoreCommit, refreshKey = 0 }: VersionPanelProps) {
  const [vcs, setVcs] = useState<VCSState | null>(null);
  const [tab, setTab] = useState<PanelTab>("commits");
  const [showPRForm, setShowPRForm] = useState(false);
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");
  const [prFrom, setPrFrom] = useState("");
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);

  const reload = useCallback(() => {
    setVcs(loadVCS(projectId));
  }, [projectId]);

  useEffect(() => { reload(); }, [reload, refreshKey]);

  if (!vcs) return <div className="p-4 text-xs" style={{ color: "#6b7464" }}>Loading…</div>;

  const { currentBranch, branches, commits, issues, pullRequests } = vcs;
  const branchCommits = commits.filter((c) => c.branch === currentBranch).reverse();
  const openIssues = issues.filter((i) => i.status === "open");
  const closedIssues = issues.filter((i) => i.status === "closed");

  const tabStyle = (t: PanelTab) => ({
    color: tab === t ? "#f3efe4" : "#6b7464",
    borderBottom: tab === t ? "2px solid #8df77f" : "2px solid transparent",
    background: "transparent",
    cursor: "pointer" as const,
    padding: "6px 10px",
    fontSize: "0.7rem",
    fontWeight: 700 as const,
    transition: "color 0.1s",
    whiteSpace: "nowrap" as const,
  });

  const handleRestore = (commit: Commit) => {
    if (restoreConfirm !== commit.id) { setRestoreConfirm(commit.id); return; }
    onRestoreCommit(commit.files);
    setRestoreConfirm(null);
  };

  const handleSwitchBranch = (name: string) => {
    vcsSwitchBranch(projectId, name);
    reload();
  };

  const handleMergePR = (prId: string) => {
    vcsMergePR(projectId, prId);
    reload();
  };

  const handleClosePR = (prId: string) => {
    vcsClosePR(projectId, prId);
    reload();
  };

  const handleCloseIssue = (issueId: string) => {
    vcsCloseIssue(projectId, issueId);
    reload();
  };

  const handleCreatePR = () => {
    if (!prTitle.trim() || !prFrom) return;
    vcsCreatePR(projectId, prTitle, prBody, prFrom);
    setPrTitle(""); setPrBody(""); setPrFrom(""); setShowPRForm(false);
    reload();
    setTab("prs");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#10120f" }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0"
        style={{ borderColor: "rgba(243,239,228,0.08)", background: "#181a16" }}
      >
        <GitBranch size={13} style={{ color: "#8df77f" }} />
        <span className="text-xs font-bold" style={{ color: "#f3efe4" }}>Version History</span>
        <div className="flex-1" />
        <span
          className="text-xs px-2 py-0.5 rounded font-mono font-bold"
          style={{ background: "rgba(141,247,127,0.10)", color: "#8df77f" }}
        >
          {currentBranch}
        </span>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b shrink-0 overflow-x-auto"
        style={{ borderColor: "rgba(243,239,228,0.08)", background: "#181a16" }}
      >
        {(["commits", "branches", "issues", "prs"] as PanelTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
            {t === "commits" && <><GitCommit size={10} className="inline mr-1" />{commits.length}</>}
            {t === "branches" && <><GitBranch size={10} className="inline mr-1" />{branches.length}</>}
            {t === "issues" && <><AlertCircle size={10} className="inline mr-1" />{openIssues.length} open</>}
            {t === "prs" && <><GitPullRequest size={10} className="inline mr-1" />{pullRequests.filter(p => p.status === "open").length} open</>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── Commits ── */}
        {tab === "commits" && (
          <div className="p-2 space-y-1">
            {branchCommits.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: "#6b7464" }}>
                No commits yet.<br />Ask the agent to commit with <code className="font-mono text-xs">&lt;commit /&gt;</code>
              </p>
            )}
            {branchCommits.map((commit) => (
              <div
                key={commit.id}
                className="rounded-lg p-2.5 border"
                style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.06)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "#f3efe4" }}>
                      {commit.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono" style={{ color: "#6b7464" }}>
                        {commit.id.slice(0, 7)}
                      </span>
                      <Clock size={9} style={{ color: "#6b7464" }} />
                      <span className="text-xs" style={{ color: "#6b7464" }}>
                        {timeAgo(commit.timestamp)}
                      </span>
                      <span className="text-xs" style={{ color: "#6b7464" }}>
                        · {commit.files.length} files
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(commit)}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                    style={{
                      background: restoreConfirm === commit.id ? "rgba(242,109,91,0.15)" : "rgba(243,239,228,0.06)",
                      color: restoreConfirm === commit.id ? "#f26d5b" : "#c9c3b3",
                    }}
                    title="Restore this commit"
                  >
                    <RotateCcw size={10} />
                    {restoreConfirm === commit.id ? "Confirm?" : "Restore"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Branches ── */}
        {tab === "branches" && (
          <div className="p-2 space-y-1">
            {branches.map((branch) => (
              <div
                key={branch.name}
                className="rounded-lg p-2.5 border flex items-center justify-between"
                style={{
                  background: branch.name === currentBranch ? "rgba(141,247,127,0.06)" : "#181a16",
                  borderColor: branch.name === currentBranch ? "rgba(141,247,127,0.2)" : "rgba(243,239,228,0.06)",
                }}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <GitBranch size={11} style={{ color: branch.name === currentBranch ? "#8df77f" : "#6b7464" }} />
                    <span className="text-xs font-mono font-bold" style={{ color: branch.name === currentBranch ? "#8df77f" : "#f3efe4" }}>
                      {branch.name}
                    </span>
                    {branch.name === currentBranch && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(141,247,127,0.10)", color: "#8df77f" }}>
                        current
                      </span>
                    )}
                  </div>
                  {branch.createdFrom && (
                    <p className="text-xs mt-0.5" style={{ color: "#6b7464" }}>from {branch.createdFrom}</p>
                  )}
                </div>
                {branch.name !== currentBranch && (
                  <button
                    onClick={() => handleSwitchBranch(branch.name)}
                    className="text-xs px-2 py-1 rounded flex items-center gap-1"
                    style={{ background: "rgba(243,239,228,0.06)", color: "#c9c3b3" }}
                  >
                    <ChevronRight size={10} /> Switch
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Issues ── */}
        {tab === "issues" && (
          <div className="p-2 space-y-2">
            {issues.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: "#6b7464" }}>
                No issues yet.
              </p>
            )}
            {openIssues.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: "#8df77f" }}>Open</p>
                {openIssues.map((issue) => (
                  <div key={issue.id} className="rounded-lg p-2.5 border" style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.06)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-mono" style={{ color: "#6b7464" }}>#{issue.number}</span>
                          <span className="text-xs font-semibold" style={{ color: "#f3efe4" }}>{issue.title}</span>
                        </div>
                        {issue.labels.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {issue.labels.map((l) => <LabelBadge key={l} label={l} />)}
                          </div>
                        )}
                        {issue.body && <p className="text-xs mt-1" style={{ color: "#6b7464" }}>{issue.body}</p>}
                      </div>
                      <button
                        onClick={() => handleCloseIssue(issue.id)}
                        className="shrink-0 px-2 py-1 rounded text-xs flex items-center gap-1"
                        style={{ background: "rgba(141,247,127,0.08)", color: "#8df77f" }}
                      >
                        <Check size={10} /> Close
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {closedIssues.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest px-1 mt-3" style={{ color: "#6b7464" }}>Closed</p>
                {closedIssues.map((issue) => (
                  <div key={issue.id} className="rounded-lg p-2.5 border opacity-50" style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.04)" }}>
                    <div className="flex items-center gap-1.5">
                      <Check size={10} style={{ color: "#8df77f" }} />
                      <span className="text-xs font-mono" style={{ color: "#6b7464" }}>#{issue.number}</span>
                      <span className="text-xs line-through" style={{ color: "#6b7464" }}>{issue.title}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Pull Requests ── */}
        {tab === "prs" && (
          <div className="p-2 space-y-2">
            {/* Create PR Button */}
            <button
              onClick={() => setShowPRForm((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border"
              style={{ borderColor: "rgba(141,247,127,0.2)", color: "#8df77f", background: "rgba(141,247,127,0.06)" }}
            >
              <Plus size={11} /> New Pull Request
            </button>

            {showPRForm && (
              <div className="rounded-lg p-3 border space-y-2" style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.08)" }}>
                <input
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  placeholder="PR title"
                  className="w-full bg-transparent text-xs outline-none px-2 py-1.5 rounded border"
                  style={{ borderColor: "rgba(243,239,228,0.12)", color: "#f3efe4" }}
                />
                <select
                  value={prFrom}
                  onChange={(e) => setPrFrom(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none px-2 py-1.5 rounded border"
                  style={{ borderColor: "rgba(243,239,228,0.12)", color: "#c9c3b3", background: "#181a16" }}
                >
                  <option value="">Select source branch…</option>
                  {branches.filter((b) => b.name !== "main").map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
                <textarea
                  value={prBody}
                  onChange={(e) => setPrBody(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full bg-transparent text-xs outline-none px-2 py-1.5 rounded border resize-none"
                  style={{ borderColor: "rgba(243,239,228,0.12)", color: "#c9c3b3" }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreatePR}
                    disabled={!prTitle.trim() || !prFrom}
                    className="flex-1 py-1.5 rounded text-xs font-bold"
                    style={{ background: "#8df77f", color: "#10120f", opacity: (!prTitle.trim() || !prFrom) ? 0.5 : 1 }}
                  >
                    Create PR
                  </button>
                  <button
                    onClick={() => setShowPRForm(false)}
                    className="px-3 py-1.5 rounded text-xs"
                    style={{ background: "rgba(243,239,228,0.06)", color: "#c9c3b3" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {pullRequests.length === 0 && !showPRForm && (
              <p className="text-xs text-center py-4" style={{ color: "#6b7464" }}>No pull requests yet.</p>
            )}

            {pullRequests.map((pr) => (
              <div
                key={pr.id}
                className="rounded-lg p-2.5 border"
                style={{
                  background: "#181a16",
                  borderColor: pr.status === "open" ? "rgba(141,247,127,0.15)" : "rgba(243,239,228,0.04)",
                  opacity: pr.status !== "open" ? 0.6 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      {pr.status === "merged" ? (
                        <GitMerge size={11} style={{ color: "#a78bfa" }} />
                      ) : pr.status === "open" ? (
                        <GitPullRequest size={11} style={{ color: "#8df77f" }} />
                      ) : (
                        <X size={11} style={{ color: "#f26d5b" }} />
                      )}
                      <span className="text-xs font-semibold" style={{ color: "#f3efe4" }}>
                        #{pr.number} {pr.title}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#6b7464" }}>
                      {pr.fromBranch} → {pr.toBranch}
                      {pr.status === "merged" && pr.mergedAt && ` · merged ${timeAgo(pr.mergedAt)}`}
                    </p>
                  </div>
                  {pr.status === "open" && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleMergePR(pr.id)}
                        className="px-2 py-1 rounded text-xs flex items-center gap-1"
                        style={{ background: "rgba(141,247,127,0.10)", color: "#8df77f" }}
                      >
                        <GitMerge size={10} /> Merge
                      </button>
                      <button
                        onClick={() => handleClosePR(pr.id)}
                        className="px-2 py-1 rounded text-xs"
                        style={{ background: "rgba(242,109,91,0.08)", color: "#f26d5b" }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
