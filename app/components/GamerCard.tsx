"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Gamepad2, MessageSquare, Plus, Check, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

interface GamerCardProps {
    username: string;
    tag: string; // e.g. @cyber_ninja
    games: string[];
    bio: string;
    online?: boolean;
    hiddenTags?: { [key: string]: string }; // Map of game -> real gamertag
    avatarSeed?: string; // Optional override for avatar generation
    id: string;
}

export default function GamerCard({ username, tag, games, bio, online, hiddenTags, avatarSeed, id }: GamerCardProps) {
    const [status, setStatus] = useState<"initial" | "pending" | "swapped">("initial");
    const [copiedTag, setCopiedTag] = useState<string | null>(null);
    const [xp, setXp] = useState(Math.floor(Math.random() * 500) + 100);
    const [showXpGain, setShowXpGain] = useState(false);

    const level = Math.floor(xp / 100);
    const progress = xp % 100;

    // Use explicit seed if provided, otherwise username
    const currentSeed = avatarSeed || username;

    // Simulate Swap Request
    const handleSwap = () => {
        if (status !== "initial") return;

        setStatus("pending");

        // Fake network delay
        setTimeout(() => {
            setStatus("swapped");
            setXp(prev => prev + 50);
            setShowXpGain(true);
            setTimeout(() => setShowXpGain(false), 2000);

            toast.success(`🎉 Swap Successful with ${username}!`, {
                description: "You gained +50 XP and can now see their private gamertags.",
                duration: 4000
            });
        }, 2500);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedTag(text);
        toast.success(" הועתק!", { duration: 1500 });
        setTimeout(() => setCopiedTag(null), 2000);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className={`glass-panel p-5 rounded-2xl relative overflow-hidden group border transition-all duration-300 ${status === 'swapped' ? 'border-primary shadow-[0_0_20px_rgba(0,255,157,0.1)]' : 'border-transparent hover:border-primary'}`}
        >
            {/* Decorative Glow */}
            <div className={`absolute top-0 right-0 w-24 h-24 -translate-y-1/2 translate-x-1/2 blur-2xl rounded-full transition-all duration-700 ${status === 'swapped' ? 'bg-primary/40 w-full h-full opacity-20' : 'bg-primary/20 group-hover:bg-primary/40'}`} />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                <img
                                    src={currentSeed.startsWith('/avatars') ? currentSeed : `https://api.dicebear.com/7.x/bottts/svg?seed=${currentSeed}&backgroundColor=transparent`}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        {/* Level Badge */}
                        <div className="absolute -bottom-2 -right-1 bg-black border border-primary text-[10px] text-primary font-bold px-1.5 rounded-md shadow-lg z-20">
                            LVL {level}
                        </div>
                    </div>

                    <div className="text-right"> {/* RTL Alignment */}
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg leading-tight text-white">{username}</h3>
                            {online && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                        </div>
                        <span dir="ltr" className="text-xs text-gray-400 block">{tag}</span>

                        {/* XP Bar */}
                        <div className="w-24 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-primary to-secondary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-4 text-sm text-gray-300 line-clamp-2 min-h-[40px]">
                {bio}
            </p>

            {/* Revealed Gamertags Section */}
            <AnimatePresence>
                {status === 'swapped' && hiddenTags && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-2"
                    >
                        <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2 opacity-80">Private Gamertags (Click to Copy):</h4>
                        {Object.entries(hiddenTags).map(([game, realTag]) => (
                            <button
                                key={game}
                                onClick={() => copyToClipboard(realTag)}
                                className="w-full flex justify-between items-center text-xs p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all group/tag"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-medium">{game}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span dir="ltr" className="text-white font-mono">{realTag}</span>
                                    {copiedTag === realTag ? (
                                        <Check size={14} className="text-green-400" />
                                    ) : (
                                        <Copy size={14} className="text-gray-500 group-hover/tag:text-primary transition-colors" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-4 flex flex-wrap gap-2">
                {games.map((game, i) => (
                    <span key={i} className="px-2 py-1 rounded-md bg-secondary/10 text-secondary text-[10px] uppercase font-bold tracking-wider border border-secondary/20">
                        {game}
                    </span>
                ))}
            </div>

            <div className="mt-5 flex gap-2 relative">
                <AnimatePresence>
                    {showXpGain && (
                        <motion.div
                            initial={{ y: 0, opacity: 0 }}
                            animate={{ y: -20, opacity: 1 }}
                            exit={{ y: -30, opacity: 0 }}
                            className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-shadow-glow z-20 pointer-events-none whitespace-nowrap"
                        >
                            +50 XP
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={handleSwap}
                    disabled={status !== "initial"}
                    className={`flex-1 font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${status === 'initial' ? 'bg-primary text-black hover:bg-primary/90' :
                        status === 'pending' ? 'bg-primary/20 text-primary cursor-wait' :
                            'bg-white/10 text-white cursor-default'
                        }`}
                >
                    {status === 'initial' && <><Plus size={18} /> <span>החלף פרטים</span></>}
                    {status === 'pending' && <><Loader2 size={18} className="animate-spin" /> <span>מבקש...</span></>}
                    {status === 'swapped' && <><Check size={18} className="text-green-400" /> <span>בוצע</span></>}
                </button>

                <Link href={`/chat?target=${id}`} className={`p-2 rounded-xl transition-colors ${status === 'swapped' ? 'bg-primary text-black hover:bg-primary/90' : 'bg-white/5 hover:bg-white/10 text-white'}`}>
                    <MessageSquare size={18} />
                </Link>
            </div>
        </motion.div>
    );
}
