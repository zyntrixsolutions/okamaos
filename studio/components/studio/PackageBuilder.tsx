'use client';

import { useState } from "react";
import { Package, Download, CheckCircle, AlertCircle, Loader2, Info, Server, Wifi } from "lucide-react";
import { buildOkPackage, buildAndDownload, validateManifest, type BuildResult } from "@/lib/package/builder";
import type { Project, OkManifest } from "@/lib/store/projects";

interface PackageBuilderProps {
  project: Project;
  onManifestChange?: (manifest: OkManifest) => void;
}

export default function PackageBuilder({ project, onManifestChange }: PackageBuilderProps) {
  const [building, setBuilding] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [publishResult, setPublishResult] = useState<{ download_url: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [manifest, setManifest] = useState<OkManifest>({ ...project.manifest });

  const updateField = <K extends keyof OkManifest>(key: K, value: OkManifest[K]) => {
    const updated = { ...manifest, [key]: value };
    setManifest(updated);
    onManifestChange?.(updated);
  };

  const handleBuild = async () => {
    const errs = validateManifest(manifest);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setBuilding(true);
    setResult(null);
    setPublishResult(null);
    try {
      const built = await buildAndDownload({ ...project, manifest });
      setResult(built);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Build failed"]);
    } finally {
      setBuilding(false);
    }
  };

  const handlePublishToServer = async () => {
    const errs = validateManifest(manifest);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setPublishing(true);
    setPublishResult(null);
    try {
      const built = await buildOkPackage({ ...project, manifest });
      const fd = new FormData();
      fd.append("package", new File([built.blob], built.filename, { type: "application/octet-stream" }));
      fd.append("manifest", JSON.stringify(manifest));
      const res = await fetch("/api/dev-store/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setResult(built);
      setPublishResult({ download_url: data.download_url });
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Publish failed"]);
    } finally {
      setPublishing(false);
    }
  };

  const perms = ["controller", "audio", "save_data", "network", "camera"];

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full" style={{ background: "#10120f" }}>
      <div className="flex items-center gap-2">
        <Package size={16} style={{ color: "#ffcf4a" }} />
        <span className="text-sm font-black uppercase tracking-widest" style={{ color: "#ffcf4a" }}>
          Build .ok Package
        </span>
      </div>

      {/* Manifest fields */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-3"
        style={{ borderColor: "rgba(243,239,228,0.10)", background: "#181a16" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c9c3b3" }}>
          Manifest
        </p>

        {[
          { key: "name" as const, label: "Game Name" },
          { key: "id" as const, label: "Package ID", hint: "com.publisher.game" },
          { key: "version" as const, label: "Version", hint: "0.1.0" },
          { key: "description" as const, label: "Description" },
        ].map(({ key, label, hint }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: "#c9c3b3" }}>{label}</label>
            <input
              value={(manifest[key] as string) ?? ""}
              onChange={(e) => updateField(key, e.target.value as OkManifest[typeof key])}
              placeholder={hint}
              className="px-3 py-2 rounded-lg text-sm font-mono outline-none border transition-colors"
              style={{
                background: "#10120f",
                color: "#f3efe4",
                borderColor: "rgba(243,239,228,0.12)",
                caretColor: "#8df77f",
              }}
            />
          </div>
        ))}

        {/* Numeric fields */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "min_ram_mb" as const, label: "Min RAM (MB)" },
            { key: "target_fps" as const, label: "Target FPS" },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: "#c9c3b3" }}>{label}</label>
              <input
                type="number"
                value={manifest[key] as number}
                onChange={(e) => updateField(key, parseInt(e.target.value) as OkManifest[typeof key])}
                className="px-3 py-2 rounded-lg text-sm font-mono outline-none border"
                style={{ background: "#10120f", color: "#f3efe4", borderColor: "rgba(243,239,228,0.12)" }}
              />
            </div>
          ))}
        </div>

        {/* Permissions */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "#c9c3b3" }}>Permissions</label>
          <div className="flex flex-wrap gap-2">
            {perms.map((p) => {
              const active = manifest.permissions.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => {
                    const next = active
                      ? manifest.permissions.filter((x) => x !== p)
                      : [...manifest.permissions, p];
                    updateField("permissions", next);
                  }}
                  className="px-2.5 py-1 rounded-full text-xs font-bold transition-colors"
                  style={{
                    background: active ? "rgba(141,247,127,0.15)" : "rgba(243,239,228,0.06)",
                    color: active ? "#8df77f" : "#c9c3b3",
                    border: `1px solid ${active ? "rgba(141,247,127,0.3)" : "rgba(243,239,228,0.10)"}`,
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-2">
          {[
            { key: "supports_save_state" as const, label: "Supports Save State" },
            { key: "controller_required" as const, label: "Controller Required" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold" style={{ color: "#c9c3b3" }}>{label}</span>
              <div
                onClick={() => updateField(key, !manifest[key] as OkManifest[typeof key])}
                className="w-10 h-5 rounded-full relative transition-colors cursor-pointer"
                style={{ background: manifest[key] ? "#8df77f" : "rgba(243,239,228,0.12)" }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                  style={{
                    background: manifest[key] ? "#10120f" : "#c9c3b3",
                    transform: manifest[key] ? "translateX(22px)" : "translateX(2px)",
                  }}
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Info */}
      <div
        className="flex gap-2 p-3 rounded-lg"
        style={{ background: "rgba(83,217,230,0.06)", border: "1px solid rgba(83,217,230,0.15)" }}
      >
        <Info size={13} style={{ color: "#53d9e6", flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs" style={{ color: "#c9c3b3" }}>
          Downloads <code style={{ color: "#53d9e6" }}>.ok</code> + <code style={{ color: "#53d9e6" }}>.ok.sig</code> (SHA-256 signed).
          Copy to USB → install via OkamaOS Install Game browser.
        </p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div
          className="p-3 rounded-lg"
          style={{ background: "rgba(242,109,91,0.08)", border: "1px solid rgba(242,109,91,0.2)" }}
        >
          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle size={13} style={{ color: "#f26d5b", flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs" style={{ color: "#f26d5b" }}>{e}</p>
            </div>
          ))}
        </div>
      )}

      {/* Publish success */}
      {publishResult && (
        <div
          className="p-3 rounded-lg"
          style={{ background: "rgba(83,217,230,0.06)", border: "1px solid rgba(83,217,230,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Wifi size={14} style={{ color: "#53d9e6" }} />
            <span className="text-xs font-bold" style={{ color: "#53d9e6" }}>Published to Dev Server!</span>
          </div>
          <p className="text-xs font-mono truncate" style={{ color: "#6b7464" }}>{publishResult.download_url}</p>
          <p className="text-xs mt-1" style={{ color: "#c9c3b3" }}>
            Go to <strong>Server</strong> tab for the console store URL.
          </p>
        </div>
      )}

      {/* Build success */}
      {result && !publishResult && (
        <div
          className="p-3 rounded-lg"
          style={{ background: "rgba(141,247,127,0.06)", border: "1px solid rgba(141,247,127,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} style={{ color: "#8df77f" }} />
            <span className="text-xs font-bold" style={{ color: "#8df77f" }}>Build successful!</span>
          </div>
          <p className="text-xs font-mono" style={{ color: "#c9c3b3" }}>{result.filename}</p>
          <p className="text-xs" style={{ color: "#6b7464" }}>{result.sizekb} KB</p>
          <p className="text-xs font-mono mt-1 truncate" style={{ color: "#6b7464" }}>
            sha256: {result.sha256.slice(0, 16)}…
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleBuild}
          disabled={building || publishing}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors"
          style={{
            background: building ? "rgba(255,207,74,0.10)" : "#ffcf4a",
            color: building ? "#ffcf4a" : "#10120f",
            cursor: (building || publishing) ? "not-allowed" : "pointer",
          }}
        >
          {building ? (
            <><Loader2 size={16} className="animate-spin" /> Building…</>
          ) : (
            <><Download size={16} /> Export .ok Package</>
          )}
        </button>

        <button
          onClick={handlePublishToServer}
          disabled={building || publishing}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors"
          style={{
            background: publishing ? "rgba(83,217,230,0.08)" : "rgba(83,217,230,0.12)",
            color: publishing ? "#53d9e6" : "#53d9e6",
            border: "1px solid rgba(83,217,230,0.25)",
            cursor: (building || publishing) ? "not-allowed" : "pointer",
          }}
        >
          {publishing ? (
            <><Loader2 size={15} className="animate-spin" /> Publishing…</>
          ) : (
            <><Server size={15} /> Publish to Dev Server</>
          )}
        </button>
      </div>
    </div>
  );
}
