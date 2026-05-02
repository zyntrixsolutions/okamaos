'use client';

import { GoogleGenerativeAI, type GenerateContentStreamResult } from "@google/generative-ai";

export type GeminiModel =
  | "gemini-2.5-flash-lite-preview-06-17"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro";

export interface Message {
  role: "user" | "model";
  content: string;
}

function getClient(apiKey: string): GoogleGenerativeAI {
  return new GoogleGenerativeAI(apiKey);
}

export async function* streamGemini(
  apiKey: string,
  model: GeminiModel,
  systemPrompt: string,
  history: Message[],
  userMessage: string
): AsyncGenerator<string> {
  const genAI = getClient(apiKey);
  const genModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
  });

  const chat = genModel.startChat({
    history: history.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  });

  const result: GenerateContentStreamResult = await chat.sendMessageStream(userMessage);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

export async function generateGemini(
  apiKey: string,
  model: GeminiModel,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const genAI = getClient(apiKey);
  const genModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
  });

  const result = await genModel.generateContent(userMessage);
  return result.response.text();
}
