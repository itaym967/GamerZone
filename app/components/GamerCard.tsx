"use client";

import {
  Add01Icon,
  Cancel01Icon,
  Clock01Icon,
  Copy01Icon,
  Loading02Icon,
  Message01Icon,
  Shield01Icon,
  SparklesIcon,
  Tick01Icon,
  UserAdd01Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { haptic } from "@/utils/haptics";
import OptimizedAvatar from "./OptimizedAvatar";

interface GamerCardProps {
  avatarSeed?: string; // Optional override for avatar generation
  bio: string;
  currentUserId: string | null;
  // Friend system props
  friendshipStatus?: "none" | "pending_sent" | "pending_received" | "accepted";
  games: string[];
  hiddenTags?: { [key: string]: string }; // Map of game -> real gamertag
  id: string;
  // OPTIMIZATION: Accept swap status from parent to avoid per-card subscriptions
  initialSwapStatus?:
    | "initial"
    | "pending_sent"
    | "pending_received"
    | "approved"
    | "rejected";
  online?: boolean;
  onSendFriendRequest?: (targetId: string) => void;
  onSwapStatusChange?: (
    userId: string,
    status:
      | "initial"
      | "pending_sent"
      | "pending_received"
      | "approved"
      | "rejected"
  ) => void;
  tag: string; // e.g. @cyber_ninja
  username: string;
}

function determineStatus(data: any, userId: string) {
  if (data.status === "approved") {
    return "approved";
  }
  if (data.status === "rejected") {
    return "rejected";
  }
  if (data.status === "pending") {
    return data.sender_id === userId ? "pending_sent" : "pending_received";
  }
  return "initial";
}

export default function GamerCard({
  username,
  tag,
  games,
  bio,
  online,
  hiddenTags,
  avatarSeed,
  id,
  currentUserId,
  initialSwapStatus,
  onSwapStatusChange,
  friendshipStatus = "none",
  onSendFriendRequest,
}: GamerCardProps) {
  const [status, setStatus] = useState<
    "initial" | "pending_sent" | "pending_received" | "approved" | "rejected"
  >(initialSwapStatus || "initial");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [xp, setXp] = useState(Math.floor(Math.random() * 500) + 100);
  const [showXpGain, setShowXpGain] = useState(false);
  // State for revealed tags
  const [revealedTags, setRevealedTags] = useState<{
    [key: string]: string;
  } | null>(null);
  // Bio enhancer state
  const [isEnhancingBio, _setIsEnhancingBio] = useState(false);
  const [showBioEnhancer, setShowBioEnhancer] = useState(false);

  // OPTIMIZATION: Update local status when parent provides new status
  useEffect(() => {
    if (initialSwapStatus) {
      setStatus(initialSwapStatus);
    }
  }, [initialSwapStatus]);

  const level = Math.floor(xp / 100);
  const progress = xp % 100;
  const currentSeed = avatarSeed || username;

  const supabase = createClient();

  const fetchRealTags = useCallback(async () => {
    if (!id) {
      return;
    }
    const { data } = await supabase
      .from("gamertags")
      .select("platform, tag")
      .eq("user_id", id);

    if (data) {
      const realTags: { [key: string]: string } = {};
      data.forEach((t: any) => {
        realTags[t.platform] = t.tag;
      });
      setRevealedTags(realTags);
    }
  }, [id, supabase]);

  // OPTIMIZATION: Only fetch initial status, no per-card realtime subscription
  // Parent components should manage realtime subscriptions for all cards
  useEffect(() => {
    if (!(currentUserId && id) || initialSwapStatus) {
      return;
    }

    // Validate that currentUserId is a valid UUID (not 'preview' or other invalid values)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!(uuidRegex.test(currentUserId) && uuidRegex.test(id))) {
      return;
    }

    // Only fetch if parent didn't provide initial status
    const checkStatus = async () => {
      const { data } = await supabase
        .from("swap_requests")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (data) {
        const newStatus = determineStatus(data, currentUserId);
        setStatus(newStatus);
        if (newStatus === "approved") {
          fetchRealTags();
        }
      }
    };

    checkStatus();
  }, [currentUserId, id, initialSwapStatus, fetchRealTags, supabase]);

  const handleSendRequest = async () => {
    if (!currentUserId) {
      toast.error("עליך להתחבר כדי לשלוח בקשה!");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("swap_requests").insert({
        sender_id: currentUserId,
        receiver_id: id,
        status: "pending", // Default, but being explicit
      });

      if (error) {
        throw error;
      }

      setStatus("pending_sent");
      haptic("success");
      // Notify parent of status change
      if (onSwapStatusChange) {
        onSwapStatusChange(id, "pending_sent");
      }
      toast.success("בקשה נשלחה!", {
        description: "תקבל התראה כשהמשתמש יאשר.",
      });
    } catch (error: any) {
      console.error(error);
      toast.error("שגיאה בשליחת הבקשה", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveResponse = async (approved: boolean) => {
    if (!currentUserId) {
      toast.error("אנא התחבר כדי להגיב לבקשה");
      return;
    }
    setIsLoading(true);
    try {
      const newStatus = approved ? "approved" : "rejected";

      // Find requests where *I* am the receiver and *THEY* are the sender
      const { error } = await supabase
        .from("swap_requests")
        .update({ status: newStatus })
        .eq("sender_id", id)
        .eq("receiver_id", currentUserId);

      if (error) {
        throw error;
      }

      setStatus(newStatus as any);
      // Notify parent of status change
      if (onSwapStatusChange) {
        onSwapStatusChange(id, newStatus as any);
      }

      haptic(approved ? "success" : "medium");

      if (approved) {
        // Auto-create friendship when swap is approved
        const { error: friendError } = await supabase
          .from("friendships")
          .upsert(
            {
              sender_id: id,
              receiver_id: currentUserId,
              status: "accepted",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "sender_id,receiver_id", ignoreDuplicates: true }
          );
        if (friendError) {
          // Fallback: try insert if upsert fails (no unique constraint on pair)
          const { data: existing } = await supabase
            .from("friendships")
            .select("id")
            .or(
              `and(sender_id.eq.${id},receiver_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},receiver_id.eq.${id})`
            )
            .maybeSingle();
          if (!existing) {
            await supabase.from("friendships").insert({
              sender_id: id,
              receiver_id: currentUserId,
              status: "accepted",
            });
          }
        }

        setXp((prev) => prev + 50);
        setShowXpGain(true);
        setTimeout(() => setShowXpGain(false), 2000);
        toast.success("🎉 יש התאמה!", {
          description: "פרטי השחקן חשופים כעת.",
        });
        fetchRealTags(); // Fetch real tags instantly
      } else {
        toast.info("הבקשה נדחתה.");
      }
    } catch (error: any) {
      toast.error("שגיאה בעדכון", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    haptic("light");
    setCopiedTag(text);
    toast.success(" הועתק!", { duration: 1500 });
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleEnhanceBio = async () => {
    toast.info("שיפור ביו עם AI הוסר מהמערכת.");
  };

  // Determine which tags to show: revealed ones (if fetched) or hidden (from props, likely masked)
  const displayTags = revealedTags || hiddenTags;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel group relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${status === "approved" ? "border-primary shadow-[0_0_20px_rgba(0,255,157,0.1)]" : "border-transparent hover:border-primary"}`}
      initial={{ opacity: 0, y: 20 }}
      layout
      whileHover={{ scale: 1.02, y: -5 }}
    >
      {/* Decorative Glow */}
      <div
        className={`absolute top-0 right-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-all duration-700 ${status === "approved" ? "h-full w-full bg-primary/40 opacity-20" : "bg-primary/20 group-hover:bg-primary/40"}`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-linear-to-br from-primary to-secondary p-[2px]">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-black">
                <OptimizedAvatar
                  className="h-full w-full object-cover"
                  seed={currentSeed}
                  size={48}
                  style={
                    currentSeed.startsWith("/avatars") ? "avataaars" : "bottts"
                  }
                />
              </div>
            </div>
            {/* Level Badge */}
            <div className="absolute -right-1 -bottom-2 z-20 rounded-md border border-primary bg-black px-1.5 font-bold text-[10px] text-primary shadow-lg">
              LVL {level}
            </div>
          </div>

          <div className="text-right">
            {" "}
            {/* RTL Alignment */}
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white leading-tight">
                {username}
              </h3>
              {online && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              )}
            </div>
            <span className="block text-gray-400 text-xs" dir="ltr">
              {tag}
            </span>
            {/* XP Bar */}
            <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-white/10">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full bg-linear-to-r from-primary to-secondary"
                initial={{ width: 0 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="group/bio relative mt-4"
        onMouseEnter={() => currentUserId === id && setShowBioEnhancer(true)}
        onMouseLeave={() => setShowBioEnhancer(false)}
      >
        <p className="line-clamp-2 min-h-[40px] grow text-gray-300 text-sm">
          {bio}
        </p>
        {/* Bio Enhancer Button - Only show for own card */}
        {currentUserId === id && (
          <AnimatePresence>
            {showBioEnhancer && (
              <motion.button
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-0 left-0 rounded-lg bg-linear-to-r from-primary to-secondary p-1.5 transition-all hover:shadow-lg hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isEnhancingBio}
                exit={{ opacity: 0, scale: 0.8 }}
                initial={{ opacity: 0, scale: 0.8 }}
                onClick={handleEnhanceBio}
                title="שפר את הביו שלך עם AI"
              >
                {isEnhancingBio ? (
                  <HugeiconsIcon
                    className="animate-spin text-black"
                    icon={Loading02Icon}
                    size={14}
                  />
                ) : (
                  <HugeiconsIcon
                    className="text-black"
                    icon={SparklesIcon}
                    size={14}
                  />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Revealed Gamertags Section */}
      <AnimatePresence>
        {status === "approved" && displayTags && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="mt-4 space-y-2"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
          >
            <h4 className="mb-2 font-bold text-[10px] text-primary uppercase tracking-wider opacity-80">
              Private Gamertags (Click to Copy):
            </h4>
            {Object.entries(displayTags).map(([game, realTag]) => (
              <button
                className="group/tag flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2.5 text-xs transition-all hover:border-primary/30 hover:bg-white/10"
                key={game}
                onClick={() => copyToClipboard(realTag)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-400">{game}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white" dir="ltr">
                    {realTag}
                  </span>
                  {copiedTag === realTag ? (
                    <HugeiconsIcon
                      className="text-green-400"
                      icon={Tick01Icon}
                      size={14}
                    />
                  ) : (
                    <HugeiconsIcon
                      className="text-gray-500 transition-colors group-hover/tag:text-primary"
                      icon={Copy01Icon}
                      size={14}
                    />
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap gap-2">
        {games.map((game, i) => (
          <span
            className="rounded-md border border-secondary/20 bg-secondary/10 px-2 py-1 font-bold text-[10px] text-secondary uppercase tracking-wider"
            key={i}
          >
            {game}
          </span>
        ))}
      </div>

      <div className="relative mt-auto flex gap-2 pt-5">
        <AnimatePresence>
          {showXpGain && (
            <motion.div
              animate={{ y: -20, opacity: 1 }}
              className="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-bold text-shadow-glow text-yellow-400"
              exit={{ y: -30, opacity: 0 }}
              initial={{ y: 0, opacity: 0 }}
            >
              +50 XP
            </motion.div>
          )}
        </AnimatePresence>

        {status === "initial" || status === "rejected" ? (
          <button
            className={
              "flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2 font-bold text-black transition-all duration-300 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            }
            disabled={isLoading || !currentUserId}
            onClick={handleSendRequest}
            title={status === "rejected" ? "הבקשה הקודמת נדחתה" : ""}
          >
            {isLoading ? (
              <HugeiconsIcon
                className="animate-spin"
                icon={Loading02Icon}
                size={18}
              />
            ) : (
              <HugeiconsIcon icon={Add01Icon} size={18} />
            )}
            <span>{status === "rejected" ? "שלח שוב" : "החלף פרטים"}</span>
          </button>
        ) : status === "pending_sent" ? (
          <button
            className="flex flex-1 cursor-wait items-center justify-center gap-2 rounded-xl bg-white/10 py-2 font-bold text-gray-400 transition-all duration-300"
            disabled
          >
            <HugeiconsIcon
              className="animate-spin"
              icon={Loading02Icon}
              size={18}
            />
            <span>ממתין לאישור...</span>
          </button>
        ) : status === "pending_received" ? (
          <div className="flex flex-1 gap-2">
            <button
              className="flex flex-1 items-center justify-center rounded-xl bg-green-500 py-2 font-bold text-black transition-all hover:bg-green-400"
              disabled={isLoading}
              onClick={() => handleApproveResponse(true)}
              title="אשר החלפה"
            >
              <HugeiconsIcon icon={Tick01Icon} size={18} />
            </button>
            <button
              className="flex items-center justify-center rounded-xl bg-red-500/20 px-3 py-2 font-bold text-red-400 transition-all hover:bg-red-500/30"
              disabled={isLoading}
              onClick={() => handleApproveResponse(false)}
              title="דחה בקשה"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </button>
          </div> // Approved
        ) : (
          <button
            className="flex flex-1 cursor-default items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 py-2 font-bold text-emerald-400 transition-all duration-300"
            disabled
          >
            <HugeiconsIcon icon={Shield01Icon} size={18} />
            <span>חברים</span>
          </button>
        )}

        {/* Friend Button */}
        {currentUserId && currentUserId !== id && (
          <button
            className={`rounded-xl p-2 transition-colors ${
              friendshipStatus === "accepted"
                ? "cursor-default bg-green-500/20 text-green-400"
                : friendshipStatus === "pending_sent"
                  ? "cursor-wait bg-white/5 text-yellow-400"
                  : friendshipStatus === "pending_received"
                    ? "cursor-default bg-blue-500/20 text-blue-400"
                    : "bg-white/5 text-white hover:bg-white/10 hover:text-green-400"
            }`}
            disabled={friendshipStatus !== "none"}
            onClick={() =>
              friendshipStatus === "none" && onSendFriendRequest?.(id)
            }
            title={
              friendshipStatus === "accepted"
                ? "חברים"
                : friendshipStatus === "pending_sent"
                  ? "בקשה נשלחה"
                  : friendshipStatus === "pending_received"
                    ? "ממתין לאישורך"
                    : "הוסף חבר"
            }
          >
            {friendshipStatus === "accepted" ? (
              <HugeiconsIcon icon={UserCheck01Icon} size={18} />
            ) : friendshipStatus === "pending_sent" ? (
              <HugeiconsIcon icon={Clock01Icon} size={18} />
            ) : friendshipStatus === "pending_received" ? (
              <HugeiconsIcon icon={UserCheck01Icon} size={18} />
            ) : (
              <HugeiconsIcon icon={UserAdd01Icon} size={18} />
            )}
          </button>
        )}

        <Link
          className={`rounded-xl p-2 transition-colors ${status === "approved" ? "bg-primary text-black hover:bg-primary/90" : "bg-white/5 text-white hover:bg-white/10"}`}
          href={`/chat?target=${id}`}
        >
          <HugeiconsIcon icon={Message01Icon} size={18} />
        </Link>
      </div>
    </motion.div>
  );
}
