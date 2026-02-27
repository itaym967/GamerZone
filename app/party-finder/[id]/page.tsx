"use client";

import {
  ArrowLeft01Icon,
  Cancel01Icon,
  CrownIcon,
  GameController02Icon,
  GlobeIcon,
  Logout01Icon,
  Mic01Icon,
  PlayIcon,
  Shield01Icon,
  UserGroupIcon,
  UserMinus01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Navigation from "@/app/components/Navigation";
import OptimizedAvatar from "@/app/components/OptimizedAvatar";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

type Party = Database["public"]["Tables"]["parties"]["Row"];
type PartyMember = Database["public"]["Tables"]["party_members"]["Row"] & {
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

export default function PartyDetailsPage() {
  const params = useParams();
  const partyId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isLeader = user?.id === party?.leader_id;
  const isMember = members.some((m) => m.user_id === user?.id);

  const fetchPartyDetails = async () => {
    setLoading(true);
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
      .eq("id", partyId)
      .single();

    if (error) {
      console.error("Error fetching party:", error);
      toast.error("שגיאה בטעינת הקבוצה");
      router.push("/party-finder");
      return;
    }

    setParty(data);
    setMembers(
      (data.party_members || []).map((pm: any) => ({
        ...pm,
        profile: pm.profile,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchPartyDetails();

    const channel = supabase
      .channel(`party_${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parties",
          filter: `id=eq.${partyId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            toast.info("הקבוצה נסגרה");
            router.push("/party-finder");
          } else if (payload.eventType === "UPDATE") {
            setParty(payload.new as Party);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "party_members",
          filter: `party_id=eq.${partyId}`,
        },
        () => {
          fetchPartyDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    partyId,
    fetchPartyDetails,
    router.push,
    supabase.channel,
    supabase.removeChannel,
  ]);

  const handleLeaveParty = async () => {
    if (!user) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/parties/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave party");
      }

      toast.success("עזבת את הקבוצה");
      router.push("/party-finder");
    } catch (error: any) {
      console.error("Error leaving party:", error);
      toast.error(error.message || "שגיאה ביציאה מהקבוצה");
    } finally {
      setActionLoading(false);
    }
  };

  const handleKickMember = async (userId: string) => {
    if (!isLeader) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/parties/kick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to kick member");
      }

      toast.success("החבר הוצא מהקבוצה");
    } catch (error: any) {
      console.error("Error kicking member:", error);
      toast.error(error.message || "שגיאה בהוצאת החבר");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseParty = async () => {
    if (!isLeader) {
      return;
    }

    if (!confirm("האם אתה בטוח שברצונך לסגור את הקבוצה?")) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/parties/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to close party");
      }

      toast.success("הקבוצה נסגרה");
      router.push("/party-finder");
    } catch (error: any) {
      console.error("Error closing party:", error);
      toast.error(error.message || "שגיאה בסגירת הקבוצה");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!isLeader) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("parties")
        .update({
          status: "in_game",
          game_started_at: new Date().toISOString(),
        })
        .eq("id", partyId);

      if (error) {
        throw error;
      }

      toast.success("המשחק התחיל!");
    } catch (error: any) {
      console.error("Error starting game:", error);
      toast.error("שגיאה בהתחלת המשחק");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 md:pr-64 md:pb-0">
        <Navigation />
        <div className="flex h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-blue-500 border-t-2 border-b-2" />
        </div>
      </div>
    );
  }

  if (!party) {
    return null;
  }

  const leaderMember = members.find((m) => m.role === "leader");
  const regularMembers = members.filter((m) => m.role !== "leader");

  return (
    <div className="min-h-screen pb-24 md:pr-64 md:pb-0">
      <Navigation />

      <div className="mx-auto max-w-3xl px-4 pt-6">
        <div className="mb-6 flex items-center gap-3">
          <Link
            className="-mr-2 rounded-full p-2 transition-colors hover:bg-white/10"
            href="/party-finder"
          >
            <HugeiconsIcon className="text-white" icon={ArrowLeft01Icon} />
          </Link>
          <h1 className="font-bold text-2xl text-white">פרטי קבוצה</h1>
        </div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="mb-2 font-bold text-2xl text-white">
                {party.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <HugeiconsIcon icon={UserGroupIcon} size={14} />
                <span>
                  {members.length}/{party.max_members} חברים
                </span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(party.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
            {party.skill_level_required && (
              <div className="flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/20 px-3 py-1.5 font-semibold text-purple-400 text-sm">
                <HugeiconsIcon icon={Shield01Icon} size={14} />
                {party.skill_level_required}
              </div>
            )}
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/20 px-3 py-1.5 font-semibold text-blue-400 text-sm">
              <HugeiconsIcon icon={GameController02Icon} size={14} />
              {party.game}
            </span>
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/20 px-3 py-1.5 font-medium text-cyan-400 text-sm">
              {party.mode}
            </span>
            {party.mic_required && (
              <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/20 px-3 py-1.5 font-medium text-red-400 text-sm">
                <HugeiconsIcon icon={Mic01Icon} size={14} />
                מיקרופון חובה
              </span>
            )}
            {party.region && (
              <span className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/20 px-3 py-1.5 font-medium text-green-400 text-sm">
                <HugeiconsIcon icon={GlobeIcon} size={14} />
                {party.region}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <HugeiconsIcon icon={UserGroupIcon} size={18} />
              חברי הקבוצה
            </h3>

            {leaderMember && (
              <div className="rounded-xl border border-yellow-500/20 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-yellow-500">
                        <OptimizedAvatar
                          alt={leaderMember.profile?.username || "Leader"}
                          seed={
                            leaderMember.profile?.avatar_url ||
                            leaderMember.profile?.username ||
                            "?"
                          }
                          size={48}
                        />
                      </div>
                      <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-yellow-500">
                        <HugeiconsIcon
                          className="text-black"
                          fill="currentColor"
                          icon={CrownIcon}
                          size={12}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {leaderMember.profile?.username}
                      </p>
                      <p className="font-medium text-xs text-yellow-400">
                        מנהיג הקבוצה
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {regularMembers.map((member) => (
              <div
                className="rounded-xl border border-white/10 bg-white/5 p-4"
                key={member.id}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/20">
                      <OptimizedAvatar
                        alt={member.profile?.username || "Member"}
                        seed={
                          member.profile?.avatar_url ||
                          member.profile?.username ||
                          "?"
                        }
                        size={48}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {member.profile?.username}
                      </p>
                      <p className="text-white/40 text-xs">חבר</p>
                    </div>
                  </div>
                  {isLeader && member.user_id !== user?.id && (
                    <button
                      className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      disabled={actionLoading}
                      onClick={() => handleKickMember(member.user_id)}
                    >
                      <HugeiconsIcon icon={UserMinus01Icon} size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {isLeader && (
            <>
              {party.status === "open" || party.status === "full" ? (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-green-600 to-emerald-500 py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  disabled={actionLoading}
                  onClick={handleStartGame}
                >
                  <HugeiconsIcon icon={PlayIcon} size={18} />
                  התחל משחק
                </button>
              ) : null}
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-3 font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                disabled={actionLoading}
                onClick={handleCloseParty}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
                סגור קבוצה
              </button>
            </>
          )}
          {isMember && !isLeader && (
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 font-semibold text-white transition-all hover:bg-white/20 disabled:opacity-50"
              disabled={actionLoading}
              onClick={handleLeaveParty}
            >
              <HugeiconsIcon icon={Logout01Icon} size={18} />
              עזוב קבוצה
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
