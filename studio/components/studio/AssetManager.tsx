'use client';

import { useRef, useState } from "react";
import { Upload, Image, Music, Trash2, Copy, Check } from "lucide-react";
import type { ProjectFile } from "@/lib/store/projects";

interface AssetManagerProps {
  assets: ProjectFile[];
  onUpload: (file: ProjectFile) => void;
  onDelete: (name: string) => void;
  onGenerateCode?: (asset: ProjectFile) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function genPygameCode(asset: ProjectFile): string {
  const path = `assets/${asset.name}`;
  if (asset.mimeType?.startsWith("image/")) {
    return `# Load image asset\n${asset.name.replace(/\W/g, "_").replace(/\.\w+$/, "")} = pygame.image.load("${path}").convert_alpha()\nscreen.blit(${asset.name.replace(/\W/g, "_").replace(/\.\w+$/, "")}, (0, 0))`;
  }
  if (asset.mimeType?.startsWith("audio/")) {
    return `# Load and play audio\npygame.mixer.Sound("${path}").play()`;
  }
  return `# Asset: ${path}`;
}

export default function AssetManager({ assets, onUpload, onDelete, onGenerateCode }: AssetManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const pf: ProjectFile = {
          name: file.name,
          content: "",
          type: "asset",
          mimeType: file.type,
          dataUrl,
        };
        onUpload(pf);
      };
      reader.readAsDataURL(file);
    });
  };

  const copyCode = (asset: ProjectFile) => {
    const code = genPygameCode(asset);
    navigator.clipboard.writeText(code);
    setCopied(asset.name);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: "#10120f" }}
    >
      {/* Drop zone */}
      <div
        className="m-3 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 py-6 cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? "#8df77f" : "rgba(243,239,228,0.15)",
          background: dragging ? "rgba(141,247,127,0.05)" : "transparent",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={20} style={{ color: "#8df77f" }} />
        <p className="text-sm font-semibold" style={{ color: "#c9c3b3" }}>
          Drop images or audio here
        </p>
        <p className="text-xs" style={{ color: "#6b7464" }}>
          .png .jpg .wav .mp3 .ogg
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,audio/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Asset list */}
      {assets.length === 0 ? (
        <p className="text-center text-xs px-4 pb-4" style={{ color: "#6b7464" }}>
          No assets yet — drop some files above!
        </p>
      ) : (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {assets.map((asset) => (
            <div
              key={asset.name}
              className="rounded-lg overflow-hidden border"
              style={{ borderColor: "rgba(243,239,228,0.10)", background: "#181a16" }}
            >
              {/* Preview */}
              {asset.mimeType?.startsWith("image/") && asset.dataUrl && (
                <div
                  className="w-full h-24 flex items-center justify-center overflow-hidden"
                  style={{ background: "#10120f" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.dataUrl}
                    alt={asset.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              {asset.mimeType?.startsWith("audio/") && (
                <div className="flex items-center justify-center h-16" style={{ background: "#10120f" }}>
                  <Music size={24} style={{ color: "#53d9e6" }} />
                </div>
              )}

              {/* Meta */}
              <div className="p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-bold truncate" style={{ color: "#f3efe4" }}>
                      {asset.name}
                    </p>
                    <p className="text-xs" style={{ color: "#6b7464" }}>
                      {asset.mimeType}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyCode(asset)}
                      className="p-1 rounded transition-colors"
                      style={{ color: copied === asset.name ? "#8df77f" : "#c9c3b3" }}
                      title="Copy pygame code"
                    >
                      {copied === asset.name ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    <button
                      onClick={() => onDelete(asset.name)}
                      className="p-1 rounded transition-colors"
                      style={{ color: "#f26d5b" }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {onGenerateCode && (
                  <button
                    onClick={() => onGenerateCode(asset)}
                    className="mt-2 w-full text-xs py-1 rounded font-semibold transition-colors"
                    style={{ background: "rgba(141,247,127,0.10)", color: "#8df77f" }}
                  >
                    Ask AI to integrate this
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
