import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

let _adminClient: SupabaseClient | null = null;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;

function getRequiredEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"
) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
    );
  }
  return _adminClient;
}

/**
 * GET /api/parental-consent?token=xxx
 * Verify and grant parental consent via email link
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "טוקן חסר" }, { status: 400 });
  }

  try {
    // Find the parental control record by token
    const { data: control, error: fetchError } = await getSupabaseAdmin()
      .from("parental_controls")
      .select("*")
      .eq("consent_token", token)
      .single();

    if (fetchError || !control) {
      return NextResponse.json(
        { error: "טוקן לא תקין או שפג תוקפו" },
        { status: 404 }
      );
    }

    if (control.consent_granted) {
      // Already granted - redirect to success page
      return NextResponse.redirect(
        new URL("/parental-consent/success?already=true", request.url)
      );
    }

    // Grant consent
    const now = new Date().toISOString();
    const { error: updateError } = await getSupabaseAdmin()
      .from("parental_controls")
      .update({
        consent_granted: true,
        consent_granted_at: now,
        updated_at: now,
      })
      .eq("id", control.id);

    if (updateError) {
      console.error("Error granting consent:", updateError);
      return NextResponse.json(
        { error: "שגיאה באישור ההסכמה" },
        { status: 500 }
      );
    }

    // Update the child's profile
    await getSupabaseAdmin()
      .from("profiles")
      .update({
        parental_consent: true,
        parental_consent_at: now,
        updated_at: now,
      })
      .eq("id", control.child_id);

    // Log the activity
    await getSupabaseAdmin()
      .from("minor_activity_log")
      .insert({
        user_id: control.child_id,
        activity_type: "login",
        details: {
          action: "parental_consent_granted",
          parent_email: control.parent_email,
        },
      });

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/parental-consent/success", request.url)
    );
  } catch (error) {
    console.error("Parental consent error:", error);
    return NextResponse.json({ error: "שגיאה פנימית" }, { status: 500 });
  }
}

/**
 * POST /api/parental-consent
 * Request parental consent (called during signup for minors under 13)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId, parentEmail } = body;

    if (!(childId && parentEmail)) {
      return NextResponse.json(
        { error: "נדרש מזהה ילד ואימייל הורה" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(parentEmail)) {
      return NextResponse.json(
        { error: "כתובת אימייל לא תקינה" },
        { status: 400 }
      );
    }

    // Generate consent token
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let consentToken = "";
    for (let i = 0; i < 32; i++) {
      consentToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create or update parental control record
    const { error: upsertError } = await getSupabaseAdmin()
      .from("parental_controls")
      .upsert(
        {
          parent_email: parentEmail,
          child_id: childId,
          consent_token: consentToken,
          consent_granted: false,
          activity_log_enabled: true,
          allowed_contacts_only: true,
          max_daily_chat_minutes: 60,
          chat_enabled: true,
          explore_enabled: true,
          lfg_enabled: false,
          party_finder_enabled: false,
        },
        { onConflict: "parent_email,child_id" }
      );

    if (upsertError) {
      console.error("Error creating parental control:", upsertError);
      return NextResponse.json(
        { error: "שגיאה ביצירת בקשת הסכמה" },
        { status: 500 }
      );
    }

    // Update child profile with parental email
    await getSupabaseAdmin()
      .from("profiles")
      .update({
        parental_email: parentEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", childId);

    // Build consent URL
    const consentUrl = `${request.nextUrl.origin}/api/parental-consent?token=${consentToken}`;

    // In production, send email via a service. For now, log the URL.
    console.log(
      `[Parental Consent] Send email to ${parentEmail} with link: ${consentUrl}`
    );

    return NextResponse.json({
      success: true,
      message: "בקשת הסכמת הורים נשלחה",
      consentUrl, // Remove in production - only for dev/testing
    });
  } catch (error) {
    console.error("Parental consent POST error:", error);
    return NextResponse.json({ error: "שגיאה פנימית" }, { status: 500 });
  }
}
