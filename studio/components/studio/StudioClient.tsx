'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Package, ChevronLeft } from "lucide-react";
import Header from "@/components/ui/Header";
import FileTree from "@/components/studio/FileTree";
import CodeEditor from "@/components/studio/CodeEditor";
import GamePreview from "@/components/studio/GamePreview";
import AIChatPanel from "@/components/studio/AIChatPanel";
import AssetManager from "@/components/studio/AssetManager";
import PackageBuilder from "@/components/studio/PackageBuilder";
import {
  getProject, saveProject, type Project, type ProjectFile, type OkManifest,
} from "@/lib/store/projects";
import type { ModelId } from "@/lib/ai/router";

type RightTab = "preview" | "chat" | "assets" | "package";

interface StudioClientProps {
  projectId: string;
}

function useAIConfig() {
  const [model, setModel] = useState<ModelId>("gemini-2.0-flash");
  const [geminiKey, setGeminiKey] = useState("");
  const [qwenKey, setQwenKey] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setModel((localStorage.getItem("okama-model") as ModelId) || "gemini-2.0-flash");
    setGeminiKey(localStorage.getItem("okama-gemini-key") || "");
    setQwenKey(localStorage.getItem("okama-qwen-key") || "");
  }, []);

  return { model, geminiKey, qwenKey };
}

export default function StudioClient({ projectId }: StudioClientProps) {
  const router = useRouter();
  const { model, geminiKey, qwenKey } = useAIConfig();
  const [project, setProject] = useState<Project | null>(null);
  const [activeFile, setActiveFile] = useState("main.py");
  const [rightTab, setRightTab] = useState<RightTab>("chat");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorContext, setErrorContext] = useState<string>();

  useEffect(() => {
    const p = getProject(projectId);
    if (!p) { router.replace("/"); return; }
    setProject(p);
  }, [projectId, router]);

  // Auto-save on change
  useEffect(() => {
    if (!project || !dirty) return;
    const t = setTimeout(() => {
      setSaving(true);
      saveProject(project);
      setDirty(false);
      setSaving(false);
    }, 1000);
    return () => clearTimeout(t);
  }, [project, dirty]);

  const updateFileContent = useCallback((content: string) => {
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        files: prev.files.map((f) =>
          f.name === activeFile ? { ...f, content } : f
        ),
      };
    });
    setDirty(true);
  }, [activeFile]);

  const applyAICode = useCallback((code: string) => {
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        files: prev.files.map((f) =>
          f.name === "main.py" ? { ...f, content: code } : f
        ),
      };
    });
    setActiveFile("main.py");
    setDirty(true);
  }, []);

  const addAsset = useCallback((file: ProjectFile) => {
    setProject((prev) => {
      if (!prev) return prev;
      const existing = prev.files.findIndex((f) => f.name === file.name);
      if (existing >= 0) {
        const files = [...prev.files];
        files[existing] = file;
        return { ...prev, files };
      }
      return { ...prev, files: [...prev.files, file] };
    });
    setDirty(true);
  }, []);

  const deleteFile = useCallback((name: string) => {
    setProject((prev) => {
      if (!prev) return prev;
      return { ...prev, files: prev.files.filter((f) => f.name !== name) };
    });
    if (activeFile === name) setActiveFile("main.py");
    setDirty(true);
  }, [activeFile]);

  const updateManifest = useCallback((manifest: OkManifest) => {
    setProject((prev) => {
      if (!prev) return prev;
      return { ...prev, manifest };
    });
    setDirty(true);
  }, []);

  const handlePreviewError = useCallback((error: string) => {
    setErrorContext(error);
    setRightTab("chat"); // Switch to chat tab to show the error
  }, []);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "#6b7464" }}>
        <span className="text-sm">Loading studio…</span>
      </div>
    );
  }

  const activeFileObj = project.files.find((f) => f.name === activeFile);
  const mainCode = project.files.find((f) => f.name === "main.py")?.content ?? "";
  const assets = project.files.filter((f) => f.type === "asset");

  const tabStyle = (t: RightTab) => ({
    color: rightTab === t ? "#f3efe4" : "#c9c3b3",
    borderBottom: rightTab === t ? "2px solid #8df77f" : "2px solid transparent",
    background: rightTab === t ? "rgba(141,247,127,0.05)" : "transparent",
    cursor: "pointer" as const,
    padding: "6px 12px",
    fontSize: "0.75rem",
    fontWeight: 700,
    transition: "color 0.1s",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        crumbs={[{ label: "Studio" }, { label: project.name }]}
        modelId={model}
        right={
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs" style={{ color: "#6b7464" }}>Saving…</span>}
            {!saving && dirty && <span className="text-xs" style={{ color: "#ffcf4a" }}>Unsaved</span>}
            <button
              onClick={() => setRightTab("package")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{ background: "rgba(255,207,74,0.12)", color: "#ffcf4a", border: "1px solid rgba(255,207,74,0.2)" }}
            >
              <Package size={13} /> Export .ok
            </button>
          </div>
        }
      />

      {/* 3-panel layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Panel 1: File tree (180px) */}
        <div className="w-44 shrink-0 flex flex-col min-h-0 overflow-hidden">
          <FileTree
            files={project.files}
            activeFile={activeFile}
            onSelect={setActiveFile}
            onDelete={deleteFile}
          />
        </div>

        {/* Panel 2: Code editor */}
        <div
          className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden border-l border-r"
          style={{ borderColor: "rgba(243,239,228,0.08)" }}
        >
          {/* File tab bar */}
          <div
            className="flex items-center px-2 border-b shrink-0 overflow-x-auto"
            style={{ borderColor: "rgba(243,239,228,0.08)", background: "#181a16", minHeight: 36 }}
          >
            {project.files.filter((f) => f.type !== "asset" || f === activeFileObj).map((f) => (
              f.type === "asset" ? null : (
                <button
                  key={f.name}
                  onClick={() => setActiveFile(f.name)}
                  className="px-3 py-1 text-xs font-mono font-semibold shrink-0 transition-colors"
                  style={{
                    color: activeFile === f.name ? "#f3efe4" : "#c9c3b3",
                    borderBottom: activeFile === f.name ? "2px solid #8df77f" : "2px solid transparent",
                    background: "transparent",
                  }}
                >
                  {f.name}
                </button>
              )
            ))}
          </div>

          <CodeEditor
            value={activeFileObj?.content ?? ""}
            fileName={activeFile}
            onChange={updateFileContent}
          />
        </div>

        {/* Panel 3: Right tabs (preview / chat / assets / package) */}
        <div
          className="w-80 xl:w-96 shrink-0 flex flex-col min-h-0 overflow-hidden"
          style={{ borderLeft: "1px solid rgba(243,239,228,0.08)" }}
        >
          {/* Tab bar */}
          <div
            className="flex items-center border-b shrink-0 overflow-x-auto"
            style={{ borderColor: "rgba(243,239,228,0.08)", background: "#181a16" }}
          >
            {(["chat", "preview", "assets", "package"] as RightTab[]).map((t) => (
              <button key={t} onClick={() => setRightTab(t)} style={tabStyle(t)}>
                {t === "chat" ? "AI Chat" : t === "preview" ? "Preview" : t === "assets" ? "Assets" : "Export"}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {rightTab === "chat" && (
              <AIChatPanel
                projectCode={mainCode}
                projectName={project.name}
                model={model}
                geminiKey={geminiKey}
                qwenKey={qwenKey}
                onApplyCode={applyAICode}
                errorContext={errorContext}
              />
            )}
            {rightTab === "preview" && (
              <GamePreview
                code={mainCode}
                onSendToAI={handlePreviewError}
              />
            )}
            {rightTab === "assets" && (
              <AssetManager
                assets={assets}
                onUpload={addAsset}
                onDelete={deleteFile}
                onGenerateCode={(asset) => {
                  setRightTab("chat");
                }}
              />
            )}
            {rightTab === "package" && (
              <PackageBuilder project={project} onManifestChange={updateManifest} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
