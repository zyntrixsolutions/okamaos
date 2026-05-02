'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, Zap, Eye, EyeOff } from "lucide-react";
import Header from "@/components/ui/Header";
import PyPlayground from "@/components/learn/PyPlayground";
import AITutor from "@/components/learn/AITutor";
import { getLessonBySlug, CURRICULUM } from "@/lib/lessons/curriculum";
import type { ModelId } from "@/lib/ai/router";

interface LessonPageProps {
  slug: string;
}

export default function LessonPage({ slug }: LessonPageProps) {
  const router = useRouter();
  const lesson = getLessonBySlug(slug);

  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [model, setModel] = useState<ModelId>("gemini-2.5-flash-lite-preview-06-17");
  const [geminiKey, setGeminiKey] = useState("");
  const [qwenKey, setQwenKey] = useState("");
  const [playgroundCode, setPlaygroundCode] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("okama-completed-lessons");
    setCompletedSlugs(raw ? JSON.parse(raw) : []);
    setModel((localStorage.getItem("okama-model") as ModelId) ?? "gemini-2.5-flash-lite-preview-06-17");
    setGeminiKey(localStorage.getItem("okama-gemini-key") ?? "");
    setQwenKey(localStorage.getItem("okama-qwen-key") ?? "");
  }, []);

  useEffect(() => {
    if (lesson) {
      setPlaygroundCode(lesson.exercises[exerciseIdx]?.starterCode ?? lesson.codeDemo);
      setShowSolution(false);
    }
  }, [lesson, exerciseIdx]);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4">
        <p style={{ color: "#c9c3b3" }}>Lesson not found.</p>
        <Link href="/learn" className="text-sm font-bold" style={{ color: "#8df77f" }}>← Back to Lessons</Link>
      </div>
    );
  }

  const lessonIdx = CURRICULUM.findIndex((l) => l.slug === slug);
  const prevLesson = lessonIdx > 0 ? CURRICULUM[lessonIdx - 1] : null;
  const nextLesson = lessonIdx < CURRICULUM.length - 1 ? CURRICULUM[lessonIdx + 1] : null;
  const completed = completedSlugs.includes(slug);
  const currentExercise = lesson.exercises[exerciseIdx];

  const markComplete = () => {
    if (completed) return;
    const updated = [...completedSlugs, slug];
    setCompletedSlugs(updated);
    localStorage.setItem("okama-completed-lessons", JSON.stringify(updated));
  };

  const handleExerciseSuccess = () => {
    markComplete();
  };

  const earnedXP = CURRICULUM
    .filter((l) => completedSlugs.includes(l.slug))
    .reduce((s, l) => s + l.xp, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        crumbs={[{ label: "Learn", href: "/learn" }, { label: lesson.title }]}
        right={
          <span className="text-xs font-bold" style={{ color: "#ffcf4a" }}>
            <Zap size={11} className="inline mr-1" />{earnedXP} XP
          </span>
        }
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-widest"
                  style={{ background: "rgba(83,217,230,0.10)", color: "#53d9e6" }}
                >
                  Chapter {lesson.chapter}
                </span>
                {completed && (
                  <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#8df77f" }}>
                    <CheckCircle size={12} /> Completed
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: "#f3efe4" }}>{lesson.title}</h1>
              <p className="text-sm leading-relaxed" style={{ color: "#c9c3b3" }}>{lesson.description}</p>
            </div>

            {/* Concept box */}
            <div
              className="p-4 rounded-xl border-l-4"
              style={{
                background: "rgba(83,217,230,0.06)",
                borderLeftColor: "#53d9e6",
                borderTop: "1px solid rgba(83,217,230,0.15)",
                borderRight: "1px solid rgba(83,217,230,0.15)",
                borderBottom: "1px solid rgba(83,217,230,0.15)",
              }}
            >
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#53d9e6" }}>
                Core Concept
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#f3efe4" }}>{lesson.concept}</p>
            </div>

            {/* Theory */}
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest mb-3" style={{ color: "#c9c3b3" }}>
                Theory
              </h2>
              <div
                className="prose-sm leading-relaxed text-sm p-4 rounded-xl"
                style={{ background: "#181a16", color: "#f3efe4", border: "1px solid rgba(243,239,228,0.08)" }}
              >
                {lesson.theory.split("\n").map((line, i) => {
                  if (line.startsWith("```")) return null;
                  if (line.startsWith("#")) return (
                    <strong key={i} className="block mb-1" style={{ color: "#8df77f" }}>
                      {line.replace(/^#+\s/, "")}
                    </strong>
                  );
                  return (
                    <span key={i}
                      dangerouslySetInnerHTML={{
                        __html: line
                          .replace(/`([^`]+)`/g, `<code style="background:rgba(141,247,127,0.10);color:#8df77f;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:0.9em">$1</code>`)
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") + "\n"
                      }}
                      style={{ display: "block", marginBottom: 4 }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Code demo */}
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest mb-3" style={{ color: "#c9c3b3" }}>
                Live Demo — Run & Explore
              </h2>
              <PyPlayground
                initialCode={lesson.codeDemo}
                label="Try it live"
              />
            </div>

            {/* Exercises */}
            {lesson.exercises.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: "#c9c3b3" }}>
                    Exercise {exerciseIdx + 1} / {lesson.exercises.length}
                  </h2>
                  {lesson.exercises.length > 1 && (
                    <div className="flex gap-1">
                      {lesson.exercises.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setExerciseIdx(i)}
                          className="w-6 h-6 rounded-full text-xs font-bold transition-all"
                          style={{
                            background: i === exerciseIdx ? "#8df77f" : "rgba(243,239,228,0.08)",
                            color: i === exerciseIdx ? "#10120f" : "#c9c3b3",
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="p-3 rounded-xl mb-3"
                  style={{ background: "rgba(255,207,74,0.06)", border: "1px solid rgba(255,207,74,0.15)" }}
                >
                  <p className="text-sm font-bold" style={{ color: "#ffcf4a" }}>
                    📝 {currentExercise.prompt}
                  </p>
                </div>

                <PyPlayground
                  key={`${slug}-ex${exerciseIdx}`}
                  initialCode={currentExercise.starterCode}
                  expectedOutput={undefined}
                  checkHint={currentExercise.checkHint}
                  onSuccess={handleExerciseSuccess}
                  label="Your solution"
                />

                {/* Solution toggle */}
                <div className="mt-3">
                  <button
                    onClick={() => setShowSolution((v) => !v)}
                    className="flex items-center gap-2 text-xs font-bold"
                    style={{ color: "#6b7464" }}
                  >
                    {showSolution ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showSolution ? "Hide solution" : "Show solution"}
                  </button>
                  {showSolution && (
                    <div className="mt-2">
                      <PyPlayground
                        initialCode={currentExercise.solution}
                        readOnly
                        label="Solution"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Complete / next nav */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "rgba(243,239,228,0.08)" }}>
              {prevLesson ? (
                <Link
                  href={`/learn/${prevLesson.slug}`}
                  className="flex items-center gap-1.5 text-sm font-bold"
                  style={{ color: "#c9c3b3" }}
                >
                  <ChevronLeft size={16} /> {prevLesson.title}
                </Link>
              ) : <div />}

              <div className="flex items-center gap-2">
                {!completed && (
                  <button
                    onClick={markComplete}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                    style={{ background: "rgba(141,247,127,0.12)", color: "#8df77f" }}
                  >
                    <CheckCircle size={14} /> Mark Complete (+{lesson.xp} XP)
                  </button>
                )}
                {nextLesson && (
                  <Link
                    href={`/learn/${nextLesson.slug}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm"
                    style={{ background: "#8df77f", color: "#10120f" }}
                  >
                    {nextLesson.title} <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Tutor sidebar */}
        <div
          className="hidden lg:flex w-80 flex-col border-l overflow-y-auto py-4 px-4"
          style={{ borderColor: "rgba(243,239,228,0.08)", background: "#10120f" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={14} style={{ color: "#53d9e6" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#53d9e6" }}>
              Ask AI Tutor
            </span>
          </div>
          <AITutor
            lesson={lesson}
            userCode={playgroundCode}
            model={model}
            geminiKey={geminiKey}
            qwenKey={qwenKey}
          />
        </div>
      </div>
    </div>
  );
}
