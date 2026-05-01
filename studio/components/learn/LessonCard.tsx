'use client';

import Link from "next/link";
import { Lock, CheckCircle, Star, Zap } from "lucide-react";
import type { Lesson } from "@/lib/lessons/curriculum";

interface LessonCardProps {
  lesson: Lesson;
  completed?: boolean;
  locked?: boolean;
  xpEarned?: number;
}

const CHAPTER_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "rgba(141,247,127,0.08)", text: "#8df77f", border: "rgba(141,247,127,0.2)" },
  2: { bg: "rgba(141,247,127,0.08)", text: "#8df77f", border: "rgba(141,247,127,0.2)" },
  3: { bg: "rgba(141,247,127,0.08)", text: "#8df77f", border: "rgba(141,247,127,0.2)" },
  4: { bg: "rgba(141,247,127,0.08)", text: "#8df77f", border: "rgba(141,247,127,0.2)" },
  5: { bg: "rgba(141,247,127,0.08)", text: "#8df77f", border: "rgba(141,247,127,0.2)" },
  6: { bg: "rgba(83,217,230,0.08)", text: "#53d9e6", border: "rgba(83,217,230,0.2)" },
  7: { bg: "rgba(83,217,230,0.08)", text: "#53d9e6", border: "rgba(83,217,230,0.2)" },
  8: { bg: "rgba(83,217,230,0.08)", text: "#53d9e6", border: "rgba(83,217,230,0.2)" },
  9: { bg: "rgba(83,217,230,0.08)", text: "#53d9e6", border: "rgba(83,217,230,0.2)" },
  10: { bg: "rgba(255,207,74,0.08)", text: "#ffcf4a", border: "rgba(255,207,74,0.2)" },
};

export default function LessonCard({ lesson, completed = false, locked = false, xpEarned }: LessonCardProps) {
  const colors = CHAPTER_COLORS[lesson.chapter] ?? CHAPTER_COLORS[1];

  return (
    <Link
      href={locked ? "#" : `/learn/${lesson.slug}`}
      className="block rounded-xl border transition-all duration-200 overflow-hidden group"
      style={{
        borderColor: completed ? "rgba(141,247,127,0.3)" : colors.border,
        background: completed ? "rgba(141,247,127,0.04)" : "#181a16",
        opacity: locked ? 0.5 : 1,
        cursor: locked ? "not-allowed" : "pointer",
        pointerEvents: locked ? "none" : "auto",
      }}
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ background: colors.bg }}
          >
            {locked ? (
              <Lock size={14} style={{ color: colors.text }} />
            ) : completed ? (
              <CheckCircle size={14} style={{ color: "#8df77f" }} />
            ) : (
              <span className="text-xs font-black" style={{ color: colors.text }}>
                {String(lesson.chapter).padStart(2, "0")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {lesson.badge && completed && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(255,207,74,0.12)", color: "#ffcf4a" }}
              >
                🏆 {lesson.badge}
              </span>
            )}
            <div className="flex items-center gap-1">
              <Zap size={11} style={{ color: colors.text }} />
              <span className="text-xs font-bold" style={{ color: colors.text }}>
                {xpEarned !== undefined ? `${xpEarned}/` : ""}{lesson.xp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <h3
          className="font-bold text-sm mb-1 group-hover:text-white transition-colors"
          style={{ color: completed ? "#f3efe4" : "#c9c3b3" }}
        >
          {lesson.title}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: "#6b7464" }}>
          {lesson.description}
        </p>

        {/* Concept pill */}
        <div
          className="mt-3 px-2 py-1 rounded text-xs"
          style={{ background: "rgba(243,239,228,0.04)", color: "#c9c3b3", border: "1px solid rgba(243,239,228,0.06)" }}
        >
          <span style={{ color: colors.text }}>Concept: </span>
          {lesson.concept.length > 60 ? lesson.concept.slice(0, 57) + "…" : lesson.concept}
        </div>

        {/* Exercises count */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs" style={{ color: "#6b7464" }}>
            {lesson.exercises.length} exercise{lesson.exercises.length !== 1 ? "s" : ""}
          </span>
          {completed && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "#8df77f" }}>
              <Star size={10} fill="currentColor" /> Completed
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
