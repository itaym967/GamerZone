import { NextRequest, NextResponse } from 'next/server';
import { chatWithGamerBot } from '@/utils/deepseek';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'הודעה לא תקינה' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY is not configured');
      return NextResponse.json(
        { error: 'שירות הבוט אינו זמין כרגע' },
        { status: 503 }
      );
    }

    const response = await chatWithGamerBot(message, apiKey);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('GamerBot chat error:', error);
    return NextResponse.json(
      { error: 'שגיאה בתקשורת עם הבוט. נסה שוב מאוחר יותר.' },
      { status: 500 }
    );
  }
}
