import { useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Friendship = Database["public"]["Tables"]["friendships"]["Row"];
type ExistingFriendshipRow = Pick<
  Friendship,
  "id" | "status" | "sender_id" | "receiver_id"
>;

export type FriendWithProfile = Friendship & {
  friend: Pick<
    Profile,
    "id" | "username" | "avatar_url" | "is_online" | "bio"
  > | null;
};

export type FriendshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted";

interface ResolveExistingFriendshipParams {
  existing: ExistingFriendshipRow;
  fetchFriends: () => Promise<void>;
  supabase: ReturnType<typeof createClient>;
  targetId: string;
  userId: string;
}

const acceptExistingPendingRequest = async ({
  existing,
  fetchFriends,
  supabase,
}: Pick<
  ResolveExistingFriendshipParams,
  "existing" | "fetchFriends" | "supabase"
>) => {
  const { error } = await supabase
    .from("friendships")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    return { error: error.message };
  }

  await fetchFriends();
  return { error: null };
};

const resendRejectedRequest = async ({
  existing,
  fetchFriends,
  supabase,
  targetId,
  userId,
}: ResolveExistingFriendshipParams) => {
  const { error } = await supabase
    .from("friendships")
    .update({
      status: "pending",
      sender_id: userId,
      receiver_id: targetId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  if (error) {
    return { error: error.message };
  }
  await fetchFriends();
  return { error: null };
};

const resolveExistingFriendship = async ({
  existing,
  fetchFriends,
  supabase,
  targetId,
  userId,
}: ResolveExistingFriendshipParams) => {
  if (existing.status === "accepted") {
    return { handled: true, error: "Already friends" };
  }

  if (existing.status === "pending") {
    if (existing.sender_id === targetId && existing.receiver_id === userId) {
      const result = await acceptExistingPendingRequest({
        existing,
        fetchFriends,
        supabase,
      });
      return { handled: true, error: result.error };
    }

    return { handled: true, error: "Request already pending" };
  }

  if (existing.status === "rejected") {
    const result = await resendRejectedRequest({
      existing,
      fetchFriends,
      supabase,
      targetId,
      userId,
    });
    return { handled: true, error: result.error };
  }

  return { handled: false, error: null };
};

export function useFriendship(userId: string | null | undefined) {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendWithProfile[]>(
    []
  );
  const [pendingSent, setPendingSent] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const supabase = useMemo(() => createClient(), []);

  const fetchFriends = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      setPendingReceived([]);
      setPendingSent([]);
      setFriendIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch all friendships involving this user
    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching friendships:", error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setFriends([]);
      setPendingReceived([]);
      setPendingSent([]);
      setFriendIds(new Set());
      setLoading(false);
      return;
    }

    // Collect all friend user IDs to fetch profiles
    const otherUserIds = data.map((f) =>
      f.sender_id === userId ? f.receiver_id : f.sender_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, is_online, bio")
      .in("id", otherUserIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const withProfiles: FriendWithProfile[] = data.map((f) => {
      const friendId = f.sender_id === userId ? f.receiver_id : f.sender_id;
      return { ...f, friend: profileMap.get(friendId) || null };
    });

    const accepted = withProfiles.filter((f) => f.status === "accepted");
    const acceptedFriendIds = new Set(
      accepted
        .map((f) => (f.sender_id === userId ? f.receiver_id : f.sender_id))
        .filter(Boolean)
    );
    const pendingIn = withProfiles.filter(
      (f) =>
        f.status === "pending" &&
        f.receiver_id === userId &&
        !acceptedFriendIds.has(f.sender_id)
    );
    const pendingOut = withProfiles.filter(
      (f) =>
        f.status === "pending" &&
        f.sender_id === userId &&
        !acceptedFriendIds.has(f.receiver_id)
    );

    setFriends(accepted);
    setPendingReceived(pendingIn);
    setPendingSent(pendingOut);
    setFriendIds(
      new Set(accepted.map((f) => f.friend?.id).filter(Boolean) as string[])
    );
    setLoading(false);
  }, [userId, supabase]);

  const sendRequest = useCallback(
    async (targetId: string) => {
      if (!userId) {
        return { error: "Not authenticated" };
      }

      // Check if a friendship already exists in either direction
      const { data: existing } = await supabase
        .from("friendships")
        .select("id, status, sender_id, receiver_id")
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${userId})`
        )
        .limit(1)
        .maybeSingle();

      if (existing) {
        const result = await resolveExistingFriendship({
          existing,
          fetchFriends,
          supabase,
          targetId,
          userId,
        });
        if (result.handled) {
          return { error: result.error };
        }
      }

      const { error } = await supabase
        .from("friendships")
        .insert({ sender_id: userId, receiver_id: targetId });

      if (error) {
        return { error: error.message };
      }

      // Create notification for receiver
      await supabase.from("notifications").insert({
        user_id: targetId,
        title: "בקשת חברות חדשה",
        message: "מישהו שלח לך בקשת חברות!",
        type: "friend_request",
        action_url: "/friends",
      });

      await fetchFriends();
      return { error: null };
    },
    [userId, supabase, fetchFriends]
  );

  const acceptRequest = useCallback(
    async (friendshipId: string) => {
      if (!userId) {
        return { error: "Not authenticated" };
      }
      const friendship = pendingReceived.find((f) => f.id === friendshipId);

      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", friendshipId)
        .eq("receiver_id", userId);

      if (error) {
        return { error: error.message };
      }

      // Notify the sender that their request was accepted
      if (friendship) {
        await supabase.from("notifications").insert({
          user_id: friendship.sender_id,
          title: "בקשת החברות אושרה!",
          message: `${friendship.friend?.username || "שחקן"} אישר/ה את בקשת החברות שלך`,
          type: "friend_accepted",
          action_url: "/friends",
        });
      }

      await fetchFriends();
      return { error: null };
    },
    [supabase, fetchFriends, pendingReceived, userId]
  );

  const rejectRequest = useCallback(
    async (friendshipId: string) => {
      if (!userId) {
        return { error: "Not authenticated" };
      }
      const { error } = await supabase
        .from("friendships")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", friendshipId)
        .eq("receiver_id", userId);

      if (error) {
        return { error: error.message };
      }
      await fetchFriends();
      return { error: null };
    },
    [supabase, fetchFriends, userId]
  );

  const unfriend = useCallback(
    async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) {
        return { error: error.message };
      }
      await fetchFriends();
      return { error: null };
    },
    [supabase, fetchFriends]
  );

  const cancelRequest = useCallback(
    async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) {
        return { error: error.message };
      }
      await fetchFriends();
      return { error: null };
    },
    [supabase, fetchFriends]
  );

  const getFriendshipStatus = useCallback(
    (
      targetId: string
    ): { status: FriendshipStatus; friendshipId: string | null } => {
      const asFriend = friends.find(
        (f) => f.sender_id === targetId || f.receiver_id === targetId
      );
      if (asFriend) {
        return { status: "accepted", friendshipId: asFriend.id };
      }

      const asSent = pendingSent.find((f) => f.receiver_id === targetId);
      if (asSent) {
        return { status: "pending_sent", friendshipId: asSent.id };
      }

      const asReceived = pendingReceived.find((f) => f.sender_id === targetId);
      if (asReceived) {
        return { status: "pending_received", friendshipId: asReceived.id };
      }

      return { status: "none", friendshipId: null };
    },
    [friends, pendingSent, pendingReceived]
  );

  const isFriend = useCallback(
    (targetId: string): boolean => {
      return friendIds.has(targetId);
    },
    [friendIds]
  );

  // Initial fetch
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel = supabase
      .channel("friendships_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `sender_id=eq.${userId}`,
        },
        () => fetchFriends()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `receiver_id=eq.${userId}`,
        },
        () => fetchFriends()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, fetchFriends]);

  return {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    friendIds,
    sendRequest,
    acceptRequest,
    rejectRequest,
    unfriend,
    cancelRequest,
    getFriendshipStatus,
    isFriend,
    refetch: fetchFriends,
  };
}
