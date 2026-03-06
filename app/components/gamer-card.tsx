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
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import Link from "next/link";
import { type ReactNode, useCallback, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { haptic } from "@/utils/haptics";
import OptimizedAvatar from "./optimized-avatar";

const SWAP_REQUEST_COOLDOWN_MS = 60 * 1000;

const getDeterministicXp = (seed: string) => {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 401;
  }
  return 100 + hash;
};

type SwapStatus =
  | "initial"
  | "pending_sent"
  | "pending_received"
  | "approved"
  | "rejected";

type FriendshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted";

interface GamerTagRow {
  platform: string;
  tag: string;
}

const getFriendButtonClassName = (friendshipStatus: FriendshipStatus) => {
  if (friendshipStatus === "accepted") {
    return "cursor-default bg-green-500/20 text-green-400";
  }
  if (friendshipStatus === "pending_sent") {
    return "cursor-wait bg-white/5 text-yellow-400";
  }
  if (friendshipStatus === "pending_received") {
    return "cursor-default bg-blue-500/20 text-blue-400";
  }
  return "bg-white/5 text-white hover:bg-white/10 hover:text-green-400";
};

const getFriendButtonTitle = (friendshipStatus: FriendshipStatus) => {
  if (friendshipStatus === "accepted") {
    return "חברים";
  }
  if (friendshipStatus === "pending_sent") {
    return "בקשה נשלחה";
  }
  if (friendshipStatus === "pending_received") {
    return "ממתין לאישורך";
  }
  return "הוסף חבר";
};

const getFriendButtonIcon = (friendshipStatus: FriendshipStatus) => {
  if (friendshipStatus === "accepted") {
    return <HugeiconsIcon icon={UserCheck01Icon} size={18} />;
  }
  if (friendshipStatus === "pending_sent") {
    return <HugeiconsIcon icon={Clock01Icon} size={18} />;
  }
  if (friendshipStatus === "pending_received") {
    return <HugeiconsIcon icon={UserCheck01Icon} size={18} />;
  }
  return <HugeiconsIcon icon={UserAdd01Icon} size={18} />;
};

interface GamerCardProps {
  avatarSeed?: string; // Optional override for avatar generation
  bio: string;
  currentUserId: string | null;
  // Friend system props
  friendshipStatus?: FriendshipStatus;
  games: string[];
  hiddenTags?: { [key: string]: string }; // Map of game -> real gamertag
  id: string;
  // OPTIMIZATION: Accept swap status from parent to avoid per-card subscriptions
  initialSwapStatus?: SwapStatus;
  matchConfidence?: number;
  matchReasons?: string[];
  online?: boolean;
  onSendFriendRequest?: (targetId: string) => void;
  onSwapStatusChange?: (userId: string, status: SwapStatus) => void;
  reliabilityScore?: number;
  showSwapActions?: boolean;
  swapsApprovedCount?: number;
  tag: string; // e.g. @cyber_ninja
  username: string;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return "Unknown error";
};

const getSwapCooldownKey = (senderId: string, receiverId: string) =>
  `gamerzone_swap_cooldown_${senderId}_${receiverId}`;

const getRemainingCooldownMs = (senderId: string, receiverId: string) => {
  if (typeof window === "undefined") {
    return 0;
  }
  const rawValue = window.sessionStorage.getItem(
    getSwapCooldownKey(senderId, receiverId)
  );
  if (!rawValue) {
    return 0;
  }
  const lastSentAt = Number(rawValue);
  if (Number.isNaN(lastSentAt)) {
    return 0;
  }
  return Math.max(0, SWAP_REQUEST_COOLDOWN_MS - (Date.now() - lastSentAt));
};

const markSwapRequestSentNow = (senderId: string, receiverId: string) => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(
    getSwapCooldownKey(senderId, receiverId),
    String(Date.now())
  );
};

interface EnsureFriendshipParams {
  receiverId: string;
  senderId: string;
  supabase: ReturnType<typeof createClient>;
}

const ensureFriendship = async ({
  receiverId,
  senderId,
  supabase,
}: EnsureFriendshipParams) => {
  const { error: friendError } = await supabase
    .schema("public")
    .from("friendships")
    .upsert(
      {
        sender_id: senderId,
        receiver_id: receiverId,
        status: "accepted",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "sender_id,receiver_id", ignoreDuplicates: true }
    );

  if (!friendError) {
    return;
  }

  const { data: existing } = await supabase
    .schema("public")
    .from("friendships")
    .select("id")
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .maybeSingle();

  if (!existing) {
    await supabase.schema("public").from("friendships").insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: "accepted",
    });
  }
};

interface SwapActionsProps {
  currentUserId: string | null;
  handleApproveResponse: (approved: boolean) => Promise<void>;
  handleSendRequest: () => Promise<void>;
  isLoading: boolean;
  status: SwapStatus;
  targetUserId: string;
}

const SwapActions = ({
  status,
  isLoading,
  currentUserId,
  targetUserId,
  handleSendRequest,
  handleApproveResponse,
}: SwapActionsProps): ReactNode => {
  if (currentUserId === targetUserId) {
    return null;
  }

  if (status === "initial" || status === "rejected") {
    return (
      <button
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2 font-bold text-black transition-all duration-300 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isLoading || !currentUserId}
        onClick={handleSendRequest}
        title={status === "rejected" ? "הבקשה הקודמת נדחתה" : ""}
        type="button"
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
    );
  }

  if (status === "pending_sent") {
    return (
      <button
        className="flex flex-1 cursor-wait items-center justify-center gap-2 rounded-xl bg-white/10 py-2 font-bold text-gray-400 transition-all duration-300"
        disabled
        type="button"
      >
        <HugeiconsIcon
          className="animate-spin"
          icon={Loading02Icon}
          size={18}
        />
        <span>ממתין לאישור...</span>
      </button>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="flex flex-1 gap-2">
        <button
          className="flex flex-1 items-center justify-center rounded-xl bg-green-500 py-2 font-bold text-black transition-all hover:bg-green-400"
          disabled={isLoading}
          onClick={() => handleApproveResponse(true)}
          title="אשר החלפה"
          type="button"
        >
          <HugeiconsIcon icon={Tick01Icon} size={18} />
        </button>
        <button
          className="flex items-center justify-center rounded-xl bg-red-500/20 px-3 py-2 font-bold text-red-400 transition-all hover:bg-red-500/30"
          disabled={isLoading}
          onClick={() => handleApproveResponse(false)}
          title="דחה בקשה"
          type="button"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} />
        </button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <button
        className="flex flex-1 cursor-default items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 py-2 font-bold text-emerald-400 transition-all duration-300"
        disabled
        type="button"
      >
        <HugeiconsIcon icon={Shield01Icon} size={18} />
        <span>חברים</span>
      </button>
    );
  }

  return null;
};

interface FriendActionButtonProps {
  currentUserId: string | null;
  friendshipStatus: FriendshipStatus;
  id: string;
  onSendFriendRequest?: (targetId: string) => void;
}

const FriendActionButton = ({
  currentUserId,
  id,
  friendshipStatus,
  onSendFriendRequest,
}: FriendActionButtonProps): ReactNode => {
  if (!currentUserId || currentUserId === id) {
    return null;
  }

  return (
    <button
      className={`rounded-xl p-2 transition-colors ${getFriendButtonClassName(friendshipStatus)}`}
      disabled={friendshipStatus !== "none"}
      onClick={() => {
        if (friendshipStatus === "none") {
          onSendFriendRequest?.(id);
        }
      }}
      title={getFriendButtonTitle(friendshipStatus)}
      type="button"
    >
      {getFriendButtonIcon(friendshipStatus)}
    </button>
  );
};

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
  matchConfidence,
  matchReasons,
  reliabilityScore,
  swapsApprovedCount,
  onSwapStatusChange,
  showSwapActions = true,
  friendshipStatus = "none",
  onSendFriendRequest,
}: GamerCardProps) {
  const [status, setStatus] = useState<SwapStatus>(
    initialSwapStatus || "initial"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [xp, setXp] = useState(() => getDeterministicXp(`${id}:${username}`));
  const [showXpGain, setShowXpGain] = useState(false);
  // State for revealed tags
  const [revealedTags, setRevealedTags] = useState<{
    [key: string]: string;
  } | null>(null);
  // Bio enhancer state
  const [isEnhancingBio, _setIsEnhancingBio] = useState(false);

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
      for (const tag of data as GamerTagRow[]) {
        realTags[tag.platform] = tag.tag;
      }
      setRevealedTags(realTags);
    }
  }, [id, supabase]);

  const handleSendRequest = async () => {
    if (!currentUserId) {
      toast.error("עליך להתחבר כדי לשלוח בקשה!");
      return;
    }
    if (currentUserId === id) {
      toast.info("אי אפשר לשלוח בקשת החלפה לעצמך.");
      return;
    }
    const remainingCooldownMs = getRemainingCooldownMs(currentUserId, id);
    if (remainingCooldownMs > 0) {
      toast.info("רגע לפני בקשה נוספת", {
        description: `נסה שוב בעוד ${Math.ceil(remainingCooldownMs / 1000)} שניות.`,
      });
      return;
    }

    setIsLoading(true);

    const { data: existingRequest, error: existingRequestError } =
      await supabase
        .from("swap_requests")
        .select("sender_id, receiver_id, status")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${currentUserId})`
        )
        .eq("status", "pending")
        .maybeSingle();

    if (existingRequestError) {
      toast.error("שגיאה בשליחת הבקשה", {
        description: getErrorMessage(existingRequestError),
      });
      setIsLoading(false);
      return;
    }

    if (existingRequest) {
      let pendingStatus: SwapStatus = "pending_received";
      if (existingRequest.sender_id === currentUserId) {
        pendingStatus = "pending_sent";
      }
      setStatus(pendingStatus);
      if (onSwapStatusChange) {
        onSwapStatusChange(id, pendingStatus);
      }
      toast.info("כבר קיימת בקשה ממתינה ביניכם.");
      setIsLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("swap_requests").insert({
      sender_id: currentUserId,
      receiver_id: id,
      status: "pending",
    });

    if (insertError) {
      toast.error("שגיאה בשליחת הבקשה", {
        description: getErrorMessage(insertError),
      });
      setIsLoading(false);
      return;
    }

    setStatus("pending_sent");
    markSwapRequestSentNow(currentUserId, id);
    haptic("success");
    if (onSwapStatusChange) {
      onSwapStatusChange(id, "pending_sent");
    }
    toast.success("בקשה נשלחה!", {
      description: "תקבל התראה כשהמשתמש יאשר.",
    });
    setIsLoading(false);
  };

  const handleApproveResponse = async (approved: boolean) => {
    if (!currentUserId) {
      toast.error("אנא התחבר כדי להגיב לבקשה");
      return;
    }
    setIsLoading(true);
    const newStatus: SwapStatus = approved ? "approved" : "rejected";
    const feedbackType = approved ? "success" : "medium";
    try {
      // Find requests where *I* am the receiver and *THEY* are the sender
      const { error } = await supabase
        .from("swap_requests")
        .update({ status: newStatus })
        .eq("sender_id", id)
        .eq("receiver_id", currentUserId);

      if (error) {
        toast.error("שגיאה בעדכון", { description: getErrorMessage(error) });
        setIsLoading(false);
        return;
      }

      setStatus(newStatus);
      if (onSwapStatusChange) {
        onSwapStatusChange(id, newStatus);
      }

      haptic(feedbackType);

      if (approved) {
        await ensureFriendship({
          receiverId: currentUserId,
          senderId: id,
          supabase,
        });

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
    } catch (error: unknown) {
      toast.error("שגיאה בעדכון", { description: getErrorMessage(error) });
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    haptic("light");
    setCopiedTag(text);
    toast.success(" הועתק!", { duration: 1500 });
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleEnhanceBio = () => {
    toast.info("שיפור ביו עם AI הוסר מהמערכת.");
  };

  // Determine which tags to show: revealed ones (if fetched) or hidden (from props, likely masked)
  const displayTags = revealedTags || hiddenTags;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate={{ opacity: 1, y: 0 }}
        className={`cq-card glass-panel group relative flex h-full flex-col overflow-hidden rounded-2xl border p-fluid-lg transition-all duration-300 ${status === "approved" ? "border-primary shadow-[0_0_1.25rem_rgba(0,255,157,0.1)]" : "border-transparent hover:border-primary"}`}
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
              <div className="h-12 w-12 rounded-full bg-linear-to-br from-primary to-secondary p-0.5">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-black">
                  <OptimizedAvatar
                    className="h-full w-full object-cover"
                    seed={currentSeed}
                    size={48}
                    style={
                      currentSeed.startsWith("/avatars")
                        ? "avataaars"
                        : "bottts"
                    }
                  />
                </div>
              </div>
              {/* Level Badge */}
              <div className="absolute -right-1 -bottom-2 z-20 rounded-md border border-primary bg-black px-1.5 font-bold text-[0.625rem] text-primary shadow-lg">
                LVL {level}
              </div>
            </div>

            <div className="text-right">
              {" "}
              {/* RTL Alignment */}
              <div className="flex items-center gap-2">
                <h3 className="cq-card-title font-bold text-fluid-lg text-white leading-tight">
                  {username}
                </h3>
                {online && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                )}
              </div>
              <span
                className="cq-card-subtitle block text-fluid-xs text-gray-400"
                dir="ltr"
              >
                {tag}
              </span>
              {/* XP Bar */}
              <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-white/10">
                <m.div
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-linear-to-r from-primary to-secondary"
                  initial={{ width: 0 }}
                />
              </div>
              {typeof matchConfidence === "number" && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 font-bold text-[0.625rem] text-primary">
                    <HugeiconsIcon icon={SparklesIcon} size={10} />
                    {matchConfidence}% התאמה
                  </span>
                  {(matchReasons ?? []).slice(0, 2).map((reason) => (
                    <span
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.625rem] text-gray-300"
                      key={reason}
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
              {typeof reliabilityScore === "number" && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 font-bold text-[0.625rem] text-emerald-300">
                    <HugeiconsIcon icon={Shield01Icon} size={10} />
                    אמינות {Math.round(reliabilityScore)}%
                  </span>
                  <span className="text-[0.625rem] text-gray-400">
                    {swapsApprovedCount || 0} החלפות מאושרות
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="group/bio relative mt-4">
          <p className="line-clamp-2 min-h-10 grow text-fluid-sm text-gray-300">
            {bio}
          </p>
          {/* Bio Enhancer Button - Only show for own card */}
          {currentUserId === id && (
            <m.button
              className="absolute top-0 left-0 rounded-lg bg-linear-to-r from-primary to-secondary p-1.5 opacity-0 transition-all hover:shadow-lg hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50 group-hover/bio:opacity-100"
              disabled={isEnhancingBio}
              onClick={handleEnhanceBio}
              title="שפר את הביו שלך עם AI"
              type="button"
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
            </m.button>
          )}
        </div>

        {/* Revealed Gamertags Section */}
        <AnimatePresence>
          {status === "approved" && displayTags && (
            <m.div
              animate={{ height: "auto", opacity: 1 }}
              className="mt-4 space-y-2"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
            >
              <h4 className="mb-2 font-bold text-[0.625rem] text-primary uppercase tracking-wider opacity-80">
                Private Gamertags (Click to Copy):
              </h4>
              {Object.entries(displayTags).map(([game, realTag]) => (
                <button
                  className="group/tag flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2.5 text-fluid-xs transition-all hover:border-primary/30 hover:bg-white/10"
                  key={game}
                  onClick={() => copyToClipboard(realTag)}
                  type="button"
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
            </m.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex flex-wrap gap-2">
          {games.map((game) => (
            <span
              className="rounded-md border border-secondary/20 bg-secondary/10 px-2 py-1 font-bold text-[0.625rem] text-secondary uppercase tracking-wider"
              key={game}
            >
              {game}
            </span>
          ))}
        </div>

        <div className="relative mt-auto flex gap-2 pt-5">
          <AnimatePresence>
            {showXpGain && (
              <m.div
                animate={{ y: -20, opacity: 1 }}
                className="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-bold text-shadow-glow text-yellow-400"
                exit={{ y: -30, opacity: 0 }}
                initial={{ y: 0, opacity: 0 }}
              >
                +50 XP
              </m.div>
            )}
          </AnimatePresence>

          {showSwapActions && (
            <SwapActions
              currentUserId={currentUserId}
              handleApproveResponse={handleApproveResponse}
              handleSendRequest={handleSendRequest}
              isLoading={isLoading}
              status={status}
              targetUserId={id}
            />
          )}

          <FriendActionButton
            currentUserId={currentUserId}
            friendshipStatus={friendshipStatus}
            id={id}
            onSendFriendRequest={onSendFriendRequest}
          />

          <Link
            className={`rounded-xl p-2 transition-colors ${status === "approved" ? "bg-primary text-black hover:bg-primary/90" : "bg-white/5 text-white hover:bg-white/10"}`}
            href={`/chat?target=${id}`}
            prefetch={false}
          >
            <HugeiconsIcon icon={Message01Icon} size={18} />
          </Link>
        </div>
      </m.div>
    </LazyMotion>
  );
}
