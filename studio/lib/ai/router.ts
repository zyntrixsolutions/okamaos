'use client';

import { streamGemini, generateGemini, type GeminiModel } from "./gemini";
import { streamQwen, generateQwen, type QwenModel } from "./qwen";
import { GAME_ENGINE_SYSTEM_PROMPT, TUTOR_SYSTEM_PROMPT } from "./prompts";

export type ModelId =
  | "gemini-3.1-flash-lite-preview"
  | "gemini-3-flash-preview"
  | "gemini-2.5-flash"
  | "gemini-2.5-pro"
  | "gemini-3.1-pro-preview"
  | "qwen-max"
  | "qwen-plus"
  | "qwen-turbo";

export type PromptMode = "game" | "tutor" | "asset";

export interface AIConfig {
  model: ModelId;
  geminiKey: string;
  qwenKey: string;
}

export interface HistoryMessage {
  role: "user" | "model";
  content: string;
}

function getSystemPrompt(mode: PromptMode): string {
  if (mode === "tutor") return TUTOR_SYSTEM_PROMPT;
  return GAME_ENGINE_SYSTEM_PROMPT;
}

function isGemini(model: ModelId): model is GeminiModel {
  return model.startsWith("gemini-");
}

export async function* streamAI(
  config: AIConfig,
  mode: PromptMode,
  history: HistoryMessage[],
  userMessage: string,
  systemPromptOverride?: string
): AsyncGenerator<string> {
  const systemPrompt = systemPromptOverride ?? getSystemPrompt(mode);

  if (isGemini(config.model)) {
    if (!config.geminiKey) throw new Error("Gemini API key not set. Add it in Settings.");
    yield* streamGemini(config.geminiKey, config.model as GeminiModel, systemPrompt, history, userMessage);
  } else {
    if (!config.qwenKey) throw new Error("Qwen API key not set. Add it in Settings.");
    yield* streamQwen(config.qwenKey, config.model as QwenModel, systemPrompt, history, userMessage);
  }
}

export async function generateAI(
  config: AIConfig,
  mode: PromptMode,
  userMessage: string
): Promise<string> {
  const systemPrompt = getSystemPrompt(mode);

  if (isGemini(config.model)) {
    if (!config.geminiKey) throw new Error("Gemini API key not set. Add it in Settings.");
    return generateGemini(config.geminiKey, config.model as GeminiModel, systemPrompt, userMessage);
  } else {
    if (!config.qwenKey) throw new Error("Qwen API key not set. Add it in Settings.");
    return generateQwen(config.qwenKey, config.model as QwenModel, systemPrompt, userMessage);
  }
}

export const MODEL_OPTIONS: Array<{ id: ModelId; label: string; provider: "gemini" | "qwen"; badge?: string; note?: string; tier: "free" | "paid" }> = [
  // --- Free tier ---
  { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite", provider: "gemini", badge: "Free", note: "15 RPM · 250 TPM · 500 RPD", tier: "free" },
  { id: "gemini-3-flash-preview",        label: "Gemini 3.0 Flash",       provider: "gemini", badge: "Free", note: "5 RPM · 250 TPM · 20 RPD",  tier: "free" },
  { id: "gemini-2.5-flash",              label: "Gemini 2.5 Flash",       provider: "gemini", badge: "Free", note: "5 RPM · 250 TPM · 500 RPD", tier: "free" },
  // --- Paid tier ---
  { id: "gemini-2.5-pro",                label: "Gemini 2.5 Pro",         provider: "gemini", badge: "Pro",  note: "Requires billing",         tier: "paid" },
  { id: "gemini-3.1-pro-preview",        label: "Gemini 3.1 Pro",         provider: "gemini", badge: "Pro",  note: "Requires billing",         tier: "paid" },
  // --- Qwen ---
  { id: "qwen-max",                      label: "Qwen Max",               provider: "qwen",   badge: "Smart", note: "",                       tier: "paid" },
  { id: "qwen-plus",                     label: "Qwen Plus",              provider: "qwen",   note: "",                                        tier: "paid" },
  { id: "qwen-turbo",                    label: "Qwen Turbo",             provider: "qwen",   badge: "Fast",  note: "",                       tier: "paid" },
];
