import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { partyId } = await request.json();

    if (!partyId) {
      return NextResponse.json(
        { error: "Party ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: party, error: partyError } = await supabase
      .from("parties")
      .select("*, party_members(*)")
      .eq("id", partyId)
      .single();

    if (partyError || !party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    if (party.status === "full") {
      return NextResponse.json({ error: "Party is full" }, { status: 400 });
    }

    if (party.status === "closed" || party.status === "in_game") {
      return NextResponse.json(
        { error: "Party is not accepting members" },
        { status: 400 }
      );
    }

    const memberCount = party.party_members?.length || 0;
    if (memberCount >= party.max_members) {
      return NextResponse.json({ error: "Party is full" }, { status: 400 });
    }

    const isAlreadyMember = party.party_members?.some(
      (m: any) => m.user_id === user.id
    );
    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "Already a member of this party" },
        { status: 400 }
      );
    }

    const { data: existingMembership } = await supabase
      .from("party_members")
      .select("party_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already in another party" },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase.from("party_members").insert({
      party_id: partyId,
      user_id: user.id,
      role: "member",
    });

    if (insertError) {
      console.error("Error joining party:", insertError);
      return NextResponse.json(
        { error: "Failed to join party" },
        { status: 500 }
      );
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: party.leader_id,
        title: "חבר חדש הצטרף לקבוצה",
        message: "שחקן הצטרף לקבוצה שלך",
        type: "party_join",
        action_url: "/party-finder",
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in join party route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
