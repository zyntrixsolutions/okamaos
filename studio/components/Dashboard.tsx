'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Code2, BookOpen, FolderOpen, Plus, Zap, ArrowRight,
  Gamepad2, Sword, Car, Globe, Pencil, Star, Clock,
  Download, ExternalLink,
} from "lucide-react";
import Header from "@/components/ui/Header";
import { loadProjects, createBlankProject, saveProject, ensureDemoProject, DEMO_PROJECT_ID, type Project } from "@/lib/store/projects";

const GENRES = [
  { id: "platformer", label: "Platformer", icon: Sword, desc: "Jump, run, explore" },
  { id: "topdown", label: "Top-Down", icon: Car, desc: "Birds-eye action" },
  { id: "rpg", label: "RPG", icon: Globe, desc: "Story & adventure" },
  { id: "blank", label: "Blank", icon: Pencil, desc: "Start from scratch" },
];

const OKAMAOS_DOWNLOADS_URL = "https://zyntrixsolutions.github.io/okamaos/#downloads";
const OKAMAOS_MANUAL_URL = "https://zyntrixsolutions.github.io/okamaos/docs/manual.md";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [gameName, setGameName] = useState("");
  const [genre, setGenre] = useState("platformer");
  const [creating, setCreating] = useState(false);
  const [hasKey, setHasKey] = useState(true);

  useEffect(() => {
    ensureDemoProject();
    setProjects(
      loadProjects()
        .filter((p) => p.id !== DEMO_PROJECT_ID)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 6)
    );
    setHasKey(Boolean(localStorage.getItem("okama-gemini-key") || localStorage.getItem("okama-qwen-key")));
  }, []);

  const handleCreate = () => {
    if (!gameName.trim()) return;
    setCreating(true);
    const project = createBlankProject(gameName.trim(), genre);
    saveProject(project);
    router.push(`/studio/${project.id}`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header crumbs={[{ label: "Dashboard" }]} />

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div
          className="relative px-6 py-10 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #181a16 0%, #10120f 60%)",
            borderBottom: "1px solid rgba(243,239,228,0.08)",
          }}
        >
          {/* BG grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(141,247,127,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(141,247,127,0.03) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "rgba(141,247,127,0.12)", color: "#8df77f" }}
              >
                OkamaOS
              </span>
              <span className="text-xs" style={{ color: "#c9c3b3" }}>Game Engine Platform</span>
            </div>
            <h1 className="text-3xl font-black leading-tight mb-2" style={{ color: "#f3efe4" }}>
              Build cinematic games.<br />
              <span style={{ color: "#8df77f" }}>Export. Play on OkamaOS.</span>
            </h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#c9c3b3", maxWidth: 520 }}>
              AI-powered game studio — vibe-code with Gemini or Qwen, preview in-browser, and export signed
              {" "}<code style={{ color: "#53d9e6" }}>.ok</code> packages ready for the console.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/studio/${DEMO_PROJECT_ID}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{ background: "#8df77f", color: "#10120f" }}
              >
                <Gamepad2 size={16} /> Try Demo Game
              </Link>
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                style={{ background: "rgba(141,247,127,0.10)", color: "#8df77f", border: "1px solid rgba(141,247,127,0.2)" }}
              >
                <Plus size={16} /> New Game
              </button>
              <Link
                href="/learn"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                style={{ background: "rgba(83,217,230,0.10)", color: "#53d9e6", border: "1px solid rgba(83,217,230,0.2)" }}
              >
                <BookOpen size={16} /> Learn Python
              </Link>
              <a
                href={OKAMAOS_DOWNLOADS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                style={{ background: "rgba(255,207,74,0.10)", color: "#ffcf4a", border: "1px solid rgba(255,207,74,0.2)" }}
              >
                <Download size={16} /> Download OkamaOS <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
          {/* No-key banner */}
          {!hasKey && (
            <div
              className="rounded-xl border p-4 flex items-start gap-4"
              style={{ background: "rgba(255,207,74,0.06)", borderColor: "rgba(255,207,74,0.25)" }}
            >
              <span className="text-2xl shrink-0">🚀</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm mb-1" style={{ color: "#ffcf4a" }}>
                  No AI key yet? Start with the demo!
                </p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: "#c9c3b3" }}>
                  <strong style={{ color: "#f3efe4" }}>Stellar Drift</strong> is a fully playable space shooter — run it right now in the Preview tab, read the code,
                  and understand how every system works. Get your free Gemini key when you're ready to build your own game.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/studio/${DEMO_PROJECT_ID}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs"
                    style={{ background: "#ffcf4a", color: "#10120f" }}
                  >
                    <Gamepad2 size={13} /> Open Demo Studio
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs"
                    style={{ background: "rgba(255,207,74,0.12)", color: "#ffcf4a", border: "1px solid rgba(255,207,74,0.2)" }}
                  >
                    <Zap size={13} /> Add AI Key
                  </Link>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "#6b7464" }}
                  >
                    Get free Gemini key →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Demo spotlight card */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "#181a16", borderColor: "rgba(141,247,127,0.2)" }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between border-b"
              style={{ borderColor: "rgba(141,247,127,0.12)", background: "rgba(141,247,127,0.04)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🚀</span>
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#8df77f" }}>
                  Demo Game — Stellar Drift
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(141,247,127,0.12)", color: "#8df77f" }}
                >
                  No key needed
                </span>
              </div>
              <Link
                href={`/studio/${DEMO_PROJECT_ID}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: "#8df77f", color: "#10120f" }}
              >
                Open <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: "✨", label: "Particle System",   desc: "Explosions, exhaust, sparks" },
                { icon: "🌌", label: "Parallax Stars",     desc: "3-layer depth scroll" },
                { icon: "🤖", label: "Enemy AI (3 types)", desc: "Drone, Hunter, Tank" },
                { icon: "🎯", label: "Collision Detection",desc: "Rect + point checks" },
              ].map(({ icon, label, desc }) => (
                <div
                  key={label}
                  className="p-3 rounded-lg"
                  style={{ background: "rgba(243,239,228,0.04)", border: "1px solid rgba(243,239,228,0.06)" }}
                >
                  <span className="text-lg block mb-1">{icon}</span>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "#f3efe4" }}>{label}</p>
                  <p className="text-xs" style={{ color: "#6b7464" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { href: "/studio", icon: Code2, label: "Open Studio", color: "#8df77f", bg: "rgba(141,247,127,0.08)" },
              { href: "/learn", icon: BookOpen, label: "Lessons", color: "#53d9e6", bg: "rgba(83,217,230,0.08)" },
              { href: "/library", icon: FolderOpen, label: "My Games", color: "#ffcf4a", bg: "rgba(255,207,74,0.08)" },
              { href: "/settings", icon: Zap, label: "Setup AI Keys", color: "#f26d5b", bg: "rgba(242,109,91,0.08)" },
            ].map(({ href, icon: Icon, label, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all group hover:scale-105"
                style={{ background: bg, borderColor: `${color}30` }}
              >
                <Icon size={22} style={{ color }} />
                <span className="text-xs font-bold text-center" style={{ color }}>{label}</span>
              </Link>
            ))}
            <a
              href={OKAMAOS_MANUAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all group hover:scale-105"
              style={{ background: "rgba(243,239,228,0.06)", borderColor: "rgba(243,239,228,0.14)" }}
            >
              <Download size={22} style={{ color: "#c9c3b3" }} />
              <span className="text-xs font-bold text-center" style={{ color: "#c9c3b3" }}>
                OS Manual
              </span>
            </a>
          </div>

          {/* Recent projects */}
          {projects.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: "#c9c3b3" }}>
                  Recent Projects
                </h2>
                <Link href="/library" className="flex items-center gap-1 text-xs font-bold" style={{ color: "#ffcf4a" }}>
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/studio/${p.id}`}
                    className="rounded-xl border p-4 transition-all hover:scale-[1.02] group"
                    style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.10)" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div
                        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                        style={{ background: "rgba(141,247,127,0.10)" }}
                      >
                        <Gamepad2 size={18} style={{ color: "#8df77f" }} />
                      </div>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#6b7464" }}>
                        <Clock size={10} /> {timeAgo(p.updatedAt)}
                      </span>
                    </div>
                    <p className="font-bold text-sm mb-0.5 group-hover:text-green-300 transition-colors" style={{ color: "#f3efe4" }}>
                      {p.name}
                    </p>
                    <p className="text-xs capitalize" style={{ color: "#6b7464" }}>{p.genre}</p>
                    <div
                      className="flex items-center gap-1.5 mt-3 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#8df77f" }}
                    >
                      Open Studio <ArrowRight size={11} />
                    </div>
                  </Link>
                ))}
                <button
                  onClick={() => setShowNew(true)}
                  className="rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{ borderColor: "rgba(141,247,127,0.2)", background: "transparent" }}
                >
                  <Plus size={20} style={{ color: "#8df77f" }} />
                  <span className="text-xs font-bold" style={{ color: "#8df77f" }}>New Game</span>
                </button>
              </div>
            </section>
          )}

          {/* Feature highlights */}
          <section>
            <h2 className="font-black text-sm uppercase tracking-widest mb-4" style={{ color: "#c9c3b3" }}>
              Platform Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: "🤖",
                  title: "AI Game Builder",
                  desc: "Gemini or Qwen generates full pygame code, integrates your assets, and teaches you as it builds.",
                  color: "#8df77f",
                },
                {
                  icon: "🎮",
                  title: "In-Browser Preview",
                  desc: "Pyodide runs your Python game right in the browser — no install needed to test.",
                  color: "#53d9e6",
                },
                {
                  icon: "📦",
                  title: "Export .ok Packages",
                  desc: "One click builds a signed .ok package ready to load on OkamaOS via USB.",
                  color: "#ffcf4a",
                },
                {
                  icon: "🎓",
                  title: "Python Lessons",
                  desc: "10 structured chapters from variables to pygame sprites, with live code cells.",
                  color: "#f26d5b",
                },
                {
                  icon: "🎨",
                  title: "Asset Manager",
                  desc: "Drop in HD images and audio — AI integrates them into your game instantly.",
                  color: "#8df77f",
                },
                {
                  icon: "⚡",
                  title: "Cinematic Quality",
                  desc: "2GB RAM baseline — parallax, particle FX, video cutscenes, spatial audio.",
                  color: "#53d9e6",
                },
              ].map(({ icon, title, desc, color }) => (
                <div
                  key={title}
                  className="p-4 rounded-xl border"
                  style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.08)" }}
                >
                  <span className="text-2xl mb-2 block">{icon}</span>
                  <p className="font-bold text-sm mb-1" style={{ color }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#6b7464" }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* New game modal */}
      {showNew && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowNew(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: "#181a16", borderColor: "rgba(141,247,127,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black mb-1" style={{ color: "#f3efe4" }}>New Game</h2>
            <p className="text-sm mb-5" style={{ color: "#c9c3b3" }}>
              Pick a template and the AI will ask what to build next.
            </p>

            <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "#c9c3b3" }}>
              Game Name
            </label>
            <input
              autoFocus
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Shadow Runner"
              className="w-full px-3 py-2.5 rounded-xl border mb-4 text-sm outline-none"
              style={{
                background: "#10120f",
                borderColor: "rgba(243,239,228,0.15)",
                color: "#f3efe4",
                caretColor: "#8df77f",
              }}
            />

            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: "#c9c3b3" }}>
              Genre Template
            </label>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {GENRES.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setGenre(id)}
                  className="flex flex-col gap-1 p-3 rounded-xl border text-left transition-all"
                  style={{
                    background: genre === id ? "rgba(141,247,127,0.10)" : "transparent",
                    borderColor: genre === id ? "rgba(141,247,127,0.3)" : "rgba(243,239,228,0.10)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: genre === id ? "#8df77f" : "#c9c3b3" }} />
                    <span className="text-xs font-bold" style={{ color: genre === id ? "#8df77f" : "#c9c3b3" }}>
                      {label}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "#6b7464" }}>{desc}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "rgba(243,239,228,0.06)", color: "#c9c3b3" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!gameName.trim() || creating}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors"
                style={{
                  background: gameName.trim() ? "#8df77f" : "rgba(141,247,127,0.10)",
                  color: gameName.trim() ? "#10120f" : "#6b7464",
                  cursor: gameName.trim() ? "pointer" : "not-allowed",
                }}
              >
                {creating ? "Creating…" : "Create & Open Studio →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
