import { NextResponse } from "next/server";

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
const TRAILING_SLASHES_REGEX = /\/+$/;
const GAMING_TOPIC_REGEX =
  /\b(game|gaming|gamer|games|fps|moba|mmorpg|rpg|battle\s?royale|rank|ranked|meta|patch|nerf|buff|loadout|crosshair|aim|kd|kill|clutch|team|party|squad|duo|trio|tournament|esports|stream|controller|keyboard|mouse|ping|lag|latency|steam|xbox|playstation|ps5|ps4|switch|nintendo|valorant|fortnite|apex|overwatch|cs2|counter\s?strike|league of legends|lol|dota|rocket league|minecraft|roblox|call of duty|cod|pubg|fifa|ea fc|elden ring|gta|wow|world of warcraft)\b/i;
const GAMING_TOPIC_HEBREW_REGEX =
  /(משחק|משחקים|גיימ|גיימר|גיימינג|קבוצה|טים|פארטי|סקווד|ראנק|תחרות|יריות|איים|כוונת|פינג|לאג|קונסולה|פלייסטיישן|אקסבוקס|נינטנדו|מיינקראפט|פורטנייט|ולוראנט|אוברוואץ׳|אוברוואץ|ליג אוף לג׳נדס|ליג אוף לגנדס|ליג|דוטה|רוקט ליג|קול אוף דיוטי|פיפא|פאבג׳י|רובלוקס|סטרים|סטרימר)/i;
const NON_GAMING_REPLY =
  "אני עונה רק על נושאי גיימינג. תשאל אותי על משחקים, טיפים, ראנק, דמויות, נשקים, קבוצות או ציוד לגיימינג.";

interface GamerBotRequest {
  message?: string;
}

const LOCAL_BOT_RULES = [
  {
    patterns: ["valorant", "ולוראנט", "ואלוראנט"],
    reply:
      "טיפ ל-Valorant: תתמקד ב-2 agents קבועים, תשמור crosshair בגובה הראש, ותשתמש ב-utility לפני peek ולא אחרי.",
  },
  {
    patterns: ["fortnite", "פורטנייט"],
    reply:
      "טיפ ל-Fortnite: תעבוד כל יום 10 דקות על build/edit מהיר, ותבחר landing spot קבוע כדי לשפר early game.",
  },
  {
    patterns: ["cs2", "counter strike", "counter-strike", "קאונטר", "קונטר"],
    reply:
      "טיפ ל-CS2: אל תרוץ עם ה-crosshair לרצפה, תשחק עם util בסיסי (smoke+flash), ותלמד 2 executes קבועים לכל מפה.",
  },
  {
    patterns: [
      "league of legends",
      "lol",
      "ליג",
      "ליג אוף לגנדס",
      "ליג אוף לג׳נדס",
    ],
    reply:
      "טיפ ל-LoL: תשחק 1-2 champs עיקריים, תתעדף farm יציב, ותשמור על vision לפני objective fights.",
  },
  {
    patterns: ["overwatch", "אוברוואץ", "אוברוואץ׳"],
    reply:
      "טיפ ל-Overwatch: תבנה קומפ מאוזן, תנהל cooldowns ביחד עם הקבוצה, ואל תבזבז אולטים בסולו fight.",
  },
  {
    patterns: ["apex", "אייפקס"],
    reply:
      "טיפ ל-Apex: תתקשר loot ו-rotations מוקדם, תילחם רק עם יתרון position, ותמיד תשאיר escape angle.",
  },
  {
    patterns: ["fifa", "ea fc", "פיפא"],
    reply:
      "טיפ ל-EA FC/FIFA: תגן בסבלנות עם jockey, תשתמש במסירות קצרות בשליש האמצעי, ואל תכריח sprint בכל התקפה.",
  },
  {
    patterns: ["cod", "call of duty", "קול אוף דיוטי"],
    reply:
      "טיפ ל-CoD: תעדיף positioning על gunfights מיותרים, תכוון ל-pre-aim corners, ותבנה loadout אחד יציב לכל מפה.",
  },
  {
    patterns: ["minecraft", "מיינקראפט"],
    reply:
      "טיפ ל-Minecraft: בתחילת עולם תתעדף food+iron+shield, תסמן base ברור, ותצא ל-mining עם מטרה ספציפית.",
  },
  {
    patterns: ["fps", "shoot", "יריות"],
    reply:
      "טיפ ל-FPS: תתאמן 10 דקות על aim לפני ranked, תשמור crosshair בגובה הראש, ותבדוק replay קצר אחרי כל session.",
  },
  {
    patterns: ["party", "team", "קבוצה", "טים", "פארטי"],
    reply:
      "לחיפוש קבוצה טובה: תגדיר role ברור, שעות משחק קבועות, וסגנון תקשורת מראש כדי למנוע חיכוכים.",
  },
] as const;

function getLocalBotReply(message: string): string {
  const normalizedMessage = message.trim().toLowerCase();
  if (!normalizedMessage) {
    return "כתוב לי מה בא לך לשחק ואנסה לעזור.";
  }

  for (const rule of LOCAL_BOT_RULES) {
    if (rule.patterns.some((pattern) => normalizedMessage.includes(pattern))) {
      return rule.reply;
    }
  }

  return "כתוב את שם המשחק (למשל Valorant / Fortnite / LoL / CS2) ואחזיר לך טיפים ממוקדים לשיפור.";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function isGamingRelatedMessage(message: string): boolean {
  return (
    GAMING_TOPIC_REGEX.test(message) || GAMING_TOPIC_HEBREW_REGEX.test(message)
  );
}

function buildDeepSeekEndpoints(baseUrl: string): string[] {
  const normalizedBaseUrl = baseUrl.replace(TRAILING_SLASHES_REGEX, "");
  const endpoints = [`${normalizedBaseUrl}/chat/completions`];

  if (!normalizedBaseUrl.endsWith("/v1")) {
    endpoints.push(`${normalizedBaseUrl}/v1/chat/completions`);
  }

  return endpoints;
}

export async function POST(request: Request) {
  const body = (await request.json()) as GamerBotRequest;
  const message = body.message?.trim() ?? "";

  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }
  if (!isGamingRelatedMessage(message)) {
    return NextResponse.json({ provider: "policy", reply: NON_GAMING_REPLY });
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
  const timeout = setTimeout(() => controller.abort(), 5000);
  const endpoints = buildDeepSeekEndpoints(baseUrl);

  try {
    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, {
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
                "You are GamerBot for Hebrew-speaking users. You must only answer gaming-related questions (games, teams, strategy, setup, esports, and gaming hardware). If the user asks about non-gaming topics, refuse briefly and ask for a gaming-related question. Keep answers concise and practical.",
            },
            { role: "user", content: message },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          "DeepSeek API error",
          response.status,
          endpoint,
          errorBody
        );
        continue;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const reply = data.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        console.error("DeepSeek response missing reply", endpoint);
        continue;
      }

      return NextResponse.json({ provider: "deepseek", reply });
    }

    return NextResponse.json({
      provider: "local",
      reply: getLocalBotReply(message),
    });
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
