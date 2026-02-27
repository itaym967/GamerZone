"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Clock,
  MessageCircle,
  Search,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { type FriendWithProfile, useFriendship } from "@/hooks/useFriendship";
import Navigation from "../components/Navigation";
import OptimizedAvatar from "../components/OptimizedAvatar";

type Tab = "friends" | "pending" | "sent";

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
      className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.06]"
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
          <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-[#050510] bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-sm text-white">
          {friend?.username || "Unknown"}
        </h3>
        <p className="truncate text-white/40 text-xs">
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
              <MessageCircle size={18} />
            </Link>
            <button
              className="rounded-xl p-2 text-white/40 opacity-0 transition-colors hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              onClick={() => onUnfriend?.(item.id)}
              title="הסר חבר"
            >
              <UserMinus size={18} />
            </button>
          </>
        )}

        {type === "pending" && (
          <>
            <button
              className="rounded-xl bg-green-500/10 p-2 text-green-400 transition-colors hover:bg-green-500/20"
              onClick={() => onAccept?.(item.id)}
              title="אשר"
            >
              <Check size={18} />
            </button>
            <button
              className="rounded-xl bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20"
              onClick={() => onReject?.(item.id)}
              title="דחה"
            >
              <X size={18} />
            </button>
          </>
        )}

        {type === "sent" && (
          <button
            className="rounded-xl bg-white/5 px-3 py-1.5 font-medium text-white/40 text-xs transition-colors hover:bg-red-500/10 hover:text-red-400"
            onClick={() => onCancel?.(item.id)}
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

  const handleAccept = async (id: string) => {
    const { error } = await acceptRequest(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("בקשת החברות אושרה!");
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await rejectRequest(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("הבקשה נדחתה");
    }
  };

  const handleUnfriend = async (id: string) => {
    const { error } = await unfriend(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("החבר הוסר");
    }
  };

  const handleCancel = async (id: string) => {
    const { error } = await cancelRequest(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("הבקשה בוטלה");
    }
  };

  const currentList =
    activeTab === "friends"
      ? friends
      : activeTab === "pending"
        ? pendingReceived
        : pendingSent;

  const filteredList = searchTerm
    ? currentList.filter((f) =>
        f.friend?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : currentList;

  const onlineCount = friends.filter((f) => f.friend?.is_online).length;

  const tabs: { key: Tab; label: string; count: number; icon: typeof Users }[] =
    [
      { key: "friends", label: "חברים", count: friends.length, icon: Users },
      {
        key: "pending",
        label: "בקשות",
        count: pendingReceived.length,
        icon: Clock,
      },
      {
        key: "sent",
        label: "נשלחו",
        count: pendingSent.length,
        icon: UserPlus,
      },
    ];

  return (
    <div className="min-h-screen bg-[#050510] pb-24 md:pr-64 md:pb-0">
      <Navigation />

      <main className="mx-auto max-w-2xl p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="flex items-center gap-3 font-bold text-3xl text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                <Users className="text-white" size={20} />
              </div>
              <span>חברים</span>
            </h1>
            {friends.length > 0 && (
              <div className="text-sm text-white/40">
                <span className="font-bold text-green-400">{onlineCount}</span>{" "}
                מחוברים מתוך {friends.length}
              </div>
            )}
          </div>
          <p className="text-gray-400">נהל את רשימת החברים שלך</p>
        </header>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 font-bold text-xs ${
                    activeTab === tab.key
                      ? "bg-black/20 text-black"
                      : tab.key === "pending" && tab.count > 0
                        ? "bg-blue-500 text-white"
                        : "bg-white/10 text-white/60"
                  }`}
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
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-10 py-3 text-right text-white outline-none transition-all focus:border-primary/50 focus:bg-white/[0.08]"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש חבר..."
              type="text"
              value={searchTerm}
            />
            <Search
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                className="h-20 animate-pulse rounded-2xl bg-white/5"
                key={i}
              />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              {activeTab === "friends" ? (
                <Users className="text-white/30" size={32} />
              ) : activeTab === "pending" ? (
                <Clock className="text-white/30" size={32} />
              ) : (
                <UserPlus className="text-white/30" size={32} />
              )}
            </div>
            <h3 className="font-semibold text-lg text-white">
              {activeTab === "friends"
                ? "אין חברים עדיין"
                : activeTab === "pending"
                  ? "אין בקשות ממתינות"
                  : "לא שלחת בקשות"}
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-white/40">
              {activeTab === "friends"
                ? "גלה שחקנים בעמוד הגילוי ושלח להם בקשת חברות!"
                : activeTab === "pending"
                  ? "כשמישהו ישלח לך בקשת חברות, היא תופיע כאן."
                  : "בקשות שתשלח יופיעו כאן עד שיאושרו."}
            </p>
            {activeTab === "friends" && (
              <Link
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-black text-sm transition-all hover:bg-primary/90"
                href="/explore"
              >
                <Search size={16} />
                גלה שחקנים
              </Link>
            )}
          </div>
        ) : (
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
        )}
      </main>
    </div>
  );
}
