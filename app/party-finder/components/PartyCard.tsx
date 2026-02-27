"use client";

import {
  GameController02Icon,
  GlobeIcon,
  Mic01Icon,
  Shield01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/utils/supabase/types";
import PartyMemberSlot from "./PartyMemberSlot";

type Party = Database["public"]["Tables"]["parties"]["Row"];
type PartyMember = Database["public"]["Tables"]["party_members"]["Row"] & {
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

interface PartyCardProps {
  currentUserId: string | null;
  members: PartyMember[];
  onJoin?: (partyId: string) => Promise<void>;
  party: Party;
}

export default function PartyCard({
  party,
  members,
  currentUserId,
  onJoin,
}: PartyCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isLeader = currentUserId === party.leader_id;
  const isMember = members.some((m) => m.user_id === currentUserId);
  const isFull = party.status === "full" || members.length >= party.max_members;
  const emptySlots = Math.max(0, party.max_members - members.length);

  const handleJoinClick = async () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    if (isFull || isMember) {
      return;
    }

    setLoading(true);
    try {
      if (onJoin) {
        await onJoin(party.id);
      }
    } catch (error) {
      console.error("Error joining party:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/party-finder/${party.id}`);
  };

  const leaderMember = members.find((m) => m.role === "leader");
  const regularMembers = members.filter((m) => m.role !== "leader");

  return (
    <div
      className="group cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-white/20"
      onClick={handleCardClick}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate font-bold text-lg text-white">
            {party.title}
          </h3>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={UserGroupIcon} size={12} />
              {members.length}/{party.max_members}
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
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-purple-500/20 bg-purple-500/20 px-2.5 py-1 font-semibold text-purple-400 text-xs">
            <HugeiconsIcon icon={Shield01Icon} size={12} />
            {party.skill_level_required}
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/20 px-2.5 py-1 font-semibold text-blue-400 text-sm">
          <HugeiconsIcon icon={GameController02Icon} size={14} />
          {party.game}
        </span>
        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/20 px-2.5 py-1 font-medium text-cyan-400 text-sm">
          {party.mode}
        </span>
        {party.mic_required && (
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/20 px-2.5 py-1 font-medium text-red-400 text-sm">
            <HugeiconsIcon icon={Mic01Icon} size={14} />
            מיקרופון
          </span>
        )}
        {party.region && (
          <span className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/20 px-2.5 py-1 font-medium text-green-400 text-sm">
            <HugeiconsIcon icon={GlobeIcon} size={14} />
            {party.region}
          </span>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2">
        {leaderMember && (
          <PartyMemberSlot
            isLeader={true}
            member={{
              user_id: leaderMember.user_id,
              role: leaderMember.role,
              is_ready: leaderMember.is_ready,
              profile: leaderMember.profile,
            }}
          />
        )}
        {regularMembers.map((member) => (
          <PartyMemberSlot
            key={member.id}
            member={{
              user_id: member.user_id,
              role: member.role,
              is_ready: member.is_ready,
              profile: member.profile,
            }}
          />
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <PartyMemberSlot isEmpty key={`empty-${i}`} />
        ))}
      </div>

      {!(isMember || isLeader) && (
        <button
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-semibold transition-all ${
            isFull
              ? "cursor-not-allowed bg-white/5 text-white/30"
              : "bg-white/10 text-white hover:bg-blue-600 active:scale-[0.98]"
          }`}
          disabled={loading || isFull}
          onClick={(e) => {
            e.stopPropagation();
            handleJoinClick();
          }}
        >
          {loading ? "מצטרף..." : isFull ? "קבוצה מלאה" : "הצטרף לקבוצה"}
        </button>
      )}
      {(isMember || isLeader) && (
        <div className="w-full py-2.5 text-center font-semibold text-blue-400 text-sm">
          {isLeader ? "הקבוצה שלך" : "חבר בקבוצה"}
        </div>
      )}
    </div>
  );
}
