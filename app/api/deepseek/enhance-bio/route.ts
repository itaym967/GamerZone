import { type NextRequest, NextResponse } from "next/server";
import { enhanceBio } from "@/utils/deepseek";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { bio, userId } = await request.json();

    if (!bio || typeof bio !== "string") {
      return NextResponse.json({ error: "ביו לא תקין" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY is not configured");
      return NextResponse.json(
        { error: "שירות שיפור הביו אינו זמין כרגע" },
        { status: 503 }
      );
    }

    const enhancedBio = await enhanceBio(bio, apiKey);

    return NextResponse.json({ enhancedBio });
  } catch (error: any) {
    console.error("Bio enhancement error:", error);
    return NextResponse.json(
      { error: "שגיאה בשיפור הביו. נסה שוב מאוחר יותר." },
      { status: 500 }
    );
  }
}
