'use client';

import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  fileName?: string;
}

export default function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  fileName,
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const detectedLang = language ?? detectLanguage(fileName ?? "");

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define OkamaOS dark theme
    monaco.editor.defineTheme("okama-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b7464", fontStyle: "italic" },
        { token: "keyword", foreground: "8df77f", fontStyle: "bold" },
        { token: "string", foreground: "ffcf4a" },
        { token: "number", foreground: "53d9e6" },
        { token: "operator", foreground: "f3efe4" },
        { token: "type", foreground: "f26d5b" },
        { token: "function", foreground: "8df77f" },
        { token: "variable", foreground: "f3efe4" },
        { token: "delimiter", foreground: "c9c3b3" },
        { token: "identifier", foreground: "f3efe4" },
      ],
      colors: {
        "editor.background": "#181a16",
        "editor.foreground": "#f3efe4",
        "editorLineNumber.foreground": "#3a3d36",
        "editorLineNumber.activeForeground": "#8df77f",
        "editor.selectionBackground": "rgba(141,247,127,0.18)",
        "editor.lineHighlightBackground": "rgba(243,239,228,0.04)",
        "editorCursor.foreground": "#8df77f",
        "editor.inactiveSelectionBackground": "rgba(141,247,127,0.08)",
        "scrollbarSlider.background": "rgba(58,61,54,0.6)",
        "scrollbarSlider.hoverBackground": "rgba(141,247,127,0.3)",
        "editorWidget.background": "#181a16",
        "editorSuggestWidget.background": "#181a16",
        "editorSuggestWidget.border": "rgba(243,239,228,0.12)",
        "editorSuggestWidget.selectedBackground": "rgba(141,247,127,0.12)",
        "minimap.background": "#181a16",
      },
    });

    monaco.editor.setTheme("okama-dark");
  };

  return (
    <div className="flex-1 h-full min-h-0 overflow-hidden">
      <Editor
        height="100%"
        language={detectedLang}
        value={value}
        onMount={handleMount}
        onChange={(v) => onChange?.(v ?? "")}
        options={{
          theme: "okama-dark",
          fontSize: 14,
          fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", ui-monospace, monospace',
          fontLigatures: true,
          lineNumbers: "on",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          readOnly,
          tabSize: 4,
          insertSpaces: true,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
          formatOnPaste: true,
          smoothScrolling: true,
          cursorBlinking: "phase",
          cursorSmoothCaretAnimation: "on",
          padding: { top: 16, bottom: 16 },
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
      />
    </div>
  );
}

function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    py: "python",
    json: "json",
    md: "markdown",
    txt: "plaintext",
    js: "javascript",
    ts: "typescript",
  };
  return map[ext ?? ""] ?? "plaintext";
}
