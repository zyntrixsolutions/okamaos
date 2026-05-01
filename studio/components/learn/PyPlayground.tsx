'use client';

import { useState, useRef, useCallback } from "react";
import { Play, RotateCcw, Loader2, CheckCircle, XCircle } from "lucide-react";
import Editor from "@monaco-editor/react";

interface PyPlaygroundProps {
  initialCode?: string;
  expectedOutput?: string;
  checkHint?: string;
  onSuccess?: () => void;
  readOnly?: boolean;
  label?: string;
}

type PyLite = {
  runPythonAsync: (code: string) => Promise<unknown>;
  runPython: (code: string) => unknown;
};

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/";
const _w = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;

async function getPyodideInstance(): Promise<PyLite> {
  if (_w && _w["_pyodideReady"]) return _w["_pyodideReady"] as Promise<PyLite>;
  if (_w && !_w["loadPyodide"]) {
    await new Promise<void>((res, rej) => {
      const s = document.createElement("script");
      s.src = `${PYODIDE_CDN}pyodide.js`;
      s.onload = () => res();
      s.onerror = () => rej(new Error("Failed to load Pyodide"));
      document.head.appendChild(s);
    });
  }
  const loader = _w!["loadPyodide"] as (cfg: { indexURL: string }) => Promise<PyLite>;
  const p = loader({ indexURL: PYODIDE_CDN });
  if (_w) _w["_pyodideReady"] = p;
  return p;
}

export default function PyPlayground({
  initialCode = "print('Hello, OkamaOS!')",
  expectedOutput,
  checkHint,
  onSuccess,
  readOnly = false,
  label = "Python Playground",
}: PyPlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "pass" | "fail">("idle");

  const run = useCallback(async () => {
    setRunning(true);
    setOutput([]);
    setError("");
    setStatus("idle");

    try {
      const py = await getPyodideInstance();

      // Capture stdout
      let captured = "";
      py.runPython(`
import sys, io
_buf = io.StringIO()
sys.stdout = _buf
sys.stderr = _buf
`);

      await py.runPythonAsync(code);

      const out = py.runPython("_buf.getvalue()") as string;
      py.runPython("sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__");

      const lines = out.split("\n").filter((l) => l !== "");
      setOutput(lines);

      // Check against expected output
      if (expectedOutput) {
        const actual = out.trim();
        const expected = expectedOutput.trim();
        if (actual === expected || actual.includes(expected)) {
          setStatus("pass");
          onSuccess?.();
        } else {
          setStatus("fail");
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.split("\n").slice(-3).join("\n"));
      setStatus("fail");
    } finally {
      setRunning(false);
    }
  }, [code, expectedOutput, onSuccess]);

  const reset = () => {
    setCode(initialCode);
    setOutput([]);
    setError("");
    setStatus("idle");
  };

  return (
    <div
      className="rounded-xl overflow-hidden border flex flex-col"
      style={{ borderColor: "rgba(243,239,228,0.12)", background: "#181a16", minHeight: 280 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "rgba(243,239,228,0.08)" }}
      >
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#53d9e6" }}>
          {label}
        </span>
        <div className="flex gap-2 items-center">
          <button
            onClick={reset}
            className="p-1 rounded transition-colors"
            style={{ color: "#c9c3b3" }}
            title="Reset"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors"
            style={{
              background: running ? "rgba(141,247,127,0.08)" : "#8df77f",
              color: running ? "#8df77f" : "#10120f",
              cursor: running ? "not-allowed" : "pointer",
            }}
          >
            {running ? (
              <><Loader2 size={11} className="animate-spin" /> Running…</>
            ) : (
              <><Play size={11} fill="currentColor" /> Run</>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div style={{ height: 180 }}>
        <Editor
          height="180px"
          language="python"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            theme: "vs-dark",
            fontSize: 13,
            fontFamily: '"Cascadia Code", "Fira Code", monospace',
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            readOnly,
            padding: { top: 10, bottom: 10 },
            scrollbar: { verticalScrollbarSize: 4 },
          }}
          onMount={(_, monaco) => {
            monaco.editor.defineTheme("okama-dark", {
              base: "vs-dark",
              inherit: true,
              rules: [
                { token: "keyword", foreground: "8df77f", fontStyle: "bold" },
                { token: "string", foreground: "ffcf4a" },
                { token: "number", foreground: "53d9e6" },
                { token: "comment", foreground: "6b7464", fontStyle: "italic" },
              ],
              colors: {
                "editor.background": "#181a16",
                "editor.foreground": "#f3efe4",
                "editorLineNumber.foreground": "#3a3d36",
                "editorCursor.foreground": "#8df77f",
                "editor.selectionBackground": "rgba(141,247,127,0.15)",
              },
            });
            monaco.editor.setTheme("okama-dark");
          }}
        />
      </div>

      {/* Output */}
      <div
        className="border-t min-h-14 p-3"
        style={{ borderColor: "rgba(243,239,228,0.08)", background: "#10120f" }}
      >
        {output.length > 0 && (
          <pre className="text-xs font-mono" style={{ color: "#8df77f", margin: 0 }}>
            {output.join("\n")}
          </pre>
        )}
        {error && (
          <pre className="text-xs font-mono" style={{ color: "#f26d5b", margin: 0 }}>
            {error}
          </pre>
        )}
        {output.length === 0 && !error && !running && (
          <p className="text-xs" style={{ color: "#6b7464" }}>Output will appear here…</p>
        )}

        {/* Pass/Fail badge */}
        {status === "pass" && (
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle size={15} style={{ color: "#8df77f" }} />
            <span className="text-sm font-bold" style={{ color: "#8df77f" }}>Correct! Well done! 🎉</span>
          </div>
        )}
        {status === "fail" && (
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2">
              <XCircle size={15} style={{ color: "#f26d5b" }} />
              <span className="text-sm font-bold" style={{ color: "#f26d5b" }}>Not quite — try again!</span>
            </div>
            {checkHint && (
              <p className="text-xs pl-5" style={{ color: "#ffcf4a" }}>Hint: {checkHint}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
