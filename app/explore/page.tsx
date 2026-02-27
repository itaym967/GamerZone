"use client";
import {
  FilterIcon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useFriendship } from "@/hooks/useFriendship";
import { useSwapStatus } from "@/hooks/useSwapStatus";
import GamerCard from "../components/GamerCard";
import Navigation from "../components/Navigation";

const FILTERS = {
  games: [
    "All",
    "Valorant",
    "Minecraft",
    "Fortnite",
    "Apex Legends",
    "CS2",
    "FIFA 24",
    "Call of Duty",
    "League of Legends",
    "Overwatch 2",
    "GTA V",
    "Rocket League",
    "Roblox",
    "PubG Mobile",
  ],
};

export default function ExplorePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGame, setActiveGame] = useState("All");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [friendsOnly, setFriendsOnly] = useState(false);

  const currentUserId = useMemo(() => user?.id || null, [user?.id]);

  // Use cached dashboard data (shared with home page)
  const { gamers, loading } = useDashboardData(currentUserId, authLoading);

  // Use centralized swap status management
  const { fetchSwapStatuses, updateSwapStatus, getSwapStatus } =
    useSwapStatus(currentUserId);

  // Friend system
  const { getFriendshipStatus, sendRequest, isFriend } =
    useFriendship(currentUserId);

  const handleSendFriendRequest = async (targetId: string) => {
    const { error } = await sendRequest(targetId);
    if (error) {
      toast.error(error);
    } else {
      toast.success("בקשת חברות נשלחה!");
    }
  };

  // Fetch swap statuses when gamers are loaded
  useEffect(() => {
    if (gamers.length > 0 && currentUserId) {
      const userIds = gamers.map((g) => g.id);
      fetchSwapStatuses(userIds);
    }
  }, [gamers, currentUserId, fetchSwapStatuses]);

  const filteredGamers = useMemo(() => {
    return gamers.filter((gamer) => {
      const matchesSearch =
        (gamer.username?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (gamer.tag?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesGame =
        activeGame === "All" || gamer.games?.includes(activeGame);
      const matchesOnline = !onlineOnly || gamer.online;
      const matchesFriends = !friendsOnly || isFriend(gamer.id);

      return matchesSearch && matchesGame && matchesOnline && matchesFriends;
    });
  }, [gamers, searchTerm, activeGame, onlineOnly, friendsOnly, isFriend]);

  return (
    <div className="min-h-screen bg-[#050510] pb-24 transition-all md:pr-64 md:pb-0">
      <Navigation />

      <main className="mx-auto max-w-7xl p-6">
        <header className="mb-8">
          <h1 className="mb-2 flex items-center gap-3 font-bold text-3xl text-white">
            <HugeiconsIcon
              className="text-primary"
              icon={Search01Icon}
              size={32}
            />
            <span>גלה שחקנים</span>
          </h1>
          <p className="text-gray-400">מצא את השותפים המושלמים למשחק הבא שלך</p>
        </header>

        {/* Search & Filter Bar */}
        <div className="sticky top-4 z-30 mb-8 flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#0e0e1b] bg-opacity-90 p-4 shadow-xl backdrop-blur-md xl:flex-row">
          <div className="relative flex-1">
            <input
              className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-10 py-3 text-right text-white outline-none transition-all focus:border-primary/50 focus:bg-white/5"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש לפי שם או תיוג..."
              type="text"
              value={searchTerm}
            />
            <HugeiconsIcon
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
              icon={Search01Icon}
              size={20}
            />
          </div>

          <div className="no-scrollbar flex flex-wrap items-center gap-2 overflow-x-auto pb-2 xl:pb-0">
            {/* Online Only Toggle */}
            <button
              className={`flex h-12 items-center gap-2 rounded-xl border px-4 transition-all ${
                onlineOnly
                  ? "border-primary bg-primary/20 font-bold text-primary"
                  : "border-white/10 bg-black/20 text-gray-400 hover:text-white"
              }`}
              onClick={() => setOnlineOnly(!onlineOnly)}
            >
              <span
                className={`h-2 w-2 rounded-full ${onlineOnly ? "animate-pulse bg-primary" : "bg-gray-500"}`}
              />
              <span className="whitespace-nowrap">מחוברים בלבד</span>
            </button>

            {/* Friends Only Toggle */}
            {currentUserId && (
              <button
                className={`flex h-12 items-center gap-2 rounded-xl border px-4 transition-all ${
                  friendsOnly
                    ? "border-green-500 bg-green-500/20 font-bold text-green-400"
                    : "border-white/10 bg-black/20 text-gray-400 hover:text-white"
                }`}
                onClick={() => setFriendsOnly(!friendsOnly)}
              >
                <HugeiconsIcon icon={UserGroupIcon} size={16} />
                <span className="whitespace-nowrap">חברים בלבד</span>
              </button>
            )}

            {/* Game Select */}
            <div className="relative min-w-[160px]">
              <select
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-4 text-right text-white outline-none transition-colors hover:bg-white/5 focus:border-primary/50"
                onChange={(e) => setActiveGame(e.target.value)}
                value={activeGame}
              >
                {FILTERS.games.map((game) => (
                  <option
                    className="bg-[#0e0e1b] text-white"
                    key={game}
                    value={game}
                  >
                    {game === "All" ? "כל המשחקים" : game}
                  </option>
                ))}
              </select>
              <HugeiconsIcon
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                icon={FilterIcon}
                size={16}
              />
            </div>
          </div>
        </div>

        {/* Gamers Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          </div>
        ) : (
          <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGamers.map((gamer) => (
              <GamerCard
                key={gamer.id}
                {...gamer}
                currentUserId={currentUserId}
                friendshipStatus={getFriendshipStatus(gamer.id).status}
                initialSwapStatus={getSwapStatus(gamer.id)}
                onSendFriendRequest={handleSendFriendRequest}
                onSwapStatusChange={updateSwapStatus}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredGamers.length === 0 && (
          <div className="py-20 text-center opacity-50">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
              <HugeiconsIcon
                className="text-white"
                icon={Search01Icon}
                size={40}
              />
            </div>
            <h3 className="mb-2 font-bold text-white text-xl">
              לא נמצאו תוצאות
            </h3>
            <p className="text-gray-400">נסה לשנות את הסינון או לחפש שם אחר.</p>
            <button
              className="mt-4 font-bold text-primary hover:underline"
              onClick={() => {
                setActiveGame("All");
                setSearchTerm("");
              }}
            >
              נקה סינון
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
