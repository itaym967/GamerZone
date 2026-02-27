"use client";
import {
  Add01Icon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import Navigation from "../components/Navigation";
import PartyCard from "./components/party-card";
import PartyFilters from "./components/party-filters";

type Party = Database["public"]["Tables"]["parties"]["Row"];
type PartyMember = Database["public"]["Tables"]["party_members"]["Row"] & {
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

type PartyWithMembers = Party & {
  members: PartyMember[];
};
type PartyWithJoinedMembers = Party & {
  party_members: PartyMember[] | null;
};
interface PartyRealtimePayload {
  game: string | null;
  id: string;
}

const mapPartyMembers = (partyMembers: PartyMember[] | null | undefined) => {
  return (partyMembers || []).map((partyMember) => ({
    ...partyMember,
    profile: partyMember.profile,
  }));
};

const mapParty = (party: PartyWithJoinedMembers): PartyWithMembers => {
  return {
    ...party,
    members: mapPartyMembers(party.party_members),
  };
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "שגיאה בהצטרפות לקבוצה";
};

const GAMES = [
  "Fortnite",
  "Call of Duty",
  "FIFA",
  "Valorant",
  "Minecraft",
  "Roblox",
  "Apex Legends",
  "Overwatch 2",
];

export default function PartyFinderPage() {
  const [parties, setParties] = useState<PartyWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const fetchParties = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("parties")
      .select(`
                *,
                party_members (
                    *,
                    profile:profiles (
                        id,
                        username,
                        avatar_url,
                        is_online,
                        is_banned
                    )
                )
            `)
      .gt("expires_at", new Date().toISOString())
      .in("status", ["open", "full"])
      .order("created_at", { ascending: false });

    if (selectedGame) {
      query = query.eq("game", selectedGame);
    }

    if (selectedSkillLevel) {
      query = query.eq("skill_level_required", selectedSkillLevel);
    }

    if (selectedStatus) {
      query = query.eq("status", selectedStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching parties:", error);
      toast.error("שגיאה בטעינת קבוצות");
    } else {
      setParties(
        (data || []).map((party) => mapParty(party as PartyWithJoinedMembers))
      );
    }
    setLoading(false);
  }, [selectedGame, selectedSkillLevel, selectedStatus, supabase]);

  useEffect(() => {
    fetchParties();

    if (!document.hidden) {
      const channel = supabase
        .channel("parties_realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "parties",
            filter: selectedGame ? `game=eq.${selectedGame}` : undefined,
          },
          async (payload) => {
            const newParty = payload.new as PartyRealtimePayload;
            if (!selectedGame || newParty.game === selectedGame) {
              const { data, error } = await supabase
                .from("parties")
                .select(`
                                    *,
                                    party_members (
                                        *,
                                        profile:profiles (
                                            id,
                                            username,
                                            avatar_url,
                                            is_online,
                                            is_banned
                                        )
                                    )
                                `)
                .eq("id", newParty.id)
                .single();

              if (data && !error) {
                setParties((prev) => [
                  mapParty(data as PartyWithJoinedMembers),
                  ...prev,
                ]);
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "parties",
          },
          (payload) => {
            const updatedParty = payload.new as Party;
            setParties((prev) =>
              prev.map((p) =>
                p.id === updatedParty.id ? { ...p, ...updatedParty } : p
              )
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "parties",
          },
          (payload) => {
            const deletedParty = payload.old as Party;
            setParties((prev) => prev.filter((p) => p.id !== deletedParty.id));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedGame, fetchParties, supabase]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        supabase.removeAllChannels();
      } else {
        fetchParties();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchParties, supabase]);

  const handleJoinParty = async (partyId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("/api/parties/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join party");
      }

      toast.success("הצטרפת לקבוצה בהצלחה!");
      fetchParties();
    } catch (error: unknown) {
      console.error("Error joining party:", error);
      toast.error(getErrorMessage(error));
    }
  };

  let content: React.ReactNode;
  if (loading) {
    content = (
      <div className="auto-grid animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div className="h-64 rounded-2xl bg-white/5" key={i} />
        ))}
      </div>
    );
  } else if (parties.length === 0) {
    content = (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <HugeiconsIcon
            className="text-white/40"
            icon={Search01Icon}
            size={32}
          />
        </div>
        <h3 className="font-semibold text-fluid-lg text-white">
          אין קבוצות פעילות
        </h3>
        <p className="mx-auto mt-1 max-w-xs text-fluid-sm text-white/40">
          היה הראשון ליצור קבוצה בקטגוריה זו!
        </p>
      </div>
    );
  } else {
    content = (
      <div className="auto-grid">
        {parties.map((party) => (
          <PartyCard
            currentUserId={user?.id || null}
            key={party.id}
            members={party.members}
            onJoin={handleJoinParty}
            party={party}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pr-64 md:pb-0">
      <Navigation />

      <div className="sticky top-0 z-20 border-white/5 border-b bg-[#0a0a0a]/80 py-fluid-md backdrop-blur-xl">
        <div className="max-w-6xl content-shell">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600">
                <HugeiconsIcon
                  className="text-white"
                  icon={UserGroupIcon}
                  size={20}
                />
              </div>
              <h1 className="font-bold text-fluid-xl text-white">
                מוצא קבוצות
              </h1>
            </div>
            <Link
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-fluid-sm text-white shadow-blue-600/20 shadow-lg transition-all hover:bg-blue-500 active:scale-95"
              href="/party-finder/create"
            >
              <HugeiconsIcon icon={Add01Icon} size={18} />
              <span className="hidden sm:inline">צור קבוצה</span>
              <span className="sm:hidden">צור</span>
            </Link>
          </div>

          <PartyFilters
            games={GAMES}
            onGameChange={setSelectedGame}
            onSkillLevelChange={setSelectedSkillLevel}
            onStatusChange={setSelectedStatus}
            selectedGame={selectedGame}
            selectedSkillLevel={selectedSkillLevel}
            selectedStatus={selectedStatus}
          />
        </div>
      </div>

      <div className="max-w-6xl pt-6 content-shell">{content}</div>
    </div>
  );
}
