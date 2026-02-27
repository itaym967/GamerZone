import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export interface Message {
  content: string;
  created_at: string;
  deleted_at?: string;
  deleted_by?: string[] | null;
  id: string;
  is_read: boolean;
  receiver_id: string;
  sender_id: string;
}

export interface Contact {
  avatar_url: string | null;
  id: string;
  last_msg?: string;
  last_msg_time?: string;
  online?: boolean | null;
  unread_count?: number;
  username: string;
}

export function useChat(
  currentUserId: string | undefined,
  activeChatId: string | null | undefined,
  onMessageReceived?: (msg: Message) => void
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSubscribedRef = useRef(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<number>(Date.now());
  const activeChatIdRef = useRef(activeChatId);

  // Typing indicators state & refs
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  // 1. Fetch Contacts (unique users from message history)
  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    async function fetchContacts() {
      // Get all messages where I am sender or receiver
      const { data: sent, error: sentError } = await supabase
        .from("messages")
        .select("receiver_id, content, created_at")
        .eq("sender_id", currentUserId!)
        .order("created_at", { ascending: false });

      const { data: received, error: receivedError } = await supabase
        .from("messages")
        .select("sender_id, content, created_at")
        .eq("receiver_id", currentUserId!)
        .order("created_at", { ascending: false });

      if (sentError || receivedError) {
        console.error("Error fetching contacts", sentError, receivedError);
        return;
      }

      // Aggregate unique IDs and latest message
      const contactMap = new Map<string, { lastMsg: string; time: string }>();

      sent?.forEach((m) => {
        if (!contactMap.has(m.receiver_id)) {
          contactMap.set(m.receiver_id, {
            lastMsg: `You: ${m.content}`,
            time: m.created_at,
          });
        }
      });

      received?.forEach((m) => {
        if (!contactMap.has(m.sender_id)) {
          const existing = contactMap.get(m.sender_id);
          if (!existing || new Date(m.created_at) > new Date(existing.time)) {
            contactMap.set(m.sender_id, {
              lastMsg: m.content,
              time: m.created_at,
            });
          }
        }
      });

      const contactIds = Array.from(contactMap.keys());
      if (contactIds.length === 0) {
        return;
      }

      // Fetch Profile Details
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, is_online")
        .in("id", contactIds);

      // Fetch unread counts for each contact
      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", currentUserId!)
        .eq("is_read", false)
        .in("sender_id", contactIds);

      // Count unread messages per sender
      const unreadCounts = new Map<string, number>();
      unreadMessages?.forEach((msg) => {
        unreadCounts.set(
          msg.sender_id,
          (unreadCounts.get(msg.sender_id) || 0) + 1
        );
      });

      if (profiles) {
        const mappedContacts: Contact[] = profiles.map((p) => ({
          id: p.id,
          username: p.username || "Unknown",
          avatar_url: p.avatar_url,
          last_msg: contactMap.get(p.id)?.lastMsg,
          last_msg_time: new Date(
            contactMap.get(p.id)!.time
          ).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
          online: p.is_online,
          unread_count: unreadCounts.get(p.id) || 0,
        }));
        setContacts(mappedContacts);
      }
    }

    fetchContacts();
  }, [currentUserId]);

  // 2. Subscribe to Realtime Messages with Auto-Reconnect
  const setupRealtimeSubscription = useCallback(() => {
    if (!currentUserId || isSubscribedRef.current || document.hidden) {
      console.log("⚠️ Skipping subscription setup:", {
        currentUserId,
        isSubscribed: isSubscribedRef.current,
        tabHidden: document.hidden,
      });
      return;
    }

    console.log("🔄 Setting up realtime subscription for user:", currentUserId);
    console.log("📡 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    const channel = supabase
      .channel(`chat_room_${currentUserId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: currentUserId },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          // ✅ OPTIMIZATION: Only subscribe to messages where current user is sender or receiver
          filter: `or(sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId})`,
        },
        (payload) => {
          console.log("🎉 REALTIME EVENT RECEIVED:", {
            timestamp: new Date().toISOString(),
            payload,
            currentUserId,
          });
          const newMessage = payload.new as Message;

          // Update last message time for heartbeat monitoring
          lastMessageTimeRef.current = Date.now();

          // Only add messages relevant to current user AND active chat
          // Note: We still want to notify/update counts for other chats,
          // but 'messages' state should primarily reflect the active conversation to avoid UI mixing.
          const isActiveChat =
            activeChatIdRef.current &&
            (newMessage.sender_id === activeChatIdRef.current ||
              newMessage.receiver_id === activeChatIdRef.current);

          if (
            newMessage.sender_id === currentUserId ||
            newMessage.receiver_id === currentUserId
          ) {
            console.log("✅ Message is relevant to current user");

            // Update messages state ONLY if it belongs to the active chat
            if (isActiveChat) {
              setMessages((prev) => {
                // Deduplicate based on ID
                if (prev.some((m) => m.id === newMessage.id)) {
                  console.log(
                    "⚠️ Message already exists, skipping:",
                    newMessage.id
                  );
                  return prev;
                }
                console.log("➕ Adding new message to state:", newMessage.id);
                return [...prev, newMessage];
              });
            } else {
              console.log(
                "ℹ️ Message received for background chat, not updating active view"
              );
            }

            // Trigger callback for notifications if it's an incoming message
            if (
              newMessage.receiver_id === currentUserId &&
              onMessageReceivedRef.current
            ) {
              onMessageReceivedRef.current(newMessage);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("📊 Realtime subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Successfully subscribed to realtime messages");
          console.log("🔍 Channel state:", channelRef.current?.state);
          console.log(
            "⚡ Listening for INSERT events on public.messages table (filtered by user)"
          );
          isSubscribedRef.current = true;
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Realtime subscription error");
          isSubscribedRef.current = false;
          toast.error("שגיאה בחיבור לעדכונים בזמן אמת");
          // Attempt reconnection after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
            }
            isSubscribedRef.current = false;
            setupRealtimeSubscription();
          }, 3000);
        } else if (status === "TIMED_OUT") {
          console.error("⏱️ Realtime subscription timed out");
          isSubscribedRef.current = false;
          toast.warning("החיבור לעדכונים בזמן אמת איטי");
          // Attempt reconnection
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect after timeout...");
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
            }
            isSubscribedRef.current = false;
            setupRealtimeSubscription();
          }, 2000);
        } else if (status === "CLOSED") {
          console.warn("🔌 Realtime connection closed");
          isSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;
  }, [currentUserId]);

  useEffect(() => {
    setupRealtimeSubscription();

    return () => {
      console.log("Cleaning up realtime subscription");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      isSubscribedRef.current = false;
    };
  }, [setupRealtimeSubscription]);

  // 3. Handle Page Visibility Changes (pause when hidden, resume when visible)
  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("📱 Tab became visible, checking connection...");
        // If we're not subscribed, reconnect
        if (!isSubscribedRef.current) {
          console.log("🔄 Reconnecting after tab became visible...");
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
          }
          setupRealtimeSubscription();
        }
      } else {
        // ✅ OPTIMIZATION: Pause subscription when tab is hidden
        console.log("💤 Tab hidden, pausing realtime subscription...");
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        if (typingChannelRef.current) {
          supabase.removeChannel(typingChannelRef.current);
          typingChannelRef.current = null;
        }
        isSubscribedRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUserId, setupRealtimeSubscription]);

  // 4. Heartbeat to monitor connection health
  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    heartbeatIntervalRef.current = setInterval(() => {
      const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current;
      // If no activity for 2 minutes and we think we're subscribed, verify connection
      if (timeSinceLastMessage > 120_000 && isSubscribedRef.current) {
        console.log("Heartbeat: Verifying connection health...");
        // Check if channel is still connected
        if (channelRef.current && channelRef.current.state !== "joined") {
          console.warn("Heartbeat: Connection appears stale, reconnecting...");
          isSubscribedRef.current = false;
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
          }
          setupRealtimeSubscription();
        }
      }
    }, 30_000); // Check every 30 seconds

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [currentUserId, setupRealtimeSubscription]);

  // 5. Typing Indicator Subscription (only when tab is visible)
  useEffect(() => {
    if (!(currentUserId && activeChatId) || document.hidden) {
      return;
    }

    const sortedIds = [currentUserId, activeChatId].sort().join("_");
    const channelName = `typing_${sortedIds}`;
    console.log(`🔌 Subscribing to typing channel: ${channelName}`);

    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId !== currentUserId) {
          setIsRemoteTyping(true);

          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // Set new timeout to clear typing status after 3 seconds
          typingTimeoutRef.current = setTimeout(() => {
            setIsRemoteTyping(false);
          }, 3000);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          typingChannelRef.current = channel;
        }
      });

    return () => {
      console.log(`🔌 Unsubscribing from typing channel: ${channelName}`);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      setIsRemoteTyping(false);
    };
  }, [currentUserId, activeChatId]);

  // 6. Methods
  const fetchMessages = async (otherUserId: string) => {
    // Skip database fetch for GamerBot (client-side only)
    if (otherUserId === "gamerbot-ai") {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("שגיאה בטעינת הודעות");
    } else {
      // Filter out messages deleted by current user
      const filteredMessages = (data || []).filter(
        (msg) => !(msg.deleted_by && msg.deleted_by.includes(currentUserId!))
      );
      setMessages(filteredMessages);
    }
    setIsLoading(false);
  };

  const sendMessage = async (content: string, receiverId: string) => {
    // Validation: Ensure user is authenticated
    if (!currentUserId) {
      console.error("sendMessage: No currentUserId - user not authenticated");
      toast.error("אנא התחבר כדי לשלוח הודעות");
      return;
    }

    // Validation: Ensure content is not empty
    if (!content.trim()) {
      console.error("sendMessage: Empty content");
      toast.error("לא ניתן לשלוח הודעה ריקה");
      return;
    }

    // Validation: Ensure receiver ID is valid
    if (!receiverId) {
      console.error("sendMessage: No receiverId");
      toast.error("שגיאה: לא נבחר נמען");
      return;
    }

    console.log("Sending message...", {
      sender_id: currentUserId,
      receiver_id: receiverId,
      content: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
    });

    // Optimistic update - add message immediately to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID
      sender_id: currentUserId,
      receiver_id: receiverId,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: receiverId,
          content,
        })
        .select();

      if (error) {
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id)
        );

        console.error("Supabase Insert Error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        // Provide specific error messages based on error type
        if (error.code === "PGRST301" || error.message.includes("JWT")) {
          toast.error("פג תוקף ההתחברות. אנא התחבר מחדש");
        } else if (
          error.code === "42501" ||
          error.message.includes("permission")
        ) {
          toast.error("אין לך הרשאה לשלוח הודעה זו");
        } else {
          toast.error(`שגיאה בשליחת הודעה: ${error.message}`);
        }
        return;
      }

      console.log("Message sent successfully:", data);

      // Replace optimistic message with real one from server
      if (data && data.length > 0) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? data[0] : m))
        );
      }

      // Trigger Push Notification (non-blocking, silent failure)
      if (receiverId !== currentUserId) {
        fetch("/api/send-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: receiverId,
            title: "הודעה חדשה",
            message: content,
            url: `/chat?target=${currentUserId}`,
          }),
        })
          .then((res) => {
            if (!res.ok) {
              console.warn(
                "Push notification failed (non-critical):",
                res.status
              );
            }
          })
          .catch((err) => {
            console.warn(
              "Push notification unavailable (non-critical):",
              err.message
            );
          });
      }
    } catch (err) {
      // Remove optimistic message on unexpected error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      console.error("Unexpected error in sendMessage:", err);
      toast.error("שגיאה בלתי צפויה בשליחת הודעה");
    }
  };

  const refreshConnection = useCallback(async () => {
    console.log("Manual refresh triggered");
    // Reconnect realtime
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    isSubscribedRef.current = false;
    setupRealtimeSubscription();

    // Re-fetch contacts
    if (currentUserId) {
      // Trigger contacts refetch by updating a dependency
      // This is a simple approach - in production you might want a more explicit refetch
      toast.success("מרענן חיבור...");
    }
  }, [currentUserId, setupRealtimeSubscription]);

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!currentUserId) {
        toast.error("אנא התחבר כדי למחוק הודעות");
        return;
      }

      // Optimistic update - remove from UI immediately
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      try {
        const { error } = await supabase.rpc("soft_delete_message", {
          message_id: messageId,
          user_id: currentUserId,
        });

        if (error) {
          console.error("Error deleting message:", error);
          toast.error("שגיאה במחיקת הודעה");
          // Revert optimistic update by refetching
          // Note: In production, you might want to store the deleted message and restore it
        } else {
          toast.success("ההודעה נמחקה");
        }
      } catch (err) {
        console.error("Unexpected error deleting message:", err);
        toast.error("שגיאה בלתי צפויה במחיקת הודעה");
      }
    },
    [currentUserId, supabase]
  );

  const clearConversation = useCallback(
    async (otherUserId: string) => {
      if (!currentUserId) {
        toast.error("אנא התחבר כדי למחוק שיחות");
        return;
      }

      // Optimistic update - clear all messages with this user
      setMessages((prev) =>
        prev.filter(
          (m) => !(m.sender_id === otherUserId || m.receiver_id === otherUserId)
        )
      );

      try {
        const { error } = await supabase.rpc("clear_conversation", {
          user_id_param: currentUserId,
          other_user_id: otherUserId,
        });

        if (error) {
          console.error("Error clearing conversation:", error);
          toast.error("שגיאה במחיקת השיחה");
        } else {
          toast.success("השיחה נמחקה");
        }
      } catch (err) {
        console.error("Unexpected error clearing conversation:", err);
        toast.error("שגיאה בלתי צפויה במחיקת השיחה");
      }
    },
    [currentUserId, supabase]
  );

  const markAsRead = useCallback(
    async (messageIds: string[], senderId?: string) => {
      if (!currentUserId || messageIds.length === 0) {
        return;
      }

      try {
        const { error } = await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", messageIds)
          .eq("receiver_id", currentUserId)
          .eq("is_read", false);

        if (error) {
          console.error("Error marking messages as read:", error);
        } else {
          // Update local messages state
          setMessages((prev) =>
            prev.map((m) =>
              messageIds.includes(m.id) ? { ...m, is_read: true } : m
            )
          );

          // Update local contacts state (clear unread badge)
          if (senderId) {
            setContacts((prev) =>
              prev.map((c) =>
                c.id === senderId ? { ...c, unread_count: 0 } : c
              )
            );
          }
        }
      } catch (err) {
        console.error("Unexpected error marking messages as read:", err);
      }
    },
    [currentUserId, supabase]
  );

  const sendTyping = useCallback(async () => {
    if (!(currentUserId && typingChannelRef.current)) {
      return;
    }

    // Throttle: Only send once every 2 seconds
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) {
      return;
    }
    lastTypingSentRef.current = now;

    await typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    });
  }, [currentUserId]);

  return {
    messages,
    contacts,
    sendMessage,
    fetchMessages,
    isLoading,
    refreshConnection,
    deleteMessage,
    clearConversation,
    markAsRead,
    sendTyping,
    isRemoteTyping,
  };
}
