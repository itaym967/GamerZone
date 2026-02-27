"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { ProfileFormData, ProfileStats } from "../types";

export function useProfileData() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const userId = useMemo(() => user?.id || null, [user?.id]);

  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    tag: "",
    bio: "",
    games: [],
    hiddenTags: {},
  });

  const [originalData, setOriginalData] = useState<ProfileFormData | null>(
    null
  );
  const [avatarSeed, setAvatarSeed] = useState("/avatars/samurai.png");
  const [originalAvatar, setOriginalAvatar] = useState("/avatars/samurai.png");

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

    const fetchAll = async () => {
      try {
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
            .from("friendships")
            .select("id", { count: "exact", head: true })
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .eq("status", "accepted"),
        ]);

        if (profileRes.error) {
          throw profileRes.error;
        }
        if (tagsRes.error) {
          throw tagsRes.error;
        }

        const profile = profileRes.data;
        const tags = tagsRes.data || [];

        const hiddenTagsMap: { [key: string]: string } = {};
        tags.forEach((t: any) => {
          hiddenTagsMap[t.platform] = t.tag;
        });
        const gamesList = Object.keys(hiddenTagsMap);

        const newFormData: ProfileFormData = {
          username: profile.username || "",
          tag: `@${(profile.username || "user").toLowerCase()}`,
          bio: profile.bio || "",
          games: gamesList,
          hiddenTags: hiddenTagsMap,
        };

        setFormData(newFormData);
        setOriginalData(newFormData);

        if (profile.avatar_url) {
          setAvatarSeed(profile.avatar_url);
          setOriginalAvatar(profile.avatar_url);
        }

        setStats({
          swapsSent: swapsSentRes.count || 0,
          swapsReceived: swapsReceivedRes.count || 0,
          swapsApproved: swapsApprovedRes.count || 0,
          friendsCount: friendsRes.count || 0,
          gamesCount: gamesList.length,
          memberSince: profile.updated_at || null,
        });
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("שגיאה בטעינת הפרופיל");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
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
    } catch (error: any) {
      toast.error("שגיאה בשמירה", { description: error.message });
    } finally {
      setIsSaving(false);
    }
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
      } catch (error: any) {
        toast.error("שגיאה בהוספת המשחק", { description: error.message });
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
      } catch (error: any) {
        toast.error("שגיאה בהסרת המשחק", { description: error.message });
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
