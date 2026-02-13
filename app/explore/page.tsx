"use client";

import { useEffect, useState, useMemo } from "react";
import Navigation from "../components/Navigation";
import GamerCard from "../components/GamerCard";
import { Search, Filter, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSwapStatus } from "@/hooks/useSwapStatus";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useFriendship } from "@/hooks/useFriendship";
import { toast } from "sonner";

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
        "PubG Mobile"
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
    const { fetchSwapStatuses, updateSwapStatus, getSwapStatus } = useSwapStatus(currentUserId);

    // Friend system
    const { getFriendshipStatus, sendRequest, isFriend } = useFriendship(currentUserId);

    const handleSendFriendRequest = async (targetId: string) => {
        const { error } = await sendRequest(targetId);
        if (error) toast.error(error);
        else toast.success('בקשת חברות נשלחה!');
    };

    // Fetch swap statuses when gamers are loaded
    useEffect(() => {
        if (gamers.length > 0 && currentUserId) {
            const userIds = gamers.map(g => g.id);
            fetchSwapStatuses(userIds);
        }
    }, [gamers, currentUserId, fetchSwapStatuses]);

    const filteredGamers = useMemo(() => {
        return gamers.filter((gamer) => {
            const matchesSearch = (gamer.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (gamer.tag?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesGame = activeGame === "All" || gamer.games?.includes(activeGame);
            const matchesOnline = !onlineOnly || gamer.online;
            const matchesFriends = !friendsOnly || isFriend(gamer.id);

            return matchesSearch && matchesGame && matchesOnline && matchesFriends;
        });
    }, [gamers, searchTerm, activeGame, onlineOnly, friendsOnly, isFriend]);

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64 transition-all bg-[#050510]">
            <Navigation />

            <main className="p-6 max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Search className="text-primary" size={32} />
                        <span>גלה שחקנים</span>
                    </h1>
                    <p className="text-gray-400">מצא את השותפים המושלמים למשחק הבא שלך</p>
                </header>

                {/* Search & Filter Bar */}
                <div className="flex flex-col xl:flex-row gap-4 mb-8 bg-[#0e0e1b] p-4 rounded-2xl border border-white/5 sticky top-4 z-30 shadow-xl backdrop-blur-md bg-opacity-90">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="חפש לפי שם או תיוג..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-white outline-none focus:border-primary/50 text-right h-12 transition-all focus:bg-white/5"
                        />
                        <Search size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 xl:pb-0 no-scrollbar items-center">
                        {/* Online Only Toggle */}
                        <button
                            onClick={() => setOnlineOnly(!onlineOnly)}
                            className={`h-12 px-4 rounded-xl border flex items-center gap-2 transition-all ${onlineOnly
                                ? "bg-primary/20 border-primary text-primary font-bold"
                                : "bg-black/20 border-white/10 text-gray-400 hover:text-white"
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${onlineOnly ? "bg-primary animate-pulse" : "bg-gray-500"}`} />
                            <span className="whitespace-nowrap">מחוברים בלבד</span>
                        </button>

                        {/* Friends Only Toggle */}
                        {currentUserId && (
                            <button
                                onClick={() => setFriendsOnly(!friendsOnly)}
                                className={`h-12 px-4 rounded-xl border flex items-center gap-2 transition-all ${friendsOnly
                                    ? "bg-green-500/20 border-green-500 text-green-400 font-bold"
                                    : "bg-black/20 border-white/10 text-gray-400 hover:text-white"
                                    }`}
                            >
                                <Users size={16} />
                                <span className="whitespace-nowrap">חברים בלבד</span>
                            </button>
                        )}

                        {/* Game Select */}
                        <div className="relative min-w-[160px]">
                            <select
                                value={activeGame}
                                onChange={(e) => setActiveGame(e.target.value)}
                                className="w-full h-12 appearance-none bg-black/20 border border-white/10 rounded-xl px-4 text-white outline-none focus:border-primary/50 text-right cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                {FILTERS.games.map(game => <option key={game} value={game} className="bg-[#0e0e1b] text-white">{game === 'All' ? 'כל המשחקים' : game}</option>)}
                            </select>
                            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Gamers Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                        {filteredGamers.map((gamer) => (
                            <GamerCard
                                key={gamer.id}
                                {...gamer}
                                currentUserId={currentUserId}
                                initialSwapStatus={getSwapStatus(gamer.id)}
                                onSwapStatusChange={updateSwapStatus}
                                friendshipStatus={getFriendshipStatus(gamer.id).status}
                                onSendFriendRequest={handleSendFriendRequest}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredGamers.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={40} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">לא נמצאו תוצאות</h3>
                        <p className="text-gray-400">נסה לשנות את הסינון או לחפש שם אחר.</p>
                        <button
                            onClick={() => { setActiveGame("All"); setSearchTerm("") }}
                            className="mt-4 text-primary font-bold hover:underline"
                        >
                            נקה סינון
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
