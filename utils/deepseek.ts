interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  apiKey: string,
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<string> {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data: DeepSeekResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from DeepSeek API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API call failed:', error);
    throw error;
  }
}

export async function chatWithGamerBot(userMessage: string, apiKey: string): Promise<string> {
  const systemPrompt = `אתה GamerBot, בוט חכם ומועיל שעוזר לגיימרים בפלטפורמת GamerZone.
אתה מומחה במשחקי וידאו, אסטרטגיות, טיפים וכל מה שקשור לגיימינג.
תמיד תענה בעברית תקינה וברורה.
תהיה ידידותי, מועיל ומעודד.
אם נשאלת שאלה שלא קשורה לגיימינג, תנסה להפנות את השיחה בחזרה לעולם המשחקים.
השתמש באמוג'י מדי פעם כדי להפוך את התשובות לידידותיות יותר 🎮`;

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  return await callDeepSeek(messages, apiKey, 0.8, 500);
}

export async function enhanceBio(currentBio: string, apiKey: string): Promise<string> {
  const systemPrompt = `אתה עוזר מקצועי שמשפר תיאורים של שחקנים בפלטפורמת גיימינג.
המשימה שלך היא לקחת ביו קיים ולהפוך אותו למעניין, מושך ומקצועי יותר.
שמור על המידע המקורי אבל הוסף סגנון, אנרגיה ואישיות.
התשובה צריכה להיות בעברית תקינה, קצרה (עד 3 משפטים) ומושכת.
אל תוסיף מידע שלא היה בביו המקורי.
השתמש בשפה של גיימרים אבל שמור על מקצועיות.`;

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `שפר את הביו הבא:\n\n${currentBio}` },
  ];

  return await callDeepSeek(messages, apiKey, 0.7, 300);
}

export async function analyzeToxicity(
  blockedWords: string[],
  apiKey: string
): Promise<{ analysis: string; suggestions: string[] }> {
  const systemPrompt = `אתה מומחה במודרציה של קהילות גיימינג ובניתוח תוכן רעיל.
המשימה שלך היא לנתח רשימת מילים חסומות ולספק:
1. הסבר מפורט למה כל מילה בעייתית ואיך היא פוגעת בקהילה
2. הצעות למילים נוספות שכדאי לחסום (מילים דומות, וריאציות, סלנג)

התשובה צריכה להיות בעברית תקינה ומקצועית.
התמקד בשמירה על סביבה בטוחה וידידותית לכל הגיימרים.`;

  const userMessage = `נתח את רשימת המילים החסומות הבאה ותן המלצות:

מילים חסומות כרגע:
${blockedWords.join(', ')}

ספק:
1. ניתוח קצר של הרשימה הנוכחית
2. רשימה של 5-10 מילים נוספות שכדאי לחסום (כולל וריאציות וסלנג)`;

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const response = await callDeepSeek(messages, apiKey, 0.6, 800);

  const lines = response.split('\n').filter(line => line.trim());
  const suggestions: string[] = [];
  
  lines.forEach(line => {
    const match = line.match(/[-•*]\s*(.+?)(?:\s*[-–]\s*.+)?$/);
    if (match) {
      const word = match[1].trim().toLowerCase();
      if (word && word.length > 1 && !blockedWords.includes(word)) {
        suggestions.push(word);
      }
    }
  });

  return {
    analysis: response,
    suggestions: suggestions.slice(0, 10),
  };
}
