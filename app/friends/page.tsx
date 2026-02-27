"use client";

import {
  Cancel01Icon,
  Clock01Icon,
  MessageCircle,
  Search01Icon,
  Tick01Icon,
  UserAdd01Icon,
  UserGroupIcon,
  UserMinus01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { type FriendWithProfile, useFriendship } from "@/hooks/use-friendship";
import Navigation from "../components/Navigation";
import OptimizedAvatar from "../components/OptimizedAvatar";

type Tab = "friends" | "pending" | "sent";

interface EmptyStateContent {
  description: string;
  icon: typeof UserGroupIcon;
  title: string;
}

const EMPTY_STATE_BY_TAB: Record<Tab, EmptyStateContent> = {
  friends: {
    description: "גלה שחקנים בעמוד הגילוי ושלח להם בקשת חברות!",
    icon: UserGroupIcon,
    title: "אין חברים עדיין",
  },
  pending: {
    description: "כשמישהו ישלח לך בקשת חברות, היא תופיע כאן.",
    icon: Clock01Icon,
    title: "אין בקשות ממתינות",
  },
  sent: {
    description: "בקשות שתשלח יופיעו כאן עד שיאושרו.",
    icon: UserAdd01Icon,
    title: "לא שלחת בקשות",
  },
};

function getCurrentList(
  activeTab: Tab,
  friends: FriendWithProfile[],
  pendingReceived: FriendWithProfile[],
  pendingSent: FriendWithProfile[]
) {
  if (activeTab === "friends") {
    return friends;
  }
  if (activeTab === "pending") {
    return pendingReceived;
  }
  return pendingSent;
}

function getTabBadgeClass(isActiveTab: boolean, isPendingWithItems: boolean) {
  if (isActiveTab) {
    return "bg-black/20 text-black";
  }
  if (isPendingWithItems) {
    return "bg-blue-500 text-white";
  }
  return "bg-white/10 text-white/60";
}

function FriendCard({
  item,
  type,
  onAccept,
  onReject,
  onUnfriend,
  onCancel,
}: {
  item: FriendWithProfile;
  type: Tab;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onUnfriend?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  const friend = item.friend;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/3 p-4 transition-all hover:bg-white/6"
      exit={{ opacity: 0, x: -100 }}
      initial={{ opacity: 0, y: 10 }}
      layout
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <OptimizedAvatar
          className="rounded-full border border-white/10 bg-black"
          seed={friend?.avatar_url || "/avatars/gamer.png"}
          size={48}
        />
        {friend?.is_online && (
          <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-primary-foreground bg-green-500 shadow-[0_0_0.5rem_rgba(34,197,94,0.6)]" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-fluid-sm text-white">
          {friend?.username || "Unknown"}
        </h3>
        <p className="truncate text-fluid-xs text-white/40">
          {friend?.bio || (friend?.is_online ? "מחובר/ת" : "לא מחובר/ת")}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {type === "friends" && (
          <>
            <Link
              className="rounded-xl p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-blue-400"
              href={`/chat?target=${friend?.id}`}
              title="שלח הודעה"
            >
              <HugeiconsIcon icon={MessageCircle} size={18} />
            </Link>
            <button
              className="rounded-xl p-2 text-white/40 opacity-0 transition-colors hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              onClick={() => onUnfriend?.(item.id)}
              title="הסר חבר"
              type="button"
            >
              <HugeiconsIcon icon={UserMinus01Icon} size={18} />
            </button>
          </>
        )}

        {type === "pending" && (
          <>
            <button
              className="rounded-xl bg-green-500/10 p-2 text-green-400 transition-colors hover:bg-green-500/20"
              onClick={() => onAccept?.(item.id)}
              title="אשר"
              type="button"
            >
              <HugeiconsIcon icon={Tick01Icon} size={18} />
            </button>
            <button
              className="rounded-xl bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20"
              onClick={() => onReject?.(item.id)}
              title="דחה"
              type="button"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </button>
          </>
        )}

        {type === "sent" && (
          <button
            className="rounded-xl bg-white/5 px-3 py-1.5 font-medium text-fluid-xs text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
            onClick={() => onCancel?.(item.id)}
            type="button"
          >
            בטל בקשה
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function FriendsPage() {
  const { user } = useAuth();
  const {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    acceptRequest,
    rejectRequest,
    unfriend,
    cancelRequest,
  } = useFriendship(user?.id);

  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [searchTerm, setSearchTerm] = useState("");

  const runFriendAction = async (
    action: () => Promise<{ error: string | null }>,
    successMessage: string
  ) => {
    const { error } = await action();
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(successMessage);
  };

  const handleAccept = async (id: string) => {
    await runFriendAction(() => acceptRequest(id), "בקשת החברות אושרה!");
  };

  const handleReject = async (id: string) => {
    await runFriendAction(() => rejectRequest(id), "הבקשה נדחתה");
  };

  const handleUnfriend = async (id: string) => {
    await runFriendAction(() => unfriend(id), "החבר הוסר");
  };

  const handleCancel = async (id: string) => {
    await runFriendAction(() => cancelRequest(id), "הבקשה בוטלה");
  };

  const currentList = getCurrentList(
    activeTab,
    friends,
    pendingReceived,
    pendingSent
  );

  const filteredList = searchTerm
    ? currentList.filter((f) =>
        f.friend?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : currentList;

  const onlineCount = friends.filter((f) => f.friend?.is_online).length;
  const emptyState = EMPTY_STATE_BY_TAB[activeTab];

  const tabs: {
    key: Tab;
    label: string;
    count: number;
    icon: typeof UserGroupIcon;
  }[] = [
    {
      key: "friends",
      label: "חברים",
      count: friends.length,
      icon: UserGroupIcon,
    },
    {
      key: "pending",
      label: "בקשות",
      count: pendingReceived.length,
      icon: Clock01Icon,
    },
    {
      key: "sent",
      label: "נשלחו",
      count: pendingSent.length,
      icon: UserAdd01Icon,
    },
  ];

  let content: React.ReactNode;
  if (loading) {
    content = (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div className="h-20 animate-pulse rounded-2xl bg-white/5" key={i} />
        ))}
      </div>
    );
  } else if (filteredList.length === 0) {
    content = (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <HugeiconsIcon
            className="text-white/30"
            icon={emptyState.icon}
            size={32}
          />
        </div>
        <h3 className="font-semibold text-fluid-lg text-white">
          {emptyState.title}
        </h3>
        <p className="mx-auto mt-1 max-w-xs text-fluid-sm text-white/40">
          {emptyState.description}
        </p>
        {activeTab === "friends" && (
          <Link
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-black text-fluid-sm transition-all hover:bg-primary/90"
            href="/explore"
          >
            <HugeiconsIcon icon={Search01Icon} size={16} />
            גלה שחקנים
          </Link>
        )}
      </div>
    );
  } else {
    content = (
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {filteredList.map((item) => (
            <FriendCard
              item={item}
              key={item.id}
              onAccept={handleAccept}
              onCancel={handleCancel}
              onReject={handleReject}
              onUnfriend={handleUnfriend}
              type={activeTab}
            />
          ))}
        </div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-primary-foreground pb-24 md:pr-64 md:pb-0">
      <Navigation />

      <main className="stack-fluid max-w-2xl p-fluid-lg content-shell">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="flex items-center gap-3 font-bold text-fluid-2xl text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-green-500 to-emerald-600">
                <HugeiconsIcon
                  className="text-white"
                  icon={UserGroupIcon}
                  size={20}
                />
              </div>
              <span>חברים</span>
            </h1>
            {friends.length > 0 && (
              <div className="text-fluid-sm text-white/40">
                <span className="font-bold text-green-400">{onlineCount}</span>{" "}
                מחוברים מתוך {friends.length}
              </div>
            )}
          </div>
          <p className="text-fluid-base text-gray-400">
            נהל את רשימת החברים שלך
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-medium text-fluid-sm transition-all ${
                activeTab === tab.key
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              <HugeiconsIcon icon={tab.icon} size={16} />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-bold text-fluid-xs ${getTabBadgeClass(
                    activeTab === tab.key,
                    tab.key === "pending" && tab.count > 0
                  )}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search (only for friends tab) */}
        {activeTab === "friends" && friends.length > 3 && (
          <div className="relative mb-4">
            <input
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-10 py-3 text-right text-white outline-hidden transition-all focus:border-primary/50 focus:bg-white/8"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש חבר..."
              type="text"
              value={searchTerm}
            />
            <HugeiconsIcon
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
              icon={Search01Icon}
              size={18}
            />
          </div>
        )}

        {/* List */}
        {content}
      </main>
    </div>
  );
}
