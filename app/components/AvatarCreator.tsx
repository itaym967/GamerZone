"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Check } from "lucide-react";

interface AvatarCreatorProps {
    onSelect: (avatarUrl: string) => void;
    initialSeed?: string;
}

const AVATAR_STYLES = [
    { id: "avataaars", name: "אווטאר קלאסי", emoji: "😎" },
    { id: "bottts", name: "רובוט", emoji: "🤖" },
    { id: "pixel-art", name: "פיקסל ארט", emoji: "🎮" },
    { id: "lorelei", name: "אנימה", emoji: "✨" },
    { id: "adventurer", name: "הרפתקן", emoji: "🗡️" },
    { id: "big-smile", name: "חיוך גדול", emoji: "😄" },
    { id: "fun-emoji", name: "אימוג'י", emoji: "🎭" },
    { id: "thumbs", name: "אגודל", emoji: "👍" }
];

export default function AvatarCreator({ onSelect, initialSeed = "" }: AvatarCreatorProps) {
    const [selectedStyle, setSelectedStyle] = useState("avataaars");
    const [seed, setSeed] = useState(initialSeed || `gamer-${Date.now()}`);
    const [avatarUrl, setAvatarUrl] = useState("");

    useEffect(() => {
        const url = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}`;
        setAvatarUrl(url);
        onSelect(url);
    }, [selectedStyle, seed, onSelect]);

    const randomize = () => {
        setSeed(`gamer-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    };

    return (
        <div className="space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
                <motion.div
                    key={avatarUrl}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                >
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
                        <div className="w-full h-full rounded-full bg-black overflow-hidden">
                            <img
                                src={avatarUrl}
                                alt="Avatar Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <button
                        onClick={randomize}
                        className="absolute -bottom-2 -right-2 bg-primary text-black p-3 rounded-full hover:bg-primary/80 transition-all shadow-lg hover:scale-110"
                        title="אווטאר אקראי"
                    >
                        <RefreshCw size={20} />
                    </button>
                </motion.div>
            </div>

            {/* Style Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-3 text-right">
                    בחר סגנון אווטאר
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {AVATAR_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={`relative p-3 rounded-xl border-2 transition-all text-center ${
                                selectedStyle === style.id
                                    ? "border-primary bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                        >
                            <div className="text-2xl mb-1">{style.emoji}</div>
                            <div className="text-xs text-white font-medium">{style.name}</div>
                            {selectedStyle === style.id && (
                                <div className="absolute -top-1 -right-1 bg-primary text-black rounded-full p-0.5">
                                    <Check size={12} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Randomize Button */}
            <button
                onClick={randomize}
                className="w-full bg-white/5 border border-white/10 hover:border-primary/50 text-white py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
                <RefreshCw size={18} />
                <span>אווטאר אקראי חדש</span>
            </button>
        </div>
    );
}
