import { createClient as createServerClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: actor },
      error: actorError,
    } = await supabase.auth.getUser();

    if (actorError || !actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: actorProfile, error: actorProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", actor.id)
      .single();

    if (actorProfileError || actorProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await request.json();

    if (typeof userId !== "string" || userId.length === 0) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!(supabaseUrl && supabaseServiceKey)) {
      console.error("Missing Supabase service role credentials");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Sign out user from all sessions using Admin API
    const { error } = await supabaseAdmin.auth.admin.signOut(userId);

    if (error) {
      console.error("Error revoking session:", error);
      return NextResponse.json(
        { error: "Failed to revoke session", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User session revoked",
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("Unexpected error in revoke-session:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details,
      },
      { status: 500 }
    );
  }
}
