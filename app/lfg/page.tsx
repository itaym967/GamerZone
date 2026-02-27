"use client";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import Navigation from "../components/Navigation";
import LFGCard from "./components/lfg-card";

type PostWithProfile = Database["public"]["Tables"]["lfg_posts"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
};
interface LfgInsertPayload {
  game: string | null;
  id: string;
}

const GAMES = [
  "Fortnite",
  "Call of Duty",
  "FIFA",
  "Valorant",
  "Minecraft",
  "Roblox",
  "Apex Legends",
  "Overwatch 2",
];

export default function LFGPage() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();
  const _router = useRouter();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("lfg_posts")
      .select(`
        *,
        profiles (
          id,
          username,
          avatar_url,
          is_banned
        )
      `)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (selectedGame) {
      query = query.eq("game", selectedGame);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data as PostWithProfile[]);
    }
    setLoading(false);
  }, [selectedGame, supabase]);

  useEffect(() => {
    fetchPosts();

    // Only subscribe if page is visible
    if (!document.hidden) {
      // Real-time Subscription with game filter
      const channel = supabase
        .channel("lfg_realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "lfg_posts",
            // Filter by selected game to reduce realtime load
            filter: selectedGame ? `game=eq.${selectedGame}` : undefined,
          },
          async (payload) => {
            const newPost = payload.new as LfgInsertPayload;
            // Double-check game filter (defense in depth)
            if (!selectedGame || newPost.game === selectedGame) {
              // Fetch the full post with profile to prepend
              const { data, error } = await supabase
                .from("lfg_posts")
                .select(`
                            *,
                            profiles (
                            id,
                            username,
                            avatar_url,
                            is_banned
                            )
                        `)
                .eq("id", newPost.id)
                .single();

              if (data && !error) {
                setPosts((prev) => [data as PostWithProfile, ...prev]);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedGame, fetchPosts, supabase]);

  // Pause subscription when tab is hidden to reduce database load
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Remove all channels when tab is hidden
        supabase.removeAllChannels();
      } else {
        // Re-fetch when tab becomes visible
        fetchPosts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchPosts, supabase]);

  let feedContent: React.ReactNode;
  if (loading) {
    feedContent = (
      <div className="auto-grid animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div className="h-40 rounded-2xl bg-white/5" key={i} />
        ))}
      </div>
    );
  } else if (posts.length === 0) {
    feedContent = (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <HugeiconsIcon
            className="text-white/40"
            icon={Search01Icon}
            size={32}
          />
        </div>
        <h3 className="font-semibold text-fluid-lg text-white">
          אין מודעות פעילות
        </h3>
        <p className="mx-auto mt-1 max-w-xs text-fluid-sm text-white/40">
          היה הראשון לחפש קבוצה בקטגוריה זו!
        </p>
      </div>
    );
  } else {
    feedContent = (
      <div className="auto-grid">
        {posts.map((post) => (
          <LFGCard currentUserId={user?.id || null} key={post.id} post={post} />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pr-64 md:pb-0">
      <Navigation />

      {/* Header */}
      <div className="sticky top-0 z-20 border-white/5 border-b bg-[#0a0a0a]/80 py-fluid-md backdrop-blur-xl">
        <div className="max-w-4xl content-shell">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-bold text-fluid-xl text-white">
              לוח חיפוש שחקנים
            </h1>
            <Link
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-fluid-sm text-white shadow-blue-600/20 shadow-lg transition-all hover:bg-blue-500 active:scale-95"
              href="/lfg/create"
            >
              <HugeiconsIcon icon={Add01Icon} size={18} />
              <span className="hidden sm:inline">פרסם מודעה</span>
              <span className="sm:hidden">פרסם</span>
            </Link>
          </div>

          {/* Game Filter */}
          <div className="no-scrollbar bleed-fluid flex gap-2 overflow-x-auto pb-2">
            <button
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 font-medium text-fluid-sm transition-all ${selectedGame ? "border-white/10 bg-white/5 text-white/60 hover:bg-white/10" : "border-white bg-white text-black"}`}
              onClick={() => setSelectedGame(null)}
              type="button"
            >
              כל המשחקים
            </button>
            {GAMES.map((game) => (
              <button
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 font-medium text-fluid-sm transition-all ${selectedGame === game ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}
                key={game}
                onClick={() => setSelectedGame(game)}
                type="button"
              >
                {game}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-4xl pt-6 content-shell">{feedContent}</div>
    </div>
  );
}
