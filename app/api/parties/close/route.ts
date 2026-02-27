import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PartyMember {
  user_id: string;
}

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

    if (party.leader_id !== user.id) {
      return NextResponse.json(
        { error: "Only the party leader can close the party" },
        { status: 403 }
      );
    }

    const members = (party.party_members || []) as PartyMember[];
    const memberIds = members
      .filter((member) => member.user_id !== user.id)
      .map((member) => member.user_id);

    if (memberIds.length > 0) {
      const notifications = memberIds.map((memberId: string) => ({
        user_id: memberId,
        title: "הקבוצה נסגרה",
        message: "מנהיג הקבוצה סגר את הקבוצה",
        type: "party_closed",
        action_url: "/party-finder",
      }));

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) {
        console.error("Error creating notifications:", notificationError);
      }
    }

    const { error: deleteError } = await supabase
      .from("parties")
      .delete()
      .eq("id", partyId);

    if (deleteError) {
      console.error("Error closing party:", deleteError);
      return NextResponse.json(
        { error: "Failed to close party" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in close party route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
