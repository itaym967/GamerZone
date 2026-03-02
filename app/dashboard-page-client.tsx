"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useFriendship } from "@/hooks/use-friendship";
import { useSwapStatus } from "@/hooks/use-swap-status";
import { getAutoMatchInsights } from "@/lib/auto-match";
import GamerCard from "./components/gamer-card";
import Navigation from "./components/navigation";
import ServiceWorkerRegistration from "./components/service-worker-registration";
import { GamerCardSkeleton } from "./components/skeleton";

const DASHBOARD_FILTERS = ["הכל", "פופולרי עכשיו", "תחרותי", "קז'ואל", "חדשים"];
const DASHBOARD_SKELETON_KEYS = [
  "sk-1",
  "sk-2",
  "sk-3",
  "sk-4",
  "sk-5",
  "sk-6",
  "sk-7",
  "sk-8",
];

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();

  const currentUserId = user?.id || null;
  const isLoggedIn = !!user;

  // Use cached dashboard data
  const { gamers, loading, currentUsername, currentUserPreferences } =
    useDashboardData(currentUserId, authLoading);

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

  const sortedGamers = useMemo(() => {
    const gamersWithInsights = gamers.map((gamer) => {
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

    return gamersWithInsights.sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (right.matchConfidence !== left.matchConfidence) {
        return right.matchConfidence - left.matchConfidence;
      }
      return left.gamer.username.localeCompare(right.gamer.username);
    });
  }, [gamers, currentUserPreferences, isFriend]);

  return (
    <div className="min-h-screen pb-24 transition-all md:pr-64 md:pb-0">
      <ServiceWorkerRegistration />
      <Navigation />

      <main className="fluid-container stack-fluid p-fluid-lg">
        {/* Header Section */}
        <header className="mt-8 flex flex-col justify-between gap-4 md:mt-0 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 bg-linear-to-l from-primary to-white bg-clip-text font-bold text-fluid-2xl text-transparent">
              שלום, {currentUsername || "אורח"} 👋
            </h1>
            <p className="text-fluid-base text-gray-400">
              מוכן למצוא את הסקוואד הבא שלך?
            </p>
          </div>

          {/* Search bar removed as per request - search is now only in Explore page */}
        </header>

        {/* Categories / Filters */}
        <div className="scrollbar-none flex gap-3 overflow-x-auto pb-2">
          {DASHBOARD_FILTERS.map((filter) => (
            <button
              className={`whitespace-nowrap rounded-full px-4 py-2 font-medium text-fluid-sm transition-all ${filter === "הכל" ? "bg-primary font-bold text-black" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}
              key={filter}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Grid of Cards */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-fluid-xl text-white">
              <span className="block h-6 w-1 rounded-full bg-secondary" />
              שחקנים מומלצים עבורך
            </h2>
            <button
              className="font-medium text-fluid-sm text-primary hover:underline"
              type="button"
            >
              הצג הכל
            </button>
          </div>

          {loading ? (
            <div className="auto-grid auto-rows-fr">
              {DASHBOARD_SKELETON_KEYS.map((skeletonKey) => (
                <GamerCardSkeleton key={skeletonKey} />
              ))}
            </div>
          ) : (
            <div className="auto-grid auto-rows-fr">
              {gamers.length > 0 ? (
                sortedGamers.map(({ gamer, matchConfidence, matchReasons }) => (
                  <GamerCard
                    key={gamer.id}
                    {...gamer}
                    currentUserId={currentUserId}
                    friendshipStatus={getFriendshipStatus(gamer.id).status}
                    initialSwapStatus={getSwapStatus(gamer.id)}
                    matchConfidence={matchConfidence}
                    matchReasons={matchReasons}
                    onSendFriendRequest={handleSendFriendRequest}
                    onSwapStatusChange={updateSwapStatus}
                  />
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-gray-400">
                  עדיין אין שחקנים רשומים. הייה הראשון להירשם!
                </div>
              )}
            </div>
          )}
        </section>

        {/* Call to Action Banner - Only for guests */}
        {!(isLoggedIn || loading) && (
          <section className="group relative mt-8 overflow-hidden rounded-2xl border border-white/10 p-5 md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-secondary/20 to-primary/10 backdrop-blur-3xl transition-opacity group-hover:opacity-80" />
            <div className="relative z-20 flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-right">
              <div>
                <h3 className="mb-2 font-bold text-fluid-xl text-white">
                  רוצה שכולם יראו אותך?
                </h3>
                <p className="text-gray-300">
                  צור את כרטיס השחקן שלך והתחל לקבל בקשות החלפה!
                </p>
              </div>
              <Link
                className="relative z-100 block w-full cursor-pointer whitespace-nowrap rounded-xl bg-white px-6 py-3 text-center font-bold text-black shadow-lg shadow-white/10 transition-colors hover:bg-gray-200 md:w-auto"
                href="/signup"
                prefetch={false}
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
