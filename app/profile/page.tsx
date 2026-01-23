"use client";

import { useState } from "react";
import { Save, RefreshCw, Gamepad2 } from "lucide-react";
import GamerCard from "../components/GamerCard";
import Navigation from "../components/Navigation";
import { toast } from "sonner";

export default function ProfilePage() {
    const [formData, setFormData] = useState({
        username: "NewUser_01",
        tag: "@gamer_tag",
        bio: "כתוב כאן משהו מגניב על עצמך...",
        games: ["Valorant", "Minecraft"],
        hiddenTags: {
            "Valorant": "ValoKing#123",
            "Minecraft": "Miner_99",
            "Discord": "user#0000"
        }
    });

    const [avatarSeed, setAvatarSeed] = useState("/avatars/samurai.png");

    const handleSave = () => {
        toast.success("הפרופיל עודכן בהצלחה!", {
            description: "הכרטיס שלך מעודכן ומוכן להחלפות."
        });
    };

    const regenerateAvatar = () => {
        const newSeed = Math.random().toString(36).substring(7);
        setAvatarSeed(newSeed);
    };

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64 transition-all">
            <Navigation />

            <main className="p-6 max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">הפרופיל שלי</h1>
                    <p className="text-gray-400">ככה אחרים רואים אותך ב-GamerZone</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                    {/* Edit Form */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <Gamepad2 size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-white">עריכת פרטים</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">כינוי (Username)</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50 text-right"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">תיוג (@Tag)</label>
                                <input
                                    type="text"
                                    value={formData.tag}
                                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50 text-right dir-ltr"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">בחר דמות</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: '/avatars/samurai.png', name: 'Samurai' },
                                        { id: '/avatars/hacker.png', name: 'Hacker' },
                                        { id: '/avatars/girl_pink.png', name: 'Pink' },
                                        { id: '/avatars/girl_blue.png', name: 'Blue' },
                                        { id: '/avatars/ninja.png', name: 'Ninja' },
                                        { id: '/avatars/gamer.png', name: 'Gamer' }
                                    ].map((avatar) => (
                                        <button
                                            key={avatar.id}
                                            onClick={() => setAvatarSeed(avatar.id)}
                                            className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${avatarSeed === avatar.id ? 'border-primary shadow-[0_0_15px_rgba(0,255,157,0.3)] scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                                                }`}
                                        >
                                            <img src={avatar.id} alt={avatar.name} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">על עצמי (Bio)</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50 text-right resize-none"
                                />
                            </div>

                            <div className="border-t border-white/10 pt-4 mt-4">
                                <h3 className="text-white font-bold mb-3">Gamertags פרטיים (רק לחברים)</h3>
                                <div className="space-y-3">
                                    {Object.entries(formData.hiddenTags).map(([game, tag]) => (
                                        <div key={game} className="flex items-center gap-2">
                                            <span className="w-24 text-sm text-gray-400">{game}:</span>
                                            <input
                                                type="text"
                                                value={tag}
                                                onChange={(e) => {
                                                    const newTags = { ...formData.hiddenTags, [game]: e.target.value };
                                                    setFormData({ ...formData, hiddenTags: newTags });
                                                }}
                                                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-primary/50 text-left dir-ltr font-mono"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                <span>שמור שינויים</span>
                            </button>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 justify-center lg:justify-start">
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">תצוגה מקדימה</span>
                            <span className="w-full h-px bg-white/10 flex-1"></span>
                        </div>

                        <div className="max-w-md mx-auto lg:mx-0 sticky top-10">
                            <GamerCard
                                id="preview"
                                username={formData.username}
                                tag={formData.tag}
                                games={formData.games}
                                bio={formData.bio}
                                online={true}
                                hiddenTags={formData.hiddenTags}
                                avatarSeed={avatarSeed}
                            />
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-500">
                                    * ככה הכרטיס שלך נראה למשתמשים אחרים לפני ואחרי החלפה
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
