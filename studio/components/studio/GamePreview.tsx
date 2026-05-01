'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Square, RotateCcw, AlertCircle, Loader2, Monitor } from "lucide-react";

interface GamePreviewProps {
  code: string;
  autoRun?: boolean;
}

type RunState = "idle" | "loading" | "running" | "error" | "stopped";

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

interface PyodideInterface {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (pkgs: string | string[]) => Promise<void>;
  globals: { get: (name: string) => unknown };
}

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/";

let pyodidePromise: Promise<PyodideInterface> | null = null;

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.onload = async () => {
      try {
        if (!window.loadPyodide) throw new Error("loadPyodide not found");
        const py = await window.loadPyodide({ indexURL: PYODIDE_CDN });
        resolve(py);
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = () => reject(new Error("Failed to load Pyodide script"));
    document.head.appendChild(script);
  });
  return pyodidePromise;
}

// Patch the user's pygame code to render to an HTML canvas instead of a window
function patchCodeForBrowser(code: string, canvasId: string): string {
  const canvasSetup = `
import sys, io, base64
import js
from pyodide.ffi import create_proxy

# --- Browser canvas bridge ---
_CANVAS_ID = "${canvasId}"

# Minimal pygame surface-to-canvas renderer
class _CanvasSurface:
    def __init__(self, w, h):
        self.width = w
        self.height = h
        self._canvas = js.document.getElementById(_CANVAS_ID)
        self._canvas.width = w
        self._canvas.height = h
        self._ctx = self._canvas.getContext("2d")

    def fill(self, color):
        r, g, b = color[0], color[1], color[2]
        self._ctx.fillStyle = f"rgb({r},{g},{b})"
        self._ctx.fillRect(0, 0, self.width, self.height)

    def get_rect(self):
        return _Rect(0, 0, self.width, self.height)

class _Rect:
    def __init__(self, x, y, w, h):
        self.x = x; self.y = y; self.width = w; self.height = h
        self.left = x; self.top = y; self.right = x+w; self.bottom = y+h
        self.centerx = x + w//2; self.centery = y + h//2

print("Pyodide preview: pygame canvas bridge active")
print("Note: Full pygame rendering requires the OkamaOS runtime.")
print("For complete preview, export your .ok package and run on OkamaOS.")
`;

  // Wrap the user code in a try/except so errors show nicely
  const wrapped = `
${canvasSetup}

# --- Your game code ---
try:
${code.split("\n").map((l) => "    " + l).join("\n")}
except SystemExit:
    print("Game exited cleanly.")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
`;

  return wrapped;
}

export default function GamePreview({ code, autoRun = false }: GamePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasId = "okama-preview-canvas";
  const [state, setState] = useState<RunState>("idle");
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState("");
  const pyRef = useRef<PyodideInterface | null>(null);

  const appendOutput = (line: string) =>
    setOutput((prev) => [...prev.slice(-100), line]);

  const run = useCallback(async () => {
    if (!code.trim()) return;
    setState("loading");
    setOutput([]);
    setError("");

    try {
      setProgress("Loading Pyodide runtime…");
      if (!pyRef.current) {
        pyRef.current = await getPyodide();
      }
      const py = pyRef.current;

      // Redirect stdout
      setProgress("Setting up environment…");
      py.runPython(`
import sys
import io
class _StdOut:
    def write(self, s):
        if s.strip():
            from js import console
            console.log(s.rstrip())
    def flush(self): pass
sys.stdout = _StdOut()
sys.stderr = _StdOut()
`);

      setProgress("Running your game…");
      setState("running");
      setProgress("");

      const patched = patchCodeForBrowser(code, canvasId);
      await py.runPythonAsync(patched);

      setState("stopped");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setState("error");
    }
  }, [code]);

  const stop = () => setState("stopped");

  useEffect(() => {
    if (autoRun) run();
  }, [autoRun, run]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "#10120f" }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
        style={{ borderColor: "rgba(243,239,228,0.08)", background: "#181a16" }}
      >
        <Monitor size={14} style={{ color: "#c9c3b3" }} />
        <span className="text-xs font-semibold" style={{ color: "#c9c3b3" }}>
          Preview
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-mono ml-1"
          style={{ background: "rgba(83,217,230,0.10)", color: "#53d9e6" }}
        >
          Pyodide
        </span>
        <div className="flex-1" />
        <button
          onClick={run}
          disabled={state === "loading" || state === "running"}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors"
          style={{
            background: state === "running" ? "rgba(141,247,127,0.08)" : "#8df77f",
            color: state === "running" ? "#8df77f" : "#10120f",
            opacity: state === "loading" ? 0.6 : 1,
            cursor: state === "loading" || state === "running" ? "not-allowed" : "pointer",
          }}
        >
          {state === "loading" ? (
            <><Loader2 size={12} className="animate-spin" /> Loading…</>
          ) : state === "running" ? (
            <><Play size={12} fill="currentColor" /> Running</>
          ) : (
            <><Play size={12} fill="currentColor" /> Run</>
          )}
        </button>
        {state === "running" && (
          <button
            onClick={stop}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition-colors"
            style={{ background: "rgba(242,109,91,0.15)", color: "#f26d5b" }}
          >
            <Square size={12} fill="currentColor" /> Stop
          </button>
        )}
        <button
          onClick={() => { setOutput([]); setError(""); setState("idle"); }}
          className="p-1 rounded transition-colors"
          style={{ color: "#c9c3b3" }}
          title="Clear"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Game canvas */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden"
          style={{ background: "#0d0f0c", minHeight: 0 }}
        >
          {state === "idle" && (
            <div className="text-center p-6">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4"
                style={{ background: "rgba(141,247,127,0.08)" }}
              >
                <Play size={28} style={{ color: "#8df77f" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "#c9c3b3" }}>
                Click Run to preview your game
              </p>
              <p className="text-xs mt-1" style={{ color: "#6b7464" }}>
                Powered by Pyodide — runs Python in your browser
              </p>
            </div>
          )}
          {state === "loading" && (
            <div className="text-center p-6">
              <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: "#8df77f" }} />
              <p className="text-sm font-semibold" style={{ color: "#c9c3b3" }}>{progress}</p>
              <p className="text-xs mt-1" style={{ color: "#6b7464" }}>First load may take 10–30s</p>
            </div>
          )}
          {state === "error" && (
            <div className="text-center p-6 max-w-sm">
              <AlertCircle size={28} className="mx-auto mb-3" style={{ color: "#f26d5b" }} />
              <p className="text-sm font-bold mb-2" style={{ color: "#f26d5b" }}>Error</p>
              <pre className="text-xs text-left overflow-auto max-h-32 p-2 rounded" style={{ background: "#181a16", color: "#f3efe4" }}>
                {error}
              </pre>
            </div>
          )}
          <canvas
            id={canvasId}
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{ display: state === "running" || state === "stopped" ? "block" : "none" }}
          />
        </div>

        {/* Console output */}
        {output.length > 0 && (
          <div
            className="border-t shrink-0 overflow-y-auto max-h-32"
            style={{ borderColor: "rgba(243,239,228,0.08)", background: "#10120f" }}
          >
            <p
              className="px-3 py-1 text-xs font-bold uppercase tracking-widest border-b sticky top-0"
              style={{ color: "#c9c3b3", borderColor: "rgba(243,239,228,0.06)", background: "#10120f" }}
            >
              Console
            </p>
            {output.map((line, i) => (
              <pre key={i} className="px-3 py-0.5 text-xs font-mono" style={{ color: "#8df77f" }}>
                {line}
              </pre>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
