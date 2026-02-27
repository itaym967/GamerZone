"use client";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/utils/supabase/types";
import Navigation from "../components/Navigation";
import LFGCard from "./components/LFGCard";

type PostWithProfile = Database["public"]["Tables"]["lfg_posts"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

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

  const fetchPosts = async () => {
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
  };

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
            // Double-check game filter (defense in depth)
            if (!selectedGame || (payload.new as any).game === selectedGame) {
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
                .eq("id", (payload.new as any).id)
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
  }, [
    selectedGame,
    fetchPosts,
    supabase.from,
    supabase.channel,
    supabase.removeChannel,
  ]);

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
  }, [
    // Re-fetch when tab becomes visible
    fetchPosts, // Remove all channels when tab is hidden
    supabase.removeAllChannels,
  ]);

  return (
    <div className="min-h-screen pb-24 md:pr-64 md:pb-0">
      <Navigation />

      {/* Header */}
      <div className="sticky top-0 z-20 border-white/5 border-b bg-[#0a0a0a]/80 px-4 pt-4 pb-4 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-bold text-2xl text-white">לוח חיפוש שחקנים</h1>
            <Link href="/lfg/create">
              <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-sm text-white shadow-blue-600/20 shadow-lg transition-all hover:bg-blue-500 active:scale-95">
                <HugeiconsIcon icon={Add01Icon} size={18} />
                <span className="hidden sm:inline">פרסם מודעה</span>
                <span className="sm:hidden">פרסם</span>
              </button>
            </Link>
          </div>

          {/* Game Filter */}
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            <button
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 font-medium text-sm transition-all ${selectedGame ? "border-white/10 bg-white/5 text-white/60 hover:bg-white/10" : "border-white bg-white text-black"}`}
              onClick={() => setSelectedGame(null)}
            >
              כל המשחקים
            </button>
            {GAMES.map((game) => (
              <button
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 font-medium text-sm transition-all ${selectedGame === game ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}
                key={game}
                onClick={() => setSelectedGame(game)}
              >
                {game}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="mx-auto max-w-4xl px-4 pt-6">
        {loading ? (
          <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div className="h-40 rounded-2xl bg-white/5" key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <HugeiconsIcon
                className="text-white/40"
                icon={Search01Icon}
                size={32}
              />
            </div>
            <h3 className="font-semibold text-lg text-white">
              אין מודעות פעילות
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-white/40">
              היה הראשון לחפש קבוצה בקטגוריה זו!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <LFGCard
                currentUserId={user?.id || null}
                key={post.id}
                post={post}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
