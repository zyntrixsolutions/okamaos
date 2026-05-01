'use client';

import { useState, useEffect } from "react";
import { BookOpen, Trophy, Zap, Search } from "lucide-react";
import Header from "@/components/ui/Header";
import LessonCard from "@/components/learn/LessonCard";
import { CURRICULUM, CHAPTER_LABELS, getTotalXP } from "@/lib/lessons/curriculum";

const CHAPTERS = [...new Set(CURRICULUM.map((l) => l.chapter))].sort((a, b) => a - b);

export default function LearnHub() {
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("okama-completed-lessons");
    setCompletedSlugs(raw ? JSON.parse(raw) : []);
  }, []);

  const earnedXP = CURRICULUM
    .filter((l) => completedSlugs.includes(l.slug))
    .reduce((s, l) => s + l.xp, 0);

  const filtered = search
    ? CURRICULUM.filter(
        (l) =>
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.description.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        crumbs={[{ label: "Learn" }]}
        right={
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: "#ffcf4a" }} />
            <span className="text-xs font-bold" style={{ color: "#ffcf4a" }}>
              {earnedXP} / {getTotalXP()} XP
            </span>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div
          className="px-6 py-8 border-b"
          style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.08)" }}
        >
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={18} style={{ color: "#53d9e6" }} />
              <span
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: "#53d9e6" }}
              >
                Python × Pygame Curriculum
              </span>
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ color: "#f3efe4" }}>
              Learn to make real games. 🎮
            </h1>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#c9c3b3", maxWidth: 540 }}>
              10 chapters from Python basics to cinematic pygame. Every lesson has live code
              you can run in the browser and an AI tutor to guide you through.
            </p>

            {/* XP bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-xs h-2 rounded-full overflow-hidden" style={{ background: "rgba(243,239,228,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(earnedXP / getTotalXP()) * 100}%`,
                    background: "linear-gradient(90deg, #8df77f, #53d9e6)",
                  }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: "#c9c3b3" }}>
                {completedSlugs.length}/{CURRICULUM.length} lessons
              </span>
              {completedSlugs.length === CURRICULUM.length && (
                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#ffcf4a" }}>
                  <Trophy size={12} /> Master!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Search + content */}
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-8"
            style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.10)" }}
          >
            <Search size={15} style={{ color: "#6b7464" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lessons…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#f3efe4", caretColor: "#8df77f" }}
            />
          </div>

          {filtered ? (
            <div>
              <p className="text-xs mb-4" style={{ color: "#c9c3b3" }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((lesson) => (
                  <LessonCard
                    key={lesson.slug}
                    lesson={lesson}
                    completed={completedSlugs.includes(lesson.slug)}
                  />
                ))}
              </div>
            </div>
          ) : (
            CHAPTERS.map((chapter) => {
              const lessons = CURRICULUM.filter((l) => l.chapter === chapter);
              const chapterLabel = CHAPTER_LABELS[chapter] ?? `Chapter ${chapter}`;
              return (
                <section key={chapter} className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black"
                      style={{
                        background: chapter <= 5 ? "rgba(141,247,127,0.12)" : chapter <= 9 ? "rgba(83,217,230,0.12)" : "rgba(255,207,74,0.12)",
                        color: chapter <= 5 ? "#8df77f" : chapter <= 9 ? "#53d9e6" : "#ffcf4a",
                      }}
                    >
                      {chapter}
                    </div>
                    <div>
                      <p
                        className="text-xs font-black uppercase tracking-widest"
                        style={{ color: chapter <= 5 ? "#8df77f" : chapter <= 9 ? "#53d9e6" : "#ffcf4a" }}
                      >
                        {chapterLabel}
                      </p>
                    </div>
                    <div
                      className="flex-1 h-px"
                      style={{ background: "rgba(243,239,228,0.06)" }}
                    />
                    <span className="text-xs" style={{ color: "#6b7464" }}>
                      {lessons.filter((l) => completedSlugs.includes(l.slug)).length}/{lessons.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lessons.map((lesson, i) => {
                      const lessonIdx = CURRICULUM.findIndex((l) => l.slug === lesson.slug);
                      const prevCompleted = lessonIdx === 0 || completedSlugs.includes(CURRICULUM[lessonIdx - 1].slug);
                      return (
                        <LessonCard
                          key={lesson.slug}
                          lesson={lesson}
                          completed={completedSlugs.includes(lesson.slug)}
                          locked={!prevCompleted && !completedSlugs.includes(lesson.slug) && i > 0}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
