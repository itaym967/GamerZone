import { NextRequest, NextResponse } from 'next/server';
import { analyzeToxicity } from '@/utils/deepseek';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { blockedWords } = await request.json();

    if (!Array.isArray(blockedWords)) {
      return NextResponse.json(
        { error: 'רשימת מילים לא תקינה' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'נדרשת התחברות' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'נדרשות הרשאות מנהל' },
        { status: 403 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY is not configured');
      return NextResponse.json(
        { error: 'שירות ניתוח הרעלנות אינו זמין כרגע' },
        { status: 503 }
      );
    }

    const result = await analyzeToxicity(blockedWords, apiKey);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Toxicity analysis error:', error);
    return NextResponse.json(
      { error: 'שגיאה בניתוח הרעלנות. נסה שוב מאוחר יותר.' },
      { status: 500 }
    );
  }
}
