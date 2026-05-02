'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Code2,
  BookOpen,
  FolderOpen,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/studio", icon: Code2, label: "Studio" },
  { href: "/learn", icon: BookOpen, label: "Learn" },
  { href: "/library", icon: FolderOpen, label: "Library" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col shrink-0 w-16 md:w-52 h-full border-r"
      style={{
        background: "#181a16",
        borderColor: "rgba(243,239,228,0.10)",
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-3 py-5 border-b"
        style={{ borderColor: "rgba(243,239,228,0.10)" }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-md shrink-0">
          <Image
            src="/okama-labs-logo.svg"
            alt="Okamalabs"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="hidden md:block min-w-0">
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: "#8df77f" }}>
            Okama
          </p>
          <p className="text-xs font-semibold" style={{ color: "#c9c3b3" }}>
            Studio
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-2 py-2.5 rounded-md transition-colors duration-150 group"
              style={{
                background: active ? "rgba(141,247,127,0.12)" : "transparent",
                color: active ? "#8df77f" : "#c9c3b3",
              }}
              title={label}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.5 : 2}
                className="shrink-0"
              />
              <span className="hidden md:block text-sm font-semibold truncate">
                {label}
              </span>
              {active && (
                <span
                  className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "#8df77f" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Version pill */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-4 border-t"
        style={{ borderColor: "rgba(243,239,228,0.10)" }}
      >
        <span
          className="text-xs px-2 py-0.5 rounded font-mono"
          style={{ background: "rgba(83,217,230,0.12)", color: "#53d9e6" }}
        >
          v0.1.0
        </span>
        <span className="text-xs" style={{ color: "#c9c3b3" }}>
          MVP
        </span>
      </div>
    </aside>
  );
}
