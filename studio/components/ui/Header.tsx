'use client';

import { ChevronRight, Cpu } from "lucide-react";

interface HeaderProps {
  crumbs?: Array<{ label: string; href?: string }>;
  right?: React.ReactNode;
  modelId?: string;
}

export default function Header({ crumbs, right, modelId }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between gap-4 px-4 py-3 border-b shrink-0"
      style={{
        background: "rgba(16,18,15,0.92)",
        borderColor: "rgba(243,239,228,0.10)",
        backdropFilter: "blur(12px)",
        zIndex: 10,
      }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
        <span className="font-black tracking-widest text-xs uppercase" style={{ color: "#8df77f" }}>
          Okama Studio
        </span>
        {crumbs?.map((c, i) => (
          <span key={i} className="flex items-center gap-1 min-w-0">
            <ChevronRight size={14} style={{ color: "#c9c3b3", flexShrink: 0 }} />
            <span
              className="truncate font-semibold"
              style={{ color: i === crumbs.length - 1 ? "#f3efe4" : "#c9c3b3" }}
            >
              {c.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {modelId && (
          <span
            className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-1 rounded font-mono"
            style={{ background: "rgba(83,217,230,0.10)", color: "#53d9e6", border: "1px solid rgba(83,217,230,0.2)" }}
          >
            <Cpu size={12} />
            {modelId}
          </span>
        )}
        {right}
      </div>
    </header>
  );
}
