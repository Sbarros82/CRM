import type { AiProvider } from "./settings";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface CompleteArgs {
  provider: AiProvider;
  model: string;
  apiKey: string;
  system: string;
  messages: ChatTurn[];
}

export async function completeChat(args: CompleteArgs): Promise<string> {
  if (args.provider === "anthropic") {
    return completeAnthropic(args);
  }
  return completeOpenAiCompatible(args);
}

async function completeOpenAiCompatible(args: CompleteArgs): Promise<string> {
  const url =
    args.provider === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
      ...(args.provider === "openrouter"
        ? { "HTTP-Referer": "https://snap.local", "X-Title": "Snap CRM" }
        : {}),
    },
    body: JSON.stringify({
      model: args.model,
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        { role: "system", content: args.system },
        ...args.messages,
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI provider ${res.status}: ${body.slice(0, 240)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AI provider returned an empty reply");
  return text;
}

async function completeAnthropic(args: CompleteArgs): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": args.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: 400,
      temperature: 0.4,
      system: args.system,
      messages: args.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 240)}`);
  }
  const json = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = json.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) throw new Error("Anthropic returned an empty reply");
  return text;
}
