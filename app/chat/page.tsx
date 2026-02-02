"use client";

import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { Send, MoreVertical, Search, Plus, ArrowRight, Trash2, Check, CheckCheck, Sparkles, Bot } from "lucide-react";
import Navigation from "../components/Navigation";
import OptimizedAvatar from "../components/OptimizedAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useChat, Contact, Message } from "@/hooks/useChat";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function ChatContent() {
    const searchParams = useSearchParams();
    const targetId = searchParams.get("target");

    const { user, isLoading: authLoading } = useAuth();
    const [activeChat, setActiveChat] = useState<Contact | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    const [input, setInput] = useState("");

    const [blockedWords, setBlockedWords] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [botMessages, setBotMessages] = useState<Message[]>([]);

    // GamerBot special contact
    const GAMERBOT_ID = 'gamerbot-ai';
    const gamerbotContact: Contact = {
        id: GAMERBOT_ID,
        username: 'GamerBot ✨',
        avatar_url: 'bot',
        last_msg: 'שלום! אני כאן לעזור לך עם כל שאלה על משחקים 🎮',
        last_msg_time: '',
        online: true,
        unread_count: 0
    };

    const supabase = useMemo(() => createClient(), []);

    // Initial Load & Param Handling
    useEffect(() => {
        async function init() {
            // Fetch Blocked Words (cached in component)
            const { data: words } = await supabase.from('blocked_words').select('word');
            if (words) {
                setBlockedWords(words.map(w => w.word));
            }

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
                    setMobileView('chat');
                }
            }
        }
        init();
    }, [targetId, supabase]);

    // Hook
    // Hook
    const {
        messages,
        contacts,
        sendMessage,
        fetchMessages,
        isLoading,
        deleteMessage,
        clearConversation,
        markAsRead,
        sendTyping,
        isRemoteTyping: isTyping
    } = useChat(user?.id, activeChat?.id, (msg) => {
        if (!activeChat || msg.sender_id !== activeChat.id) {
            const sender = contacts.find(c => c.id === msg.sender_id);
            const senderName = sender ? sender.username : "משתמש";
            toast.info(`הודעה חדשה מ-${senderName}`);
        }
    });

    // Initial Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, botMessages, isTyping, isBotTyping]);

    // Trigger fetch when activeChat changes (including from param)
    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.id);
        }
    }, [activeChat?.id]);

    // Auto-mark messages as read when viewing
    useEffect(() => {
        if (!activeChat || !user || messages.length === 0) return;

        const unreadMessages = messages.filter(
            m => m.receiver_id === user.id && m.sender_id === activeChat.id && !m.is_read
        );

        if (unreadMessages.length > 0) {
            const unreadIds = unreadMessages.map(m => m.id);
            markAsRead(unreadIds, activeChat.id);
        }
    }, [messages, activeChat, user, markAsRead]);

    // Handle Contact Selection
    const handleSelectContact = (contact: Contact) => {
        setActiveChat(contact);
        setMobileView('chat');
        // fetchMessages is called by the effect above
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation checks
        if (!input.trim()) {
            toast.error('לא ניתן לשלוח הודעה ריקה');
            return;
        }

        if (!activeChat) {
            toast.error('אנא בחר שיחה');
            return;
        }

        // GamerBot special handling
        if (activeChat.id === GAMERBOT_ID) {
            const userMessage = input.trim();
            setInput("");

            // Add user message to chat
            const userMsg: Message = {
                id: `user-${Date.now()}`,
                sender_id: user?.id || 'guest',
                receiver_id: GAMERBOT_ID,
                content: userMessage,
                created_at: new Date().toISOString(),
                is_read: true
            };
            setBotMessages(prev => [...prev, userMsg]);

            // Show bot typing
            setIsBotTyping(true);

            try {
                const response = await fetch('/api/deepseek/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessage })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'שגיאה בתקשורת עם הבוט');
                }

                // Add bot response
                const botMsg: Message = {
                    id: `bot-${Date.now()}`,
                    sender_id: GAMERBOT_ID,
                    receiver_id: user?.id || 'guest',
                    content: data.response,
                    created_at: new Date().toISOString(),
                    is_read: true
                };
                setBotMessages(prev => [...prev, botMsg]);
            } catch (error: any) {
                console.error('GamerBot error:', error);
                toast.error(error.message || 'שגיאה בתקשורת עם הבוט');
                
                // Add error message
                const errorMsg: Message = {
                    id: `bot-error-${Date.now()}`,
                    sender_id: GAMERBOT_ID,
                    receiver_id: user?.id || 'guest',
                    content: 'סליחה, נתקלתי בבעיה טכנית. נסה שוב בעוד רגע 🔧',
                    created_at: new Date().toISOString(),
                    is_read: true
                };
                setBotMessages(prev => [...prev, errorMsg]);
            } finally {
                setIsBotTyping(false);
            }
            return;
        }

        if (!user) {
            toast.error('אנא התחבר כדי לשלוח הודעות');
            return;
        }

        if (isLoading) {
            toast.warning('אנא המתן לטעינת ההודעות');
            return;
        }

        let finalContent = input;

        // Filter Logic
        const lowerInput = input.toLowerCase();
        const foundWord = blockedWords.find((word: string) => lowerInput.includes(word.toLowerCase()));

        if (foundWord) {
            const regex = new RegExp(foundWord, "gi");
            finalContent = input.replace(regex, "*".repeat(foundWord.length));
            toast.warning("הודעתך סוננה עקב שפה לא נאותה");
        }

        // Clear input immediately for better UX
        const messageToSend = finalContent;
        setInput("");

        // Send message
        await sendMessage(messageToSend, activeChat.id);
    };

    const handleClearConversation = async () => {
        if (!activeChat) return;

        const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את כל השיחה? פעולה זו אינה ניתנת לביטול.');
        if (confirmed) {
            await clearConversation(activeChat.id);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        await deleteMessage(messageId);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050510]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">טוען...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64 flex bg-[#050510]">
            <Navigation />

            <main className="flex-1 flex overflow-hidden h-screen max-w-7xl mx-auto w-full relative">

                {/* Contacts Sidebar */}
                <aside className={`${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 flex-col border-l border-white/5 bg-[#0e0e1b]`}>
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
                        {/* GamerBot - Always first */}
                        <button
                            onClick={() => handleSelectContact(gamerbotContact)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 ${activeChat?.id === GAMERBOT_ID ? 'ring-2 ring-primary' : ''}`}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px] flex items-center justify-center">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                        <Bot size={20} className="text-primary" />
                                    </div>
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0e0e1b] rounded-full"></span>
                            </div>
                            <div className="flex-1 text-right min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-white font-medium text-sm truncate flex items-center gap-1">
                                        GamerBot
                                        <Sparkles size={12} className="text-primary" />
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 truncate opacity-80">{gamerbotContact.last_msg}</p>
                            </div>
                        </button>

                        {/* Regular contacts */}
                        {contacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => handleSelectContact(contact)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeChat?.id === contact.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px]">
                                        <OptimizedAvatar
                                            seed={contact.avatar_url || contact.username}
                                            size={40}
                                            style="avataaars"
                                            className="rounded-full bg-black"
                                        />
                                    </div>
                                    {contact.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0e0e1b] rounded-full"></span>}
                                    {/* Unread badge */}
                                    {contact.unread_count && contact.unread_count > 0 && (
                                        <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                            {contact.unread_count > 99 ? '99+' : contact.unread_count}
                                        </span>
                                    )}
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
                <section className={`${mobileView === 'chat' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-[#050510] relative`}>
                    {/* Header */}
                    {activeChat ? (
                        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 bg-[#0e0e1b]/50 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setMobileView('list')}
                                    className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-white"
                                >
                                    <ArrowRight size={20} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px]">
                                    <OptimizedAvatar
                                        seed={activeChat.avatar_url || activeChat.username}
                                        size={40}
                                        style="avataaars"
                                        className="rounded-full bg-black"
                                    />
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
                                <button
                                    onClick={handleClearConversation}
                                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                    title="מחק שיחה"
                                >
                                    <Trash2 size={18} />
                                </button>
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
                            {activeChat && (activeChat.id === GAMERBOT_ID ? botMessages : messages).map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} group`}
                                >
                                    <div className="relative">
                                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.sender_id === user?.id
                                            ? 'bg-primary text-black rounded-tl-sm'
                                            : 'bg-[#1a1a2e] text-gray-200 border border-white/5 rounded-tr-sm'
                                            }`}>
                                            {msg.content}
                                            <span className={`text-[9px] flex items-center justify-end gap-1 mt-1 opacity-60 ${msg.sender_id === user?.id ? 'text-black/70' : 'text-gray-500'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                                {/* Read receipts - only for sent messages */}
                                                {msg.sender_id === user?.id && (
                                                    msg.is_read ? (
                                                        <CheckCheck size={14} className="text-blue-400" />
                                                    ) : (
                                                        <Check size={14} className="opacity-50" />
                                                    )
                                                )}
                                            </span>
                                        </div>
                                        {/* Delete button - appears on hover */}
                                        <button
                                            onClick={() => handleDeleteMessage(msg.id)}
                                            className={`absolute -top-2 ${msg.sender_id === user?.id ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500/90 hover:bg-red-600 rounded-full text-white shadow-lg`}
                                            title="מחק הודעה"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                            {(isTyping || isBotTyping) && activeChat && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className={`px-4 py-3 rounded-2xl rounded-tr-sm flex gap-1 items-center ${
                                        isBotTyping 
                                            ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30' 
                                            : 'bg-[#1a1a2e] border border-white/5'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${
                                            isBotTyping ? 'bg-primary' : 'bg-gray-500'
                                        }`}></span>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${
                                            isBotTyping ? 'bg-primary' : 'bg-gray-500'
                                        }`}></span>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                                            isBotTyping ? 'bg-primary' : 'bg-gray-500'
                                        }`}></span>
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
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    sendTyping();
                                }}
                                placeholder="כתוב הודעה..."
                                disabled={!activeChat}
                                className="flex-1 bg-transparent text-white text-sm outline-none px-2 text-right dir-rtl placeholder:text-gray-600 h-9 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || !activeChat || !user || isLoading}
                                className="p-2 bg-primary rounded-lg text-black hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                title={!user ? "אנא התחבר" : !activeChat ? "בחר שיחה" : isLoading ? "טוען..." : "שלח הודעה"}
                            >
                                <Send size={18} className={input.trim() && !isLoading ? "translate-x-0.5 -translate-y-0.5" : ""} />
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
