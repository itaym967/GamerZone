import { useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

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
      const nextNotifications = data || [];
      setNotifications(nextNotifications);
      setUnreadCount(nextNotifications.filter((n) => !n.is_read).length);
    }
    setLoading(false);
  }, [userId, supabase]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) {
        return { error: "Not authenticated" };
      }
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId)
        .select("id");

      if (error) {
        return { error: error.message };
      }
      if (!data || data.length === 0) {
        return { error: "לא ניתן לסמן כהתראה שנקראה." };
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

    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);
    if (unreadIds.length === 0) {
      return { error: null };
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .in("id", unreadIds)
      .select("id");

    if (error) {
      return { error: error.message };
    }
    if (!data || data.length === 0) {
      return { error: "לא נמצאו התראות לעדכון." };
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    return { error: null };
  }, [notifications, userId, supabase]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) {
        return { error: "Not authenticated" };
      }

      const { data, error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", userId)
        .select("id");

      if (error) {
        return { error: error.message };
      }
      if (!data || data.length === 0) {
        return { error: "לא ניתן למחוק את ההתראה." };
      }

      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === notificationId);
        if (removed && !removed.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });

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

    let isTearingDown = false;
    const channelName = `notifications_realtime_${userId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
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
          setNotifications((prev) => {
            if (
              prev.some(
                (notification) => notification.id === newNotification.id
              )
            ) {
              return prev;
            }
            setUnreadCount((count) =>
              newNotification.is_read ? count : count + 1
            );
            return [newNotification, ...prev];
          });
        }
      )
      .subscribe((status) => {
        if (isTearingDown || process.env.NODE_ENV === "production") {
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Notifications realtime status:", status);
        }
      });

    return () => {
      isTearingDown = true;
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
