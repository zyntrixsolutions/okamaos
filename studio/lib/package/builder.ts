'use client';

import JSZip from "jszip";
import type { Project, ProjectFile } from "@/lib/store/projects";

export interface BuildResult {
  blob: Blob;
  filename: string;
  sizekb: number;
  sha256: string;
  manifest: Record<string, unknown>;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function buildOkPackage(project: Project): Promise<BuildResult> {
  const zip = new JSZip();
  const fileHashes: Record<string, string> = {};

  for (const file of project.files) {
    if (file.type === "asset" && file.dataUrl) {
      // Convert data URL to binary
      const base64 = file.dataUrl.split(",")[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const buf = bytes.buffer;
      zip.file(`assets/${file.name}`, bytes);
      fileHashes[`assets/${file.name}`] = await sha256Hex(buf);
    } else {
      const content = file.name === "manifest.ok.json"
        ? JSON.stringify(project.manifest, null, 2)
        : file.content;
      const encoded = new TextEncoder().encode(content);
      zip.file(file.name, encoded);
      fileHashes[file.name] = await sha256Hex(encoded.buffer);
    }
  }

  // Ensure manifest is included
  if (!project.files.find((f) => f.name === "manifest.ok.json")) {
    const manifestStr = JSON.stringify(project.manifest, null, 2);
    const encoded = new TextEncoder().encode(manifestStr);
    zip.file("manifest.ok.json", encoded);
    fileHashes["manifest.ok.json"] = await sha256Hex(encoded.buffer);
  }

  const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const zipBuffer = await zipBlob.arrayBuffer();
  const packageHash = await sha256Hex(zipBuffer);

  const sig = {
    package_sha256: packageHash,
    files: fileHashes,
    built_at: new Date().toISOString(),
    built_with: "okama-studio",
    version: project.manifest.version,
    id: project.manifest.id,
  };

  const safeName = project.manifest.id.replace(/\./g, "-");
  const filename = `${safeName}-${project.manifest.version}.ok`;

  return {
    blob: zipBlob,
    filename,
    sizekb: Math.round(zipBlob.size / 1024),
    sha256: packageHash,
    manifest: project.manifest as unknown as Record<string, unknown>,
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function buildAndDownload(project: Project): Promise<BuildResult> {
  const result = await buildOkPackage(project);
  downloadBlob(result.blob, result.filename);

  // Also download the signature file
  const sigBlob = new Blob([JSON.stringify({
    package_sha256: result.sha256,
    built_at: new Date().toISOString(),
    id: project.manifest.id,
    version: project.manifest.version,
  }, null, 2)], { type: "application/json" });
  downloadBlob(sigBlob, result.filename.replace(".ok", ".ok.sig"));

  return result;
}

export function validateManifest(manifest: Partial<Project["manifest"]>): string[] {
  const errors: string[] = [];
  const required = ["name", "id", "version", "runtime", "entry", "min_ram_mb", "target_fps", "permissions", "age_rating"];

  for (const field of required) {
    if (!manifest[field as keyof typeof manifest]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (manifest.id && !/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(manifest.id)) {
    errors.push("ID must be reverse-domain format (e.g. com.publisher.game)");
  }

  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push("Version must be semver (e.g. 0.1.0)");
  }

  return errors;
}
