"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Send, MoreVertical, Phone, Video, Search, Plus } from "lucide-react";
import Navigation from "../components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useChat, Contact } from "@/hooks/useChat";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";

function ChatContent() {
    const searchParams = useSearchParams();
    const targetId = searchParams.get("target");

    const [activeChat, setActiveChat] = useState<Contact | null>(null);
    const [user, setUser] = useState<any>(null);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auth & Supabase
    const supabase = createClient();

    // Initial Load & Param Handling
    useEffect(() => {
        async function init() {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);

            if (targetId) {
                // Fetch target profile if query param exists
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id, username, avatar_url, is_online")
                    .eq("id", targetId)
                    .single();

                if (profile) {
                    setActiveChat({
                        id: profile.id,
                        username: profile.username || "Unknown",
                        avatar_url: profile.avatar_url,
                        last_msg: "",
                        last_msg_time: "",
                        online: profile.is_online
                    });
                }
            }
        }
        init();
    }, [targetId]);

    // Hook
    const { messages, contacts, sendMessage, fetchMessages, isLoading } = useChat(user?.id);

    // Initial Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Trigger fetch when activeChat changes (including from param)
    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.id);
        }
    }, [activeChat?.id]);

    // Handle Contact Selection
    const handleSelectContact = (contact: Contact) => {
        setActiveChat(contact);
        // fetchMessages is called by the effect above
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activeChat || !user) return;

        let finalContent = input;

        // Filter Logic
        const blockedWords = JSON.parse(localStorage.getItem("gamerzone_blocked_words") || "[]");
        const lowerInput = input.toLowerCase();
        const foundWord = blockedWords.find((word: string) => lowerInput.includes(word.toLowerCase()));

        if (foundWord) {
            const regex = new RegExp(foundWord, "gi");
            finalContent = input.replace(regex, "*".repeat(foundWord.length));
            toast.warning("הודעתך סוננה עקב שפה לא נאותה");
        }

        await sendMessage(finalContent, activeChat.id);
        setInput("");
    };

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64 flex bg-[#050510]">
            <Navigation />

            <main className="flex-1 flex overflow-hidden h-screen max-w-7xl mx-auto w-full relative">

                {/* Contacts Sidebar */}
                <aside className="w-80 border-l border-white/5 bg-[#0e0e1b] hidden lg:flex flex-col">
                    <div className="p-4 border-b border-white/5">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="חפש שיחות..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-primary/50 text-right pr-10"
                            />
                            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {contacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => handleSelectContact(contact)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeChat?.id === contact.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px]">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.avatar_url}`} className="rounded-full bg-black" />
                                    </div>
                                    {contact.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0e0e1b] rounded-full"></span>}
                                </div>
                                <div className="flex-1 text-right min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-white font-medium text-sm truncate">{contact.username}</span>
                                        <span className="text-[10px] text-gray-500">{contact.last_msg_time}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate opacity-80">{contact.last_msg}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Chat Area */}
                <section className="flex-1 flex flex-col bg-[#050510] relative">
                    {/* Header */}
                    {activeChat ? (
                        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 bg-[#0e0e1b]/50 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px]">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.avatar_url}`} className="rounded-full bg-black" />
                                </div>
                                <div className="text-right">
                                    <h3 className="font-bold text-white text-sm">{activeChat.username}</h3>
                                    {activeChat.online ? (
                                        <span className="text-[10px] text-green-500 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> מחובר
                                        </span>
                                    ) : <span className="text-[10px] text-gray-500">נראה לאחרונה לפני שעה</span>}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-70">
                                <button className="p-2 hover:bg-white/10 rounded-lg text-white"><Phone size={18} /></button>
                                <button className="p-2 hover:bg-white/10 rounded-lg text-white"><Video size={18} /></button>
                                <button className="p-2 hover:bg-white/10 rounded-lg text-white"><MoreVertical size={18} /></button>
                            </div>
                        </header>
                    ) : (
                        <header className="h-16 border-b border-white/5 flex items-center justify-center text-gray-500">
                            בחר שיחה בצד ימין כדי להתחיל
                        </header>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        <AnimatePresence initial={false}>
                            {activeChat && messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative group ${msg.sender_id === user?.id
                                        ? 'bg-primary text-black rounded-tl-sm'
                                        : 'bg-[#1a1a2e] text-gray-200 border border-white/5 rounded-tr-sm'
                                        }`}>
                                        {msg.content}
                                        <span className={`text-[9px] block text-right mt-1 opacity-60 ${msg.sender_id === user?.id ? 'text-black/70' : 'text-gray-500'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && activeChat && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="bg-[#1a1a2e] border border-white/5 px-4 py-3 rounded-2xl rounded-tr-sm flex gap-1 items-center">
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/5 bg-[#0e0e1b]/80 backdrop-blur-lg">
                        <form onSubmit={handleSend} className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl p-1.5 focus-within:border-primary/50 transition-colors">
                            <button type="button" className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <Plus size={20} className="rotate-45" />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="כתוב הודעה..."
                                disabled={!activeChat}
                                className="flex-1 bg-transparent text-white text-sm outline-none px-2 text-right dir-rtl placeholder:text-gray-600 h-9 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || !activeChat}
                                className="p-2 bg-primary rounded-lg text-black hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Send size={18} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                            </button>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#050510] text-white">טוען...</div>}>
            <ChatContent />
        </Suspense>
    );
}
