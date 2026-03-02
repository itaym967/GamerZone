import { NextResponse } from "next/server";

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

interface GamerBotRequest {
  message?: string;
}

function getLocalBotReply(message: string): string {
  const normalizedMessage = message.trim().toLowerCase();
  if (!normalizedMessage) {
    return "כתוב לי מה בא לך לשחק ואנסה לעזור.";
  }
  if (
    normalizedMessage.includes("fps") ||
    normalizedMessage.includes("shoot") ||
    normalizedMessage.includes("יריות")
  ) {
    return "טיפ ל-FPS: תתאמן 10 דקות על aim לפני ranked ותשמור על crosshair בגובה הראש.";
  }
  if (
    normalizedMessage.includes("party") ||
    normalizedMessage.includes("team") ||
    normalizedMessage.includes("קבוצה")
  ) {
    return "לחיפוש קבוצה טובה: תגדיר role ברור, שעות משחק קבועות, וסגנון תקשורת מראש.";
  }
  return "אני זמין לעזור עם טיפים, בניית קבוצה ושיפור ביצועים לפי המשחק שאתה משחק.";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(request: Request) {
  const body = (await request.json()) as GamerBotRequest;
  const message = body.message?.trim() ?? "";

  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      provider: "local",
      reply: getLocalBotReply(message),
    });
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL;
  const model = process.env.DEEPSEEK_MODEL ?? DEFAULT_DEEPSEEK_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are GamerBot, a concise gaming assistant for Hebrew speaking users. Keep answers practical, safe, and focused on gaming tips/team play.",
          },
          { role: "user", content: message },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("DeepSeek API error", response.status, errorBody);
      return NextResponse.json({
        provider: "local",
        reply: getLocalBotReply(message),
      });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json({
        provider: "local",
        reply: getLocalBotReply(message),
      });
    }

    return NextResponse.json({ provider: "deepseek", reply });
  } catch (error: unknown) {
    console.error("DeepSeek request failed", getErrorMessage(error));
    return NextResponse.json({
      provider: "local",
      reply: getLocalBotReply(message),
    });
  } finally {
    clearTimeout(timeout);
  }
}
