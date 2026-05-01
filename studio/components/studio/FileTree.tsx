'use client';

import { FileCode, FileJson, Image, Music, Plus, Trash2 } from "lucide-react";
import type { ProjectFile } from "@/lib/store/projects";

interface FileTreeProps {
  files: ProjectFile[];
  activeFile: string;
  onSelect: (name: string) => void;
  onAdd?: () => void;
  onDelete?: (name: string) => void;
}

function fileIcon(file: ProjectFile) {
  if (file.type === "python") return <FileCode size={14} style={{ color: "#8df77f" }} />;
  if (file.type === "json") return <FileJson size={14} style={{ color: "#ffcf4a" }} />;
  if (file.type === "asset" && file.mimeType?.startsWith("audio")) return <Music size={14} style={{ color: "#53d9e6" }} />;
  if (file.type === "asset") return <Image size={14} style={{ color: "#f26d5b" }} />;
  return <FileCode size={14} style={{ color: "#c9c3b3" }} />;
}

export default function FileTree({ files, activeFile, onSelect, onAdd, onDelete }: FileTreeProps) {
  const pythonFiles = files.filter((f) => f.type === "python");
  const jsonFiles = files.filter((f) => f.type === "json");
  const assets = files.filter((f) => f.type === "asset");

  const Section = ({ title, items }: { title: string; items: ProjectFile[] }) =>
    items.length === 0 ? null : (
      <div className="mb-3">
        <p
          className="px-3 py-1 text-xs font-bold uppercase tracking-widest"
          style={{ color: "#c9c3b3" }}
        >
          {title}
        </p>
        {items.map((file) => (
          <button
            key={file.name}
            onClick={() => onSelect(file.name)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors duration-100 group"
            style={{
              background: activeFile === file.name ? "rgba(141,247,127,0.10)" : "transparent",
              color: activeFile === file.name ? "#f3efe4" : "#c9c3b3",
              borderLeft: activeFile === file.name ? "2px solid #8df77f" : "2px solid transparent",
            }}
          >
            {fileIcon(file)}
            <span className="flex-1 truncate text-xs font-mono">{file.name}</span>
            {onDelete && file.name !== "main.py" && file.name !== "manifest.ok.json" && (
              <span
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onDelete(file.name); }}
              >
                <Trash2 size={12} style={{ color: "#f26d5b" }} />
              </span>
            )}
          </button>
        ))}
      </div>
    );

  return (
    <div
      className="flex flex-col h-full overflow-y-auto py-2"
      style={{ background: "#181a16", borderRight: "1px solid rgba(243,239,228,0.08)" }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b mb-1"
        style={{ borderColor: "rgba(243,239,228,0.08)" }}
      >
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#c9c3b3" }}>
          Files
        </span>
        {onAdd && (
          <button
            onClick={onAdd}
            className="p-1 rounded transition-colors"
            style={{ color: "#8df77f" }}
            title="Add file"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <Section title="Scripts" items={pythonFiles} />
      <Section title="Config" items={jsonFiles} />
      <Section title="Assets" items={assets} />
    </div>
  );
}
