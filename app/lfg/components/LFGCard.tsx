"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock, Gamepad2, Globe, MessageCircle, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OptimizedAvatar from "@/app/components/OptimizedAvatar";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/utils/supabase/types";

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
      // 1. Check if chat exists
      const { data: existingChats, error: fetchError } = await supabase
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
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </span>
            {post.region && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe size={10} />
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
          <span className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/20 px-2.5 py-1 font-semibold text-blue-400 text-sm">
            <Gamepad2 size={14} />
            {post.game}
          </span>
          <span className="rounded-full border border-purple-500/20 bg-purple-500/20 px-2.5 py-1 font-medium text-purple-400 text-sm">
            {post.mode}
          </span>
          {post.mic_required && (
            <span
              className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/20 px-2.5 py-1 font-medium text-red-400 text-sm"
              title="Mic Required"
            >
              <Mic size={14} />
              Mic
            </span>
          )}
        </div>
        <p className="text-sm text-white/80 leading-relaxed">
          {post.description}
        </p>
      </div>

      {/* Action */}
      {!isOwner && (
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 font-semibold text-white transition-all hover:bg-white/20 active:scale-[0.98] group-hover:bg-blue-600 group-hover:text-white"
          disabled={loading}
          onClick={handleConnect}
        >
          <MessageCircle size={18} />
          {loading ? "מתחבר..." : "התחבר"}
        </button>
      )}
      {isOwner && (
        <div className="w-full py-2.5 text-center text-sm text-white/30 italic">
          המודעה שלך
        </div>
      )}
    </div>
  );
}
