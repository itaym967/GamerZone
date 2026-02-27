"use client";
import { Add01Icon, CrownIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import OptimizedAvatar from "@/app/components/OptimizedAvatar";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface PartyMemberSlotProps {
  isEmpty?: boolean;
  isLeader?: boolean;
  member?: {
    user_id: string;
    role: string;
    is_ready: boolean | null;
    profile: Profile | null;
  };
}

export default function PartyMemberSlot({
  member,
  isEmpty,
  isLeader,
}: PartyMemberSlotProps) {
  if (isEmpty) {
    return (
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/10 border-dashed bg-white/5 transition-colors group-hover:border-white/20">
        <HugeiconsIcon className="text-white/30" icon={Add01Icon} size={20} />
      </div>
    );
  }

  if (!member?.profile) {
    return null;
  }

  return (
    <div className="group/member relative h-12 w-12">
      <div className="h-full w-full overflow-hidden rounded-full border-2 border-white/20 transition-colors group-hover/member:border-blue-400">
        <OptimizedAvatar
          alt={member.profile.username || "Member"}
          seed={member.profile.avatar_url || member.profile.username || "?"}
          size={48}
        />
      </div>
      {isLeader && (
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-yellow-500 shadow-lg">
          <HugeiconsIcon
            className="text-black"
            fill="currentColor"
            icon={CrownIcon}
            size={12}
          />
        </div>
      )}
      {member.is_ready && !isLeader && (
        <div className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-[#0a0a0a] bg-green-500" />
      )}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover/member:opacity-100">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xs bg-black/90 px-2 py-1 text-fluid-xs text-white">
          {member.profile.username}
        </div>
      </div>
    </div>
  );
}
