"use client";
import {
  Add01Icon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import Navigation from "../components/Navigation";
import PartyCard from "./components/PartyCard";
import PartyFilters from "./components/PartyFilters";

type Party = Database["public"]["Tables"]["parties"]["Row"];
type PartyMember = Database["public"]["Tables"]["party_members"]["Row"] & {
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

type PartyWithMembers = Party & {
  members: PartyMember[];
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

  const fetchParties = async () => {
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
      const partiesWithMembers = (data || []).map((party) => ({
        ...party,
        members: (party.party_members || []).map((pm: any) => ({
          ...pm,
          profile: pm.profile,
        })),
      }));
      setParties(partiesWithMembers as PartyWithMembers[]);
    }
    setLoading(false);
  };

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
            if (!selectedGame || (payload.new as any).game === selectedGame) {
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
                .eq("id", (payload.new as any).id)
                .single();

              if (data && !error) {
                const partyWithMembers = {
                  ...data,
                  members: (data.party_members || []).map((pm: any) => ({
                    ...pm,
                    profile: pm.profile,
                  })),
                };
                setParties((prev) => [
                  partyWithMembers as PartyWithMembers,
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
            setParties((prev) =>
              prev.map((p) =>
                p.id === (payload.new as any).id
                  ? { ...p, ...(payload.new as Party) }
                  : p
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
            setParties((prev) =>
              prev.filter((p) => p.id !== (payload.old as any).id)
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [
    selectedGame,
    fetchParties,
    supabase.from,
    supabase.channel,
    supabase.removeChannel,
  ]);

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
  }, [fetchParties, supabase.removeAllChannels]);

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
    } catch (error: any) {
      console.error("Error joining party:", error);
      toast.error(error.message || "שגיאה בהצטרפות לקבוצה");
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pr-64 md:pb-0">
      <Navigation />

      <div className="sticky top-0 z-20 border-white/5 border-b bg-[#0a0a0a]/80 px-4 pt-4 pb-4 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600">
                <HugeiconsIcon
                  className="text-white"
                  icon={UserGroupIcon}
                  size={20}
                />
              </div>
              <h1 className="font-bold text-2xl text-white">מוצא קבוצות</h1>
            </div>
            <Link href="/party-finder/create">
              <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-sm text-white shadow-blue-600/20 shadow-lg transition-all hover:bg-blue-500 active:scale-95">
                <HugeiconsIcon icon={Add01Icon} size={18} />
                <span className="hidden sm:inline">צור קבוצה</span>
                <span className="sm:hidden">צור</span>
              </button>
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

      <div className="mx-auto max-w-6xl px-4 pt-6">
        {loading ? (
          <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className="h-64 rounded-2xl bg-white/5" key={i} />
            ))}
          </div>
        ) : parties.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <HugeiconsIcon
                className="text-white/40"
                icon={Search01Icon}
                size={32}
              />
            </div>
            <h3 className="font-semibold text-lg text-white">
              אין קבוצות פעילות
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-white/40">
              היה הראשון ליצור קבוצה בקטגוריה זו!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        )}
      </div>
    </div>
  );
}
