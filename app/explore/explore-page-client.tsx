"use client";
import {
  FilterIcon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useFriendship } from "@/hooks/use-friendship";
import { useSwapStatus } from "@/hooks/use-swap-status";
import { getAutoMatchInsights } from "@/lib/auto-match";
import GamerCard from "../components/gamer-card";
import Navigation from "../components/navigation";

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
  const [sortMode, setSortMode] = useState<"match" | "online" | "alphabetic">(
    "match"
  );
  const [minimumMatch, setMinimumMatch] = useState(0);

  const currentUserId = user?.id || null;

  // Use cached dashboard data (shared with home page)
  const { gamers, loading, currentUserPreferences } = useDashboardData(
    currentUserId,
    authLoading
  );

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
    const rankedGamers = gamers.map((gamer) => {
      const insights = getAutoMatchInsights({
        currentAvailability: currentUserPreferences?.availability ?? null,
        currentGames: currentUserPreferences?.games ?? [],
        gamerAvailability: gamer.availabilityTimezone
          ? {
              slots: gamer.availabilitySlots,
              timezone: gamer.availabilityTimezone,
            }
          : null,
        gamerGames: gamer.games,
        online: gamer.online,
        isFriend: isFriend(gamer.id),
      });
      return {
        gamer,
        matchConfidence: insights.confidence,
        matchReasons: insights.reasons.slice(0, 3),
        score: insights.score,
      };
    });

    const visibleGamers = rankedGamers.filter(({ gamer, matchConfidence }) => {
      const matchesSearch =
        (gamer.username?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (gamer.tag?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesGame =
        activeGame === "All" || gamer.games?.includes(activeGame);
      const matchesOnline = !onlineOnly || gamer.online;
      const matchesFriends = !friendsOnly || isFriend(gamer.id);
      const matchesThreshold = matchConfidence >= minimumMatch;

      return (
        matchesSearch &&
        matchesGame &&
        matchesOnline &&
        matchesFriends &&
        matchesThreshold
      );
    });

    if (sortMode === "online") {
      return visibleGamers.sort((left, right) => {
        if (left.gamer.online !== right.gamer.online) {
          return left.gamer.online ? -1 : 1;
        }
        if (right.matchConfidence !== left.matchConfidence) {
          return right.matchConfidence - left.matchConfidence;
        }
        return left.gamer.username.localeCompare(right.gamer.username);
      });
    }

    if (sortMode === "alphabetic") {
      return visibleGamers.sort((left, right) =>
        left.gamer.username.localeCompare(right.gamer.username)
      );
    }

    return visibleGamers.sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (right.matchConfidence !== left.matchConfidence) {
        return right.matchConfidence - left.matchConfidence;
      }
      return left.gamer.username.localeCompare(right.gamer.username);
    });
  }, [
    gamers,
    searchTerm,
    activeGame,
    onlineOnly,
    friendsOnly,
    minimumMatch,
    sortMode,
    isFriend,
    currentUserPreferences,
  ]);

  const strongMatchesCount = filteredGamers.filter(
    (entry) => entry.matchConfidence >= 75
  ).length;

  return (
    <div className="min-h-screen bg-primary-foreground pb-24 transition-all md:pr-64 md:pb-0">
      <Navigation />

      <main className="fluid-container stack-fluid p-fluid-lg">
        <header className="mb-8">
          <h1 className="mb-2 flex items-center gap-3 font-bold text-fluid-2xl text-white">
            <HugeiconsIcon
              className="text-primary"
              icon={Search01Icon}
              size={32}
            />
            <span>גלה שחקנים</span>
          </h1>
          <p className="text-fluid-base text-gray-400">
            מצא את השותפים המושלמים למשחק הבא שלך
          </p>
        </header>

        {/* Search & Filter Bar */}
        <div className="sticky top-4 z-30 mb-8 flex flex-col gap-fluid rounded-2xl border border-white/5 bg-card/90 p-fluid-md shadow-xl backdrop-blur-md xl:flex-row">
          <div className="relative flex-1">
            <input
              className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-10 py-3 text-right text-white outline-hidden transition-all focus:border-primary/50 focus:bg-white/5"
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
              type="button"
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
                type="button"
              >
                <HugeiconsIcon icon={UserGroupIcon} size={16} />
                <span className="whitespace-nowrap">חברים בלבד</span>
              </button>
            )}

            {/* Game Select */}
            <div className="relative min-w-40">
              <select
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-4 text-right text-white outline-hidden transition-colors hover:bg-white/5 focus:border-primary/50"
                onChange={(e) => setActiveGame(e.target.value)}
                value={activeGame}
              >
                {FILTERS.games.map((game) => (
                  <option
                    className="bg-card text-white"
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

            <div className="relative min-w-40">
              <select
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-4 text-right text-white outline-hidden transition-colors hover:bg-white/5 focus:border-primary/50"
                onChange={(e) =>
                  setSortMode(
                    e.target.value as "match" | "online" | "alphabetic"
                  )
                }
                value={sortMode}
              >
                <option className="bg-card text-white" value="match">
                  התאמה חכמה
                </option>
                <option className="bg-card text-white" value="online">
                  מחוברים קודם
                </option>
                <option className="bg-card text-white" value="alphabetic">
                  א-ב
                </option>
              </select>
              <HugeiconsIcon
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                icon={UserGroupIcon}
                size={16}
              />
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-white/5 bg-card/70 p-fluid-md">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium text-gray-300 text-sm">
              סף התאמה מינימלי
            </p>
            <p className="font-bold text-primary text-sm">{minimumMatch}%+</p>
          </div>
          <input
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
            max={100}
            min={0}
            onChange={(event) => setMinimumMatch(Number(event.target.value))}
            step={5}
            type="range"
            value={minimumMatch}
          />
          <p className="mt-3 text-gray-400 text-xs">
            נמצאו {filteredGamers.length} שחקנים, מתוכם {strongMatchesCount}{" "}
            התאמות חזקות (75%+)
          </p>
        </div>

        {/* Gamers Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          </div>
        ) : (
          <div className="auto-grid auto-rows-fr">
            {filteredGamers.map((gamer) => (
              <GamerCard
                key={gamer.gamer.id}
                {...gamer.gamer}
                currentUserId={currentUserId}
                friendshipStatus={getFriendshipStatus(gamer.gamer.id).status}
                initialSwapStatus={getSwapStatus(gamer.gamer.id)}
                matchConfidence={gamer.matchConfidence}
                matchReasons={gamer.matchReasons}
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
            <h3 className="mb-2 font-bold text-fluid-xl text-white">
              לא נמצאו תוצאות
            </h3>
            <p className="text-fluid-base text-gray-400">
              נסה לשנות את הסינון או לחפש שם אחר.
            </p>
            <button
              className="mt-4 font-bold text-primary hover:underline"
              onClick={() => {
                setActiveGame("All");
                setSearchTerm("");
                setOnlineOnly(false);
                setFriendsOnly(false);
                setMinimumMatch(0);
                setSortMode("match");
              }}
              type="button"
            >
              נקה סינון
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
