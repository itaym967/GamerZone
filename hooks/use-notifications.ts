import { useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

function getDismissedKey(userId: string) {
  return `gamerzone_dismissed_notifications_${userId}`;
}

function getDismissedIds(userId: string): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = localStorage.getItem(getDismissedKey(userId));
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(
      parsed.filter((value): value is string => typeof value === "string")
    );
  } catch {
    return new Set();
  }
}

function persistDismissedIds(userId: string, ids: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(getDismissedKey(userId), JSON.stringify([...ids]));
  } catch {
    // Ignore localStorage failures.
  }
}

export function useNotifications(userId: string | null | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      const dismissedIds = getDismissedIds(userId);
      const visibleNotifications = (data || []).filter(
        (notification) => !dismissedIds.has(notification.id)
      );
      setNotifications(visibleNotifications);
      setUnreadCount(visibleNotifications.filter((n) => !n.is_read).length);
    }
    setLoading(false);
  }, [userId, supabase]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) {
        return { error: "Not authenticated" };
      }
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) {
        return { error: error.message };
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return { error: null };
    },
    [supabase, userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) {
      return { error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      return { error: error.message };
    }

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
    return { error: null };
  }, [userId, supabase]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) {
        return { error: "Not authenticated" };
      }
      const dismissedIds = getDismissedIds(userId);
      dismissedIds.add(notificationId);
      persistDismissedIds(userId, dismissedIds);

      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === notificationId);
        if (removed && !removed.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting notification:", error);
      }
      return { error: null };
    },
    [supabase, userId]
  );

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          const dismissedIds = getDismissedIds(userId);
          if (dismissedIds.has(newNotification.id)) {
            return;
          }
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
