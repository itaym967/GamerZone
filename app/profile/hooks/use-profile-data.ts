"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  DEFAULT_AVAILABILITY,
  encodeAvailabilityPreferences,
  parseAvailabilityPreferences,
} from "@/lib/availability";
import { createClient } from "@/lib/supabase/client";
import type { ProfileFormData, ProfileStats } from "../types";

interface HiddenTagRow {
  platform: string | null;
  tag: string | null;
}

type SupabaseClient = ReturnType<typeof createClient>;

interface ProfileSnapshot {
  avatarUrl: string | null;
  formData: ProfileFormData;
  stats: ProfileStats;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "אירעה שגיאה בלתי צפויה";
};

const throwIfError = (error: unknown) => {
  if (error) {
    throw error;
  }
};

const RETRYABLE_PROFILE_FETCH_ATTEMPTS = 3;
const RETRYABLE_PROFILE_FETCH_DELAY_MS = 400;

const isFailedToFetchError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.toLowerCase().includes("failed to fetch");
};

const wait = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const DEFAULT_AVATAR_URL =
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Samurai";

const buildHiddenTagsMap = (tags: HiddenTagRow[]) => {
  const hiddenTagsMap: { [key: string]: string } = {};
  for (const tag of tags) {
    if (!(tag.platform && tag.tag)) {
      continue;
    }
    hiddenTagsMap[tag.platform] = tag.tag;
  }
  return hiddenTagsMap;
};

const fetchProfileSnapshot = async (
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileSnapshot> => {
  const [
    profileRes,
    tagsRes,
    swapsSentRes,
    swapsReceivedRes,
    swapsApprovedRes,
    friendsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("gamertags").select("*").eq("user_id", userId),
    supabase
      .from("swap_requests")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", userId),
    supabase
      .from("swap_requests")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId),
    supabase
      .from("swap_requests")
      .select("id", { count: "exact", head: true })
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "approved"),
    supabase
      .schema("public")
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "accepted"),
  ]);

  throwIfError(profileRes.error);
  throwIfError(tagsRes.error);

  const profile = profileRes.data;
  if (!profile) {
    throw new Error("Profile not found");
  }

  const tags = (tagsRes.data || []) as HiddenTagRow[];
  const hiddenTagsMap = buildHiddenTagsMap(tags);
  const gamesList = Object.keys(hiddenTagsMap);

  return {
    avatarUrl: profile.avatar_url,
    formData: {
      availability:
        parseAvailabilityPreferences(profile.website) || DEFAULT_AVAILABILITY,
      username: profile.username || "",
      tag: `@${(profile.username || "user").toLowerCase()}`,
      bio: profile.bio || "",
      games: gamesList,
      hiddenTags: hiddenTagsMap,
    },
    stats: {
      swapsSent: swapsSentRes.count || 0,
      swapsReceived: swapsReceivedRes.count || 0,
      swapsApproved: swapsApprovedRes.count || 0,
      friendsCount: friendsRes.count || 0,
      gamesCount: gamesList.length,
      memberSince: profile.updated_at || null,
    },
  };
};

const fetchProfileSnapshotWithRetry = async (
  supabase: SupabaseClient,
  userId: string
) => {
  let lastError: unknown = null;

  for (
    let attempt = 1;
    attempt <= RETRYABLE_PROFILE_FETCH_ATTEMPTS;
    attempt++
  ) {
    try {
      return await fetchProfileSnapshot(supabase, userId);
    } catch (error) {
      lastError = error;
      const shouldRetry =
        isFailedToFetchError(error) &&
        attempt < RETRYABLE_PROFILE_FETCH_ATTEMPTS;
      if (!shouldRetry) {
        throw error;
      }
      await wait(RETRYABLE_PROFILE_FETCH_DELAY_MS * attempt);
    }
  }

  throw lastError || new Error("Profile loading failed");
};

export function useProfileData() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const userId = useMemo(() => user?.id || null, [user?.id]);

  const [formData, setFormData] = useState<ProfileFormData>({
    availability: DEFAULT_AVAILABILITY,
    username: "",
    tag: "",
    bio: "",
    games: [],
    hiddenTags: {},
  });

  const [originalData, setOriginalData] = useState<ProfileFormData | null>(
    null
  );
  const [avatarSeed, setAvatarSeed] = useState(DEFAULT_AVATAR_URL);
  const [originalAvatar, setOriginalAvatar] = useState(DEFAULT_AVATAR_URL);

  const [stats, setStats] = useState<ProfileStats>({
    swapsSent: 0,
    swapsReceived: 0,
    swapsApproved: 0,
    friendsCount: 0,
    gamesCount: 0,
    memberSince: null,
  });

  // Track unsaved changes
  useEffect(() => {
    if (!originalData) {
      return;
    }
    const changed =
      formData.username !== originalData.username ||
      formData.bio !== originalData.bio ||
      avatarSeed !== originalAvatar ||
      JSON.stringify(formData.availability) !==
        JSON.stringify(originalData.availability) ||
      JSON.stringify(formData.hiddenTags) !==
        JSON.stringify(originalData.hiddenTags) ||
      formData.games.length !== originalData.games.length;
    setHasUnsavedChanges(changed);
  }, [formData, avatarSeed, originalData, originalAvatar]);

  // Fetch profile data
  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!userId) {
      router.push("/login");
      return;
    }

    let isDisposed = false;

    const fetchAll = async () => {
      try {
        const snapshot = await fetchProfileSnapshotWithRetry(supabase, userId);
        if (isDisposed) {
          return;
        }

        setFormData(snapshot.formData);
        setOriginalData(snapshot.formData);
        if (snapshot.avatarUrl) {
          setAvatarSeed(snapshot.avatarUrl);
          setOriginalAvatar(snapshot.avatarUrl);
        }
        setStats(snapshot.stats);
      } catch (_error) {
        if (isDisposed) {
          return;
        }
        toast.error("שגיאה בטעינת הפרופיל");
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    fetchAll();
    return () => {
      isDisposed = true;
    };
  }, [authLoading, userId, router, supabase]);

  const updateFormData = useCallback((updates: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!userId) {
      return;
    }
    if (formData.username.length < 3) {
      toast.error("שם משתמש חייב להכיל לפחות 3 תווים");
      return;
    }
    if (formData.bio.length > 200) {
      toast.error("הביו ארוך מדי (מקסימום 200 תווים)");
      return;
    }

    setIsSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          bio: formData.bio,
          website: encodeAvailabilityPreferences(formData.availability),
          avatar_url: avatarSeed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        throw profileError;
      }

      // Update gamertags
      const updates = Object.entries(formData.hiddenTags).map(
        async ([platform, tag]) => {
          const { error } = await supabase
            .from("gamertags")
            .update({ tag })
            .eq("user_id", userId)
            .eq("platform", platform);
          return error;
        }
      );

      await Promise.all(updates);

      // Update original data to reset unsaved changes tracking
      setOriginalData({ ...formData });
      setOriginalAvatar(avatarSeed);
      setHasUnsavedChanges(false);

      toast.success("הפרופיל עודכן בהצלחה!", {
        description: "הכרטיס שלך מעודכן ומוכן להחלפות.",
      });

      await refreshProfile();
    } catch (error: unknown) {
      toast.error("שגיאה בשמירה", { description: getErrorMessage(error) });
    }
    setIsSaving(false);
  }, [userId, formData, avatarSeed, supabase, refreshProfile]);

  const addGamertag = useCallback(
    async (platform: string, tag: string) => {
      if (!userId) {
        return;
      }
      if (formData.hiddenTags[platform]) {
        toast.error(`כבר קיים תיוג ל-${platform}`);
        return;
      }

      try {
        const { error } = await supabase
          .from("gamertags")
          .insert({ user_id: userId, platform, tag, is_hidden: false });

        if (error) {
          throw error;
        }

        setFormData((prev) => ({
          ...prev,
          games: [...prev.games, platform],
          hiddenTags: { ...prev.hiddenTags, [platform]: tag },
        }));
        setOriginalData((prev) =>
          prev
            ? {
                ...prev,
                games: [...prev.games, platform],
                hiddenTags: { ...prev.hiddenTags, [platform]: tag },
              }
            : prev
        );

        setStats((prev) => ({ ...prev, gamesCount: prev.gamesCount + 1 }));
        toast.success(`${platform} נוסף בהצלחה!`);
      } catch (error: unknown) {
        toast.error("שגיאה בהוספת המשחק", {
          description: getErrorMessage(error),
        });
      }
    },
    [userId, formData.hiddenTags, supabase]
  );

  const removeGamertag = useCallback(
    async (platform: string) => {
      if (!userId) {
        return;
      }

      try {
        const { error } = await supabase
          .from("gamertags")
          .delete()
          .eq("user_id", userId)
          .eq("platform", platform);

        if (error) {
          throw error;
        }

        setFormData((prev) => {
          const newTags = { ...prev.hiddenTags };
          delete newTags[platform];
          return {
            ...prev,
            games: prev.games.filter((g) => g !== platform),
            hiddenTags: newTags,
          };
        });
        setOriginalData((prev) => {
          if (!prev) {
            return prev;
          }
          const newTags = { ...prev.hiddenTags };
          delete newTags[platform];
          return {
            ...prev,
            games: prev.games.filter((g) => g !== platform),
            hiddenTags: newTags,
          };
        });

        setStats((prev) => ({
          ...prev,
          gamesCount: Math.max(0, prev.gamesCount - 1),
        }));
        toast.success(`${platform} הוסר בהצלחה`);
      } catch (error: unknown) {
        toast.error("שגיאה בהסרת המשחק", {
          description: getErrorMessage(error),
        });
      }
    },
    [userId, supabase]
  );

  return {
    userId,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    formData,
    avatarSeed,
    stats,
    setAvatarSeed,
    updateFormData,
    handleSave,
    addGamertag,
    removeGamertag,
    userEmail: user?.email || null,
  };
}
