"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Gamepad2, MessageSquare, Plus, Check, Loader2, Copy, Shield, X } from "lucide-react";
import { toast } from "sonner";
import OptimizedAvatar from "./OptimizedAvatar";
import { createClient } from "@/utils/supabase/client";

interface GamerCardProps {
    username: string;
    tag: string; // e.g. @cyber_ninja
    games: string[];
    bio: string;
    online?: boolean;
    hiddenTags?: { [key: string]: string }; // Map of game -> real gamertag
    avatarSeed?: string; // Optional override for avatar generation
    id: string;
    currentUserId: string | null;
}

export default function GamerCard({ username, tag, games, bio, online, hiddenTags, avatarSeed, id, currentUserId }: GamerCardProps) {
    const [status, setStatus] = useState<"initial" | "pending_sent" | "pending_received" | "approved" | "rejected">("initial");
    const [isLoading, setIsLoading] = useState(false);
    const [copiedTag, setCopiedTag] = useState<string | null>(null);
    const [xp, setXp] = useState(Math.floor(Math.random() * 500) + 100);
    const [showXpGain, setShowXpGain] = useState(false);
    // State for revealed tags
    const [revealedTags, setRevealedTags] = useState<{ [key: string]: string } | null>(null);

    const level = Math.floor(xp / 100);
    const progress = xp % 100;
    const currentSeed = avatarSeed || username;

    const supabase = createClient();

    const fetchRealTags = async () => {
        if (!id) return;
        const { data, error } = await supabase
            .from('gamertags')
            .select('platform, tag')
            .eq('user_id', id);

        if (data) {
            const realTags: { [key: string]: string } = {};
            data.forEach((t: any) => {
                realTags[t.platform] = t.tag;
            });
            setRevealedTags(realTags);
        }
    };

    // Check Swap Status on Mount & Realtime
    useEffect(() => {
        if (!currentUserId || !id) return;

        // 1. Initial Fetch
        const checkStatus = async () => {
            const { data } = await supabase
                .from('swap_requests')
                .select('*')
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${currentUserId})`)
                .maybeSingle();

            if (data) {
                updateLocalStatus(data);
            }
        };

        const updateLocalStatus = (data: any) => {
            // If approved, verify we are part of it and fetch tags
            if (data.status === 'approved') {
                setStatus('approved');
                fetchRealTags(); // Fetch real tags on approval
            } else if (data.status === 'pending') {
                if (data.sender_id === currentUserId) {
                    setStatus('pending_sent');
                } else {
                    setStatus('pending_received');
                }
            } else if (data.status === 'rejected') {
                setStatus('rejected');
            }
        };

        checkStatus();

        // 2. Realtime Listener
        console.log("Setting up realtime for:", { currentUserId, id });

        const channel = supabase
            .channel(`swap_status_${id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'swap_requests',
                    filter: `sender_id=eq.${currentUserId}`
                },
                (payload) => {
                    console.log("Realtime Event (Sender):", payload);
                    if (payload.new && (payload.new as any).receiver_id === id) {
                        updateLocalStatus(payload.new);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'swap_requests',
                    filter: `receiver_id=eq.${currentUserId}`
                },
                (payload) => {
                    console.log("Realtime Event (Receiver):", payload);
                    if (payload.new && (payload.new as any).sender_id === id) {
                        updateLocalStatus(payload.new);
                    }
                }
            )
            .subscribe((status) => {
                console.log("Subscription status:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, id]);


    const handleSendRequest = async () => {
        if (!currentUserId) {
            toast.error("עליך להתחבר כדי לשלוח בקשה!");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('swap_requests')
                .insert({
                    sender_id: currentUserId,
                    receiver_id: id,
                    status: 'pending' // Default, but being explicit
                });

            if (error) throw error;

            setStatus('pending_sent');
            toast.success("בקשה נשלחה!", { description: "תקבל התראה כשהמשתמש יאשר." });
        } catch (error: any) {
            console.error(error);
            toast.error("שגיאה בשליחת הבקשה", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveResponse = async (approved: boolean) => {
        if (!currentUserId) {
            toast.error("אנא התחבר כדי להגיב לבקשה");
            return;
        }
        setIsLoading(true);
        try {
            const newStatus = approved ? 'approved' : 'rejected';

            // Find requests where *I* am the receiver and *THEY* are the sender
            const { error } = await supabase
                .from('swap_requests')
                .update({ status: newStatus })
                .eq('sender_id', id)
                .eq('receiver_id', currentUserId);

            if (error) throw error;

            setStatus(newStatus as any);

            if (approved) {
                setXp(prev => prev + 50);
                setShowXpGain(true);
                setTimeout(() => setShowXpGain(false), 2000);
                toast.success(`🎉 יש התאמה!`, {
                    description: "פרטי השחקן חשופים כעת.",
                });
                fetchRealTags(); // Fetch real tags instantly
            } else {
                toast.info("הבקשה נדחתה.");
            }

        } catch (error: any) {
            toast.error("שגיאה בעדכון", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    }


    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedTag(text);
        toast.success(" הועתק!", { duration: 1500 });
        setTimeout(() => setCopiedTag(null), 2000);
    };

    // Determine which tags to show: revealed ones (if fetched) or hidden (from props, likely masked)
    const displayTags = revealedTags || hiddenTags;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className={`glass-panel p-5 rounded-2xl relative overflow-hidden group border transition-all duration-300 flex flex-col h-full ${status === 'approved' ? 'border-primary shadow-[0_0_20px_rgba(0,255,157,0.1)]' : 'border-transparent hover:border-primary'}`}
        >
            {/* Decorative Glow */}
            <div className={`absolute top-0 right-0 w-24 h-24 -translate-y-1/2 translate-x-1/2 blur-2xl rounded-full transition-all duration-700 ${status === 'approved' ? 'bg-primary/40 w-full h-full opacity-20' : 'bg-primary/20 group-hover:bg-primary/40'}`} />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                <OptimizedAvatar
                                    seed={currentSeed}
                                    size={48}
                                    style={currentSeed.startsWith('/avatars') ? 'avataaars' : 'bottts'}
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

            <p className="mt-4 text-sm text-gray-300 line-clamp-2 min-h-[40px] flex-grow">
                {bio}
            </p>

            {/* Revealed Gamertags Section */}
            <AnimatePresence>
                {status === 'approved' && displayTags && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-2"
                    >
                        <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2 opacity-80">Private Gamertags (Click to Copy):</h4>
                        {Object.entries(displayTags).map(([game, realTag]) => (
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

            <div className="mt-auto pt-5 flex gap-2 relative">
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

                {status === 'initial' || status === 'rejected' ? (
                    <button
                        onClick={handleSendRequest}
                        disabled={isLoading || !currentUserId}
                        className={`flex-1 font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 bg-primary text-black hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={status === 'rejected' ? 'הבקשה הקודמת נדחתה' : ''}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        <span>{status === 'rejected' ? 'שלח שוב' : 'החלף פרטים'}</span>
                    </button>
                ) : status === 'pending_sent' ? (
                    <button
                        disabled
                        className="flex-1 font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 bg-white/10 text-gray-400 cursor-wait"
                    >
                        <Loader2 size={18} className="animate-spin" />
                        <span>ממתין לאישור...</span>
                    </button>
                ) : status === 'pending_received' ? (
                    <div className="flex-1 flex gap-2">
                        <button
                            onClick={() => handleApproveResponse(true)}
                            disabled={isLoading}
                            className="flex-1 bg-green-500 text-black font-bold py-2 rounded-xl hover:bg-green-400 transition-all flex items-center justify-center"
                            title="אשר החלפה"
                        >
                            <Check size={18} />
                        </button>
                        <button
                            onClick={() => handleApproveResponse(false)}
                            disabled={isLoading}
                            className="bg-red-500/20 text-red-400 font-bold py-2 px-3 rounded-xl hover:bg-red-500/30 transition-all flex items-center justify-center"
                            title="דחה בקשה"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ) : ( // Approved
                    <button
                        disabled
                        className="flex-1 font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 bg-emerald-500/20 text-emerald-400 cursor-default border border-emerald-500/30"
                    >
                        <Shield size={18} />
                        <span>חברים</span>
                    </button>
                )}

                <Link href={`/chat?target=${id}`} className={`p-2 rounded-xl transition-colors ${status === 'approved' ? 'bg-primary text-black hover:bg-primary/90' : 'bg-white/5 hover:bg-white/10 text-white'}`}>
                    <MessageSquare size={18} />
                </Link>
            </div>
        </motion.div>
    );
}
