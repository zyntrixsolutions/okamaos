'use client';

export type QwenModel = "qwen-max" | "qwen-plus" | "qwen-turbo";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const DASHSCOPE_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1";

export async function* streamQwen(
  apiKey: string,
  model: QwenModel,
  systemPrompt: string,
  history: Array<{ role: "user" | "model"; content: string }>,
  userMessage: string
): AsyncGenerator<string> {
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: (m.role === "model" ? "assistant" : "user") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch(`${DASHSCOPE_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      stream_options: { include_usage: false },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Qwen API error ${response.status}: ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // skip malformed chunks
      }
    }
  }
}

export async function generateQwen(
  apiKey: string,
  model: QwenModel,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await fetch(`${DASHSCOPE_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Qwen API error ${response.status}: ${err}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? "";
}
