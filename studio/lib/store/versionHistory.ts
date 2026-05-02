'use client';

import type { ProjectFile } from "./projects";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Commit {
  id: string;
  message: string;
  branch: string;
  timestamp: number;
  author: string;
  files: ProjectFile[];
  parentId?: string;
}

export interface Branch {
  name: string;
  headCommitId: string | null;
  createdAt: number;
  createdFrom?: string;
}

export interface IssueComment {
  id: string;
  body: string;
  author: string;
  createdAt: number;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  body: string;
  status: "open" | "closed";
  labels: string[];
  createdAt: number;
  closedAt?: number;
  comments: IssueComment[];
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  body: string;
  fromBranch: string;
  toBranch: string;
  status: "open" | "merged" | "closed";
  createdAt: number;
  mergedAt?: number;
  commitIds: string[];
}

export interface VCSState {
  currentBranch: string;
  branches: Branch[];
  commits: Commit[];
  issues: Issue[];
  pullRequests: PullRequest[];
  nextIssueNumber: number;
  nextPRNumber: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const key = (projectId: string) => `okama-vcs-${projectId}`;

function defaultState(): VCSState {
  return {
    currentBranch: "main",
    branches: [{ name: "main", headCommitId: null, createdAt: Date.now() }],
    commits: [],
    issues: [],
    pullRequests: [],
    nextIssueNumber: 1,
    nextPRNumber: 1,
  };
}

export function loadVCS(projectId: string): VCSState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(key(projectId));
    return raw ? (JSON.parse(raw) as VCSState) : defaultState();
  } catch {
    return defaultState();
  }
}

export function saveVCS(projectId: string, state: VCSState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(projectId), JSON.stringify(state));
}

// ─── Commits ──────────────────────────────────────────────────────────────────

export function vcsCommit(
  projectId: string,
  message: string,
  files: ProjectFile[],
  author = "Developer"
): Commit {
  const state = loadVCS(projectId);
  const branch = state.branches.find((b) => b.name === state.currentBranch);
  const commit: Commit = {
    id: crypto.randomUUID(),
    message,
    branch: state.currentBranch,
    timestamp: Date.now(),
    author,
    files: files.map((f) => ({ ...f })),
    parentId: branch?.headCommitId ?? undefined,
  };
  saveVCS(projectId, {
    ...state,
    commits: [...state.commits, commit],
    branches: state.branches.map((b) =>
      b.name === state.currentBranch ? { ...b, headCommitId: commit.id } : b
    ),
  });
  return commit;
}

export function vcsRestoreCommit(projectId: string, commitId: string): ProjectFile[] | null {
  const { commits } = loadVCS(projectId);
  return commits.find((c) => c.id === commitId)?.files ?? null;
}

// ─── Branches ─────────────────────────────────────────────────────────────────

export function vcsCreateBranch(projectId: string, name: string): Branch {
  const state = loadVCS(projectId);
  const source = state.branches.find((b) => b.name === state.currentBranch);
  const branch: Branch = {
    name,
    headCommitId: source?.headCommitId ?? null,
    createdAt: Date.now(),
    createdFrom: state.currentBranch,
  };
  saveVCS(projectId, {
    ...state,
    branches: [...state.branches, branch],
    currentBranch: name,
  });
  return branch;
}

export function vcsSwitchBranch(projectId: string, name: string): void {
  const state = loadVCS(projectId);
  saveVCS(projectId, { ...state, currentBranch: name });
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export function vcsCreateIssue(
  projectId: string,
  title: string,
  body: string,
  labels: string[] = []
): Issue {
  const state = loadVCS(projectId);
  const issue: Issue = {
    id: crypto.randomUUID(),
    number: state.nextIssueNumber,
    title,
    body,
    status: "open",
    labels,
    createdAt: Date.now(),
    comments: [],
  };
  saveVCS(projectId, {
    ...state,
    issues: [...state.issues, issue],
    nextIssueNumber: state.nextIssueNumber + 1,
  });
  return issue;
}

export function vcsCloseIssue(projectId: string, issueId: string): void {
  const state = loadVCS(projectId);
  saveVCS(projectId, {
    ...state,
    issues: state.issues.map((i) =>
      i.id === issueId ? { ...i, status: "closed", closedAt: Date.now() } : i
    ),
  });
}

export function vcsAddIssueComment(projectId: string, issueId: string, body: string, author = "Developer"): void {
  const state = loadVCS(projectId);
  const comment: IssueComment = { id: crypto.randomUUID(), body, author, createdAt: Date.now() };
  saveVCS(projectId, {
    ...state,
    issues: state.issues.map((i) =>
      i.id === issueId ? { ...i, comments: [...i.comments, comment] } : i
    ),
  });
}

// ─── Pull Requests ────────────────────────────────────────────────────────────

export function vcsCreatePR(
  projectId: string,
  title: string,
  body: string,
  fromBranch: string,
  toBranch = "main"
): PullRequest {
  const state = loadVCS(projectId);
  const commitIds = state.commits
    .filter((c) => c.branch === fromBranch)
    .map((c) => c.id);
  const pr: PullRequest = {
    id: crypto.randomUUID(),
    number: state.nextPRNumber,
    title,
    body,
    fromBranch,
    toBranch,
    status: "open",
    createdAt: Date.now(),
    commitIds,
  };
  saveVCS(projectId, {
    ...state,
    pullRequests: [...state.pullRequests, pr],
    nextPRNumber: state.nextPRNumber + 1,
  });
  return pr;
}

export function vcsMergePR(projectId: string, prId: string): void {
  const state = loadVCS(projectId);
  const pr = state.pullRequests.find((p) => p.id === prId);
  if (!pr || pr.status !== "open") return;

  // Move branch head of toBranch to fromBranch head
  const fromBranch = state.branches.find((b) => b.name === pr.fromBranch);
  saveVCS(projectId, {
    ...state,
    pullRequests: state.pullRequests.map((p) =>
      p.id === prId ? { ...p, status: "merged", mergedAt: Date.now() } : p
    ),
    branches: state.branches.map((b) =>
      b.name === pr.toBranch ? { ...b, headCommitId: fromBranch?.headCommitId ?? b.headCommitId } : b
    ),
  });
}

export function vcsClosePR(projectId: string, prId: string): void {
  const state = loadVCS(projectId);
  saveVCS(projectId, {
    ...state,
    pullRequests: state.pullRequests.map((p) =>
      p.id === prId ? { ...p, status: "closed" } : p
    ),
  });
}
