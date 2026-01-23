"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";
import GamerCard from "../components/GamerCard";
import { Search, Filter, SlidersHorizontal, UserPlus } from "lucide-react";

// Mock Data for Discovery
const DISCOVERY_DATA = [
    { id: "1", username: "CyberSoldier", tag: "@cs_israel", games: ["Valorant", "CS2"], bio: "מחפש סקוואד רציני לראנקים בערב.", online: true, rank: "Diamond", style: "Competitive" },
    { id: "2", username: "NoaGamer", tag: "@noa_plays", games: ["Minecraft", "Roblox"], bio: "בונים עיר חדשה בשרת, כולם מוזמנים!", online: false, rank: "Casual", style: "Chill" },
    { id: "3", username: "ApexPredator", tag: "@apex_king", games: ["Apex Legends"], bio: "מ-Main Wraith מאז עונה 1.", online: true, rank: "Master", style: "Competitive" },
    { id: "4", username: "PixelArt", tag: "@pixel_m", games: ["Minecraft", "Stardew Valley"], bio: "אוהב משחקי יצירה וניהול.", online: true, rank: "Casual", style: "Chill" },
    { id: "5", username: "TryHard99", tag: "@try_hard", games: ["Valorant", "League of Legends"], bio: "רוצה לעלות ל-Immo, רק רציניים.", online: false, rank: "Ascendant", style: "Hardcore" },
    { id: "6", username: "FortniteKid", tag: "@fort_build", games: ["Fortnite"], bio: "1v1 בניות? דבר איתי.", online: true, rank: "Gold", style: "Competitive" },
    { id: "7", username: "ChillGuy", tag: "@chill_dude", games: ["FIFA 24", "NBA 2K"], bio: "פיפא וצחוקים עם החבר'ה.", online: false, rank: "Casual", style: "Chill" },
    { id: "8", username: "StrategyMaster", tag: "@strat_god", games: ["TFT", "Hearthstone"], bio: "חשיבה אסטרטגית זה הדיבור.", online: true, rank: "Platinum", style: "Tactical" },
];

const FILTERS = {
    games: ["All", "Valorant", "Minecraft", "Fortnite", "Apex Legends", "CS2", "FIFA 24"],
    styles: ["All", "Competitive", "Chill", "Hardcore", "Tactical"],
};

export default function ExplorePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeGame, setActiveGame] = useState("All");
    const [activeStyle, setActiveStyle] = useState("All");

    const filteredGamers = DISCOVERY_DATA.filter((gamer) => {
        const matchesSearch = gamer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            gamer.tag.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGame = activeGame === "All" || gamer.games.includes(activeGame);
        const matchesStyle = activeStyle === "All" || gamer.style === activeStyle;

        return matchesSearch && matchesGame && matchesStyle;
    });

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
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-white outline-none focus:border-primary/50 text-right h-12"
                        />
                        <Search size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
                        {/* Style Select */}
                        <div className="relative min-w-[140px]">
                            <select
                                value={activeStyle}
                                onChange={(e) => setActiveStyle(e.target.value)}
                                className="w-full h-12 appearance-none bg-black/20 border border-white/10 rounded-xl px-4 text-white outline-none focus:border-primary/50 text-right cursor-pointer"
                            >
                                {FILTERS.styles.map(style => <option key={style} value={style} className="bg-[#0e0e1b] text-white">{style === 'All' ? 'כל הסגנונות' : style}</option>)}
                            </select>
                            <SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Game Select */}
                        <div className="relative min-w-[160px]">
                            <select
                                value={activeGame}
                                onChange={(e) => setActiveGame(e.target.value)}
                                className="w-full h-12 appearance-none bg-black/20 border border-white/10 rounded-xl px-4 text-white outline-none focus:border-primary/50 text-right cursor-pointer"
                            >
                                {FILTERS.games.map(game => <option key={game} value={game} className="bg-[#0e0e1b] text-white">{game === 'All' ? 'כל המשחקים' : game}</option>)}
                            </select>
                            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Gamers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGamers.map((gamer, index) => (
                        <GamerCard
                            key={index}
                            id={gamer.id}
                            username={gamer.username}
                            tag={gamer.tag}
                            games={gamer.games}
                            bio={gamer.bio}
                            online={gamer.online}
                            hiddenTags={{
                                "Discord": `${gamer.username}#1234`,
                                [gamer.games[0]]: "ProPlayer_99"
                            }}
                        />
                    ))}
                </div>

                {/* Empty State */}
                {filteredGamers.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={40} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">לא נמצאו תוצאות</h3>
                        <p className="text-gray-400">נסה לשנות את הסינון או לחפש שם אחר.</p>
                        <button
                            onClick={() => { setActiveGame("All"); setActiveStyle("All"); setSearchTerm("") }}
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
