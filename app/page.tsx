"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import GamerCard from "./components/GamerCard";
import Navigation from "./components/Navigation";
import Link from "next/link";

import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Gamer {
  id: string;
  username: string;
  tag: string;
  games: string[];
  bio: string;
  online: boolean;
  hiddenTags: { [key: string]: string };
  avatarSeed?: string;
}

export default function Dashboard() {
  const [gamers, setGamers] = useState<Gamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchGamers() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);

        // Fetch securely via RPC to handle hidden tags mapping
        const { data, error } = await supabase.rpc('get_dashboard_data');

        if (error) throw error;

        if (data) {
          const profiles = data as any[];

          // Filter out current user
          const currentUserProfile = profiles.find(p => p.id === user?.id);
          if (currentUserProfile) {
            setCurrentUsername(currentUserProfile.username);
          }

          const formattedGamers: Gamer[] = profiles
            .filter((profile: any) => profile.id !== user?.id) // Filter out self
            .map((profile: any) => {
              const tags = profile.gamertags || [];

              const hiddenTagsMap: { [key: string]: string } = {};
              const gamesList: string[] = [];

              tags.forEach((t: any) => {
                gamesList.push(t.platform);
                if (t.is_hidden) {
                  hiddenTagsMap[t.platform] = "********";
                }
              });

              return {
                id: profile.id,
                username: profile.username || "Unknown",
                tag: "@" + (profile.username || "user").toLowerCase(),
                games: gamesList,
                bio: profile.bio || "",
                online: profile.is_online || false,
                hiddenTags: hiddenTagsMap,
                avatarSeed: profile.avatar_url
              };
            });

          setGamers(formattedGamers);
        }
      } catch (err: any) {
        console.error("Error fetching gamers:", err);
        toast.error("שגיאה בטעינת שחקנים");
      } finally {
        setLoading(false);
      }
    }

    fetchGamers();
  }, []);

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pr-64 transition-all">
      <Navigation />

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8 md:mt-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-primary to-white mb-2">
              שלום, {currentUsername || "אורח"} 👋
            </h1>
            <p className="text-gray-400">מוכן למצוא את הסקוואד הבא שלך?</p>
          </div>

          <div className="flex gap-3">
            <div className="w-full md:w-64 px-4 py-2 rounded-xl flex items-center border border-white/5 bg-[#0e0e1b] focus-within:border-primary/50 transition-colors">
              <input
                type="text"
                placeholder="חפש שחקנים..."
                className="bg-transparent w-full outline-none text-sm placeholder:text-gray-600 text-white"
              />
              <Search size={18} className="text-gray-500" />
            </div>
          </div>
        </header>

        {/* Categories / Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {["הכל", "פופולרי עכשיו", "תחרותי", "קז'ואל", "חדשים"].map((filter, i) => (
            <button key={i} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${i === 0 ? "bg-primary text-black font-bold" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}>
              {filter}
            </button>
          ))}
        </div>

        {/* Grid of Cards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-secondary rounded-full block"></span>
              שחקנים מומלצים עבורך
            </h2>
            <button className="text-primary text-sm hover:underline font-medium">הצג הכל</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
              {gamers.length > 0 ? (
                gamers.map((gamer) => (
                  <GamerCard key={gamer.id} {...gamer} />
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-gray-400">
                  עדיין אין שחקנים רשומים. הייה הראשון להירשם!
                </div>
              )}
            </div>
          )}
        </section>

        {/* Call to Action Banner - Only for guests */}
        {!isLoggedIn && !loading && (
          <section className="relative overflow-hidden rounded-2xl p-8 border border-white/10 mt-8 group">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-primary/10 backdrop-blur-3xl group-hover:opacity-80 transition-opacity pointer-events-none" />
            <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">רוצה שכולם יראו אותך?</h3>
                <p className="text-gray-300">צור את כרטיס השחקן שלך והתחל לקבל בקשות החלפה!</p>
              </div>
              <Link
                href="/signup"
                className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 whitespace-nowrap block cursor-pointer relative z-[100]"
              >
                צור כרטיס שחקן עכשיו
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
