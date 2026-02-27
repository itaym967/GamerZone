"use client";

import {
  Alert01Icon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  GameController02Icon,
  InformationCircleIcon,
  LinkSquare01Icon,
  MessageCircle,
  Notification01Icon,
  TickDouble01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { type Notification, useNotifications } from "@/hooks/use-notifications";
import Navigation from "../components/Navigation";

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Notification01Icon; color: string; bg: string }
> = {
  info: {
    icon: InformationCircleIcon,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  success: {
    icon: CheckmarkCircle01Icon,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  error: { icon: Alert01Icon, color: "text-red-400", bg: "bg-red-500/10" },
  warning: {
    icon: Alert01Icon,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  party_kick: {
    icon: UserGroupIcon,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  party_join: {
    icon: UserGroupIcon,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  party_close: {
    icon: UserGroupIcon,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
  },
  swap_request: {
    icon: GameController02Icon,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  message: {
    icon: MessageCircle,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.info;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) {
    return "עכשיו";
  }
  if (diffMin < 60) {
    return `לפני ${diffMin} דקות`;
  }
  if (diffHr < 24) {
    return `לפני ${diffHr} שעות`;
  }
  if (diffDay < 7) {
    return `לפני ${diffDay} ימים`;
  }
  return date.toLocaleDateString("he-IL");
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = getTypeConfig(notification.type);

  const content = (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex items-start gap-4 rounded-2xl border p-4 transition-all ${
        notification.is_read
          ? "border-white/5 bg-white/2 opacity-60"
          : "border-white/10 bg-white/5 shadow-lg"
      }`}
      exit={{ opacity: 0, x: -100 }}
      initial={{ opacity: 0, y: 10 }}
      layout
    >
      {/* Unread dot */}
      {!notification.is_read && (
        <div className="absolute top-4 left-4 h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_0.5rem_rgba(59,130,246,0.6)]" />
      )}

      {/* Icon */}
      <div
        className={`h-10 w-10 shrink-0 rounded-xl ${config.bg} flex items-center justify-center`}
      >
        <HugeiconsIcon className={config.color} icon={config.icon} size={20} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 font-semibold text-fluid-sm text-white leading-tight">
          {notification.title}
        </h3>
        <p className="text-fluid-sm text-white/50 leading-relaxed">
          {notification.message}
        </p>
        <span className="mt-2 block text-fluid-xs text-white/30">
          {formatTimeAgo(notification.created_at)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.is_read && (
          <button
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-blue-400"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            title="סמן כנקרא"
            type="button"
          >
            <HugeiconsIcon icon={TickDouble01Icon} size={16} />
          </button>
        )}
        <button
          className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-red-400"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(notification.id);
          }}
          title="מחק"
          type="button"
        >
          <HugeiconsIcon icon={Delete02Icon} size={16} />
        </button>
      </div>

      {/* Link indicator */}
      {notification.action_url && (
        <div className="shrink-0 self-center text-white/20">
          <HugeiconsIcon icon={LinkSquare01Icon} size={14} />
        </div>
      )}
    </motion.div>
  );

  if (notification.action_url) {
    return (
      <Link
        href={notification.action_url}
        onClick={() => !notification.is_read && onMarkRead(notification.id)}
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user?.id);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success("כל ההתראות סומנו כנקראו");
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    toast.success("ההתראה נמחקה");
  };

  const emptyTitle = filter === "unread" ? "אין התראות חדשות" : "אין התראות";
  const emptyDescription =
    filter === "unread"
      ? "כל ההתראות שלך נקראו!"
      : "כשיהיו עדכונים חדשים, הם יופיעו כאן.";

  let notificationsContent: React.ReactNode;
  if (loading) {
    notificationsContent = (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" key={i} />
        ))}
      </div>
    );
  } else if (filteredNotifications.length === 0) {
    notificationsContent = (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <HugeiconsIcon
            className="text-white/30"
            icon={Notification01Icon}
            size={32}
          />
        </div>
        <h3 className="font-semibold text-fluid-lg text-white">{emptyTitle}</h3>
        <p className="mx-auto mt-1 max-w-xs text-fluid-sm text-white/40">
          {emptyDescription}
        </p>
      </div>
    );
  } else {
    notificationsContent = (
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDelete={handleDelete}
              onMarkRead={markAsRead}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600">
                <HugeiconsIcon
                  className="text-white"
                  icon={Notification01Icon}
                  size={20}
                />
              </div>
              <span>התראות</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-600 px-2.5 py-0.5 font-bold text-fluid-sm text-white">
                  {unreadCount}
                </span>
              )}
            </h1>

            {unreadCount > 0 && (
              <button
                className="flex items-center gap-1.5 font-medium text-blue-400 text-fluid-sm transition-colors hover:text-blue-300"
                onClick={handleMarkAllRead}
                type="button"
              >
                <HugeiconsIcon icon={TickDouble01Icon} size={16} />
                סמן הכל כנקרא
              </button>
            )}
          </div>
          <p className="text-fluid-base text-gray-400">
            כל העדכונים שלך במקום אחד
          </p>
        </header>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            className={`rounded-xl border px-4 py-2 font-medium text-fluid-sm transition-all ${
              filter === "all"
                ? "border-white bg-white text-black"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
            onClick={() => setFilter("all")}
            type="button"
          >
            הכל ({notifications.length})
          </button>
          <button
            className={`rounded-xl border px-4 py-2 font-medium text-fluid-sm transition-all ${
              filter === "unread"
                ? "border-blue-500 bg-blue-600 text-white"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
            onClick={() => setFilter("unread")}
            type="button"
          >
            לא נקראו ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        {notificationsContent}
      </main>
    </div>
  );
}
