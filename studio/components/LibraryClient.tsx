'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderOpen, Gamepad2, Clock, Trash2, Download, Code2,
  Package, Plus, AlertCircle,
} from "lucide-react";
import Header from "@/components/ui/Header";
import { loadProjects, deleteProject, type Project } from "@/lib/store/projects";
import { buildAndDownload } from "@/lib/package/builder";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function LibraryClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [building, setBuilding] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setProjects(loadProjects().sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setConfirmDelete(null);
  };

  const handleExport = async (project: Project) => {
    setBuilding(project.id);
    setError("");
    try {
      await buildAndDownload(project);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBuilding(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        crumbs={[{ label: "Library" }]}
        right={
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "rgba(141,247,127,0.10)", color: "#8df77f", border: "1px solid rgba(141,247,127,0.2)" }}
          >
            <Plus size={13} /> New Game
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <FolderOpen size={20} style={{ color: "#ffcf4a" }} />
            <div>
              <h1 className="text-xl font-black" style={{ color: "#f3efe4" }}>My Games</h1>
              <p className="text-xs" style={{ color: "#6b7464" }}>
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl mb-4"
              style={{ background: "rgba(242,109,91,0.08)", border: "1px solid rgba(242,109,91,0.2)" }}
            >
              <AlertCircle size={14} style={{ color: "#f26d5b" }} />
              <p className="text-sm" style={{ color: "#f26d5b" }}>{error}</p>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-20">
              <Gamepad2 size={48} className="mx-auto mb-4" style={{ color: "#3a3d36" }} />
              <p className="font-bold text-lg mb-2" style={{ color: "#c9c3b3" }}>No games yet</p>
              <p className="text-sm mb-6" style={{ color: "#6b7464" }}>
                Create your first game in the Studio — the AI will help you build it!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "#8df77f", color: "#10120f" }}
              >
                <Plus size={16} /> Create First Game
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border overflow-hidden flex flex-col"
                  style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.10)" }}
                >
                  {/* Thumbnail area */}
                  <div
                    className="h-28 flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #10120f, #1e211c)",
                      borderBottom: "1px solid rgba(243,239,228,0.06)",
                    }}
                  >
                    {/* Grid BG */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: "linear-gradient(rgba(141,247,127,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(141,247,127,0.04) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                      }}
                    />
                    <Gamepad2 size={36} style={{ color: "#3a3d36", position: "relative" }} />
                    <span
                      className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-bold capitalize"
                      style={{ background: "rgba(243,239,228,0.06)", color: "#c9c3b3" }}
                    >
                      {project.genre}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm leading-tight" style={{ color: "#f3efe4" }}>
                        {project.name}
                      </h3>
                    </div>
                    <p className="text-xs font-mono mb-1" style={{ color: "#6b7464" }}>
                      {project.manifest.id}
                    </p>
                    <div className="flex items-center gap-3 text-xs mb-4" style={{ color: "#6b7464" }}>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {timeAgo(project.updatedAt)}
                      </span>
                      <span>v{project.manifest.version}</span>
                      <span>{project.files.length} files</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/studio/${project.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors"
                        style={{ background: "rgba(141,247,127,0.10)", color: "#8df77f" }}
                      >
                        <Code2 size={12} /> Open
                      </Link>
                      <button
                        onClick={() => handleExport(project)}
                        disabled={building === project.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors"
                        style={{
                          background: "rgba(255,207,74,0.10)",
                          color: building === project.id ? "#6b7464" : "#ffcf4a",
                          cursor: building === project.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {building === project.id ? (
                          <span className="animate-pulse">Building…</span>
                        ) : (
                          <><Download size={12} /> .ok</>
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(project.id)}
                        className="flex items-center justify-center w-8 rounded-lg transition-colors"
                        style={{ background: "rgba(242,109,91,0.08)", color: "#f26d5b" }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* New game card */}
              <Link
                href="/"
                className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 min-h-48 transition-all hover:scale-[1.02]"
                style={{ borderColor: "rgba(141,247,127,0.15)", background: "transparent" }}
              >
                <Plus size={24} style={{ color: "#8df77f" }} />
                <span className="text-sm font-bold" style={{ color: "#8df77f" }}>New Game</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-6"
            style={{ background: "#181a16", borderColor: "rgba(242,109,91,0.3)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trash2 size={18} style={{ color: "#f26d5b" }} />
              <h3 className="font-black" style={{ color: "#f3efe4" }}>Delete Game?</h3>
            </div>
            <p className="text-sm mb-5" style={{ color: "#c9c3b3" }}>
              {`"${projects.find((p) => p.id === confirmDelete)?.name}" will be permanently deleted.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "rgba(243,239,228,0.06)", color: "#c9c3b3" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "#f26d5b", color: "#fff" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
