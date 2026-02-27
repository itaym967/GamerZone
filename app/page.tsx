"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useFriendship } from "@/hooks/useFriendship";
import { useSwapStatus } from "@/hooks/useSwapStatus";
import GamerCard from "./components/GamerCard";
import Navigation from "./components/Navigation";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import { GamerCardSkeleton } from "./components/Skeleton";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();

  const currentUserId = useMemo(() => user?.id || null, [user?.id]);
  const isLoggedIn = useMemo(() => !!user, [user]);

  // Use cached dashboard data
  const { gamers, loading, currentUsername } = useDashboardData(
    currentUserId,
    authLoading
  );

  // Use centralized swap status management
  const { fetchSwapStatuses, updateSwapStatus, getSwapStatus } =
    useSwapStatus(currentUserId);

  // Friend system
  const { getFriendshipStatus, sendRequest } = useFriendship(currentUserId);

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

  return (
    <div className="min-h-screen pb-24 transition-all md:pr-64 md:pb-0">
      <ServiceWorkerRegistration />
      <Navigation />

      <main className="mx-auto max-w-7xl space-y-8 p-6">
        {/* Header Section */}
        <header className="mt-8 flex flex-col justify-between gap-4 md:mt-0 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 bg-gradient-to-l from-primary to-white bg-clip-text font-bold text-3xl text-transparent md:text-4xl">
              שלום, {currentUsername || "אורח"} 👋
            </h1>
            <p className="text-gray-400">מוכן למצוא את הסקוואד הבא שלך?</p>
          </div>

          {/* Search bar removed as per request - search is now only in Explore page */}
        </header>

        {/* Categories / Filters */}
        <div className="scrollbar-none flex gap-3 overflow-x-auto pb-2">
          {["הכל", "פופולרי עכשיו", "תחרותי", "קז'ואל", "חדשים"].map(
            (filter, i) => (
              <button
                className={`whitespace-nowrap rounded-full px-4 py-2 font-medium text-sm transition-all ${i === 0 ? "bg-primary font-bold text-black" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}
                key={i}
              >
                {filter}
              </button>
            )
          )}
        </div>

        {/* Grid of Cards */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-white text-xl">
              <span className="block h-6 w-1 rounded-full bg-secondary" />
              שחקנים מומלצים עבורך
            </h2>
            <button className="font-medium text-primary text-sm hover:underline">
              הצג הכל
            </button>
          </div>

          {loading ? (
            <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <GamerCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gamers.length > 0 ? (
                gamers.map((gamer) => (
                  <GamerCard
                    key={gamer.id}
                    {...gamer}
                    currentUserId={currentUserId}
                    friendshipStatus={getFriendshipStatus(gamer.id).status}
                    initialSwapStatus={getSwapStatus(gamer.id)}
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
          <section className="group relative mt-8 overflow-hidden rounded-2xl border border-white/10 p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-secondary/20 to-primary/10 backdrop-blur-3xl transition-opacity group-hover:opacity-80" />
            <div className="relative z-20 flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-right">
              <div>
                <h3 className="mb-2 font-bold text-2xl text-white">
                  רוצה שכולם יראו אותך?
                </h3>
                <p className="text-gray-300">
                  צור את כרטיס השחקן שלך והתחל לקבל בקשות החלפה!
                </p>
              </div>
              <Link
                className="relative z-[100] block cursor-pointer whitespace-nowrap rounded-xl bg-white px-6 py-3 font-bold text-black shadow-lg shadow-white/10 transition-colors hover:bg-gray-200"
                href="/signup"
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
