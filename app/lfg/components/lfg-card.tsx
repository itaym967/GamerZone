"use client";

import {
  Clock01Icon,
  GameController02Icon,
  GlobeIcon,
  MessageCircle,
  Mic01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OptimizedAvatar from "@/app/components/OptimizedAvatar";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

type PostWithProfile = Database["public"]["Tables"]["lfg_posts"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

interface LFGCardProps {
  currentUserId: string | null;
  post: PostWithProfile;
}

export default function LFGCard({ post, currentUserId }: LFGCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleConnect = async () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    if (currentUserId === post.user_id) {
      return;
    }

    setLoading(true);
    try {
      const { error: fetchError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", currentUserId);

      if (fetchError) {
        throw fetchError;
      }

      // This is a naive check. A robust check would intersect the user's chats
      // with the target user's chats.
      // For MVP, we'll try to find a direct DM.
      // A better way is: Call an RPC or Edge Function to get_or_create_dm(target_id)
      // BUT, since we don't have that yet, let's just create a new chat or redirect if we can simple-find it.

      // Let's defer strict "Find existing" to a robust solution later if needed.
      // For now, let's just create a NEW chat for this interaction if we don't handle it elsewhere?
      // Actually, creating duplicate DMs is bad.
      // Redirect to chat with target parameter
      router.push(`/chat?target=${post.user_id}`);
    } catch (error) {
      console.error("Error connecting:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = currentUserId === post.user_id;

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-white/20">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="shrink-0">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10">
            <OptimizedAvatar
              alt={post.profiles?.username || "User"}
              seed={post.profiles?.avatar_url || post.profiles?.username || "?"}
              size={40}
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-white">
            {post.profiles?.username || "Unknown Gamer"}
          </h3>
          <div className="flex items-center gap-2 text-fluid-xs text-white/40">
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} size={10} />
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </span>
            {post.region && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={GlobeIcon} size={10} />
                  {post.region}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/20 px-2.5 py-1 font-semibold text-blue-400 text-fluid-sm">
            <HugeiconsIcon icon={GameController02Icon} size={14} />
            {post.game}
          </span>
          <span className="rounded-full border border-purple-500/20 bg-purple-500/20 px-2.5 py-1 font-medium text-fluid-sm text-purple-400">
            {post.mode}
          </span>
          {post.mic_required && (
            <span
              className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/20 px-2.5 py-1 font-medium text-fluid-sm text-red-400"
              title="Mic Required"
            >
              <HugeiconsIcon icon={Mic01Icon} size={14} />
              Mic
            </span>
          )}
        </div>
        <p className="text-fluid-sm text-white/80 leading-relaxed">
          {post.description}
        </p>
      </div>

      {/* Action */}
      {!isOwner && (
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 font-semibold text-white transition-all hover:bg-white/20 active:scale-[0.98] group-hover:bg-blue-600 group-hover:text-white"
          disabled={loading}
          onClick={handleConnect}
          type="button"
        >
          <HugeiconsIcon icon={MessageCircle} size={18} />
          {loading ? "מתחבר..." : "התחבר"}
        </button>
      )}
      {isOwner && (
        <div className="w-full py-2.5 text-center text-fluid-sm text-white/30 italic">
          המודעה שלך
        </div>
      )}
    </div>
  );
}
