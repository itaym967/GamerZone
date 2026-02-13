"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface Message {
    id: string;
    sender: 'user' | 'bot';
    content: string;
    timestamp: string;
}

export default function FloatingGamerBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'bot',
            content: 'שלום! אני GamerBot 🎮 אני כאן לעזור לך עם כל שאלה על משחקים, טיפים, המלצות ועוד!',
            timestamp: new Date().toISOString()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Hide bot for unauthenticated users (after all hooks)
    if (!user) return null;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim()) {
            toast.error('לא ניתן לשלוח הודעה ריקה');
            return;
        }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            sender: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await fetch('/api/deepseek/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'שגיאה בתקשורת עם הבוט');
            }

            const botMessage: Message = {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                content: data.response,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error: any) {
            console.error('GamerBot error:', error);
            toast.error(error.message || 'שגיאה בתקשורת עם הבוט');

            const errorMessage: Message = {
                id: `bot-error-${Date.now()}`,
                sender: 'bot',
                content: 'סליחה, נתקלתי בבעיה טכנית. נסה שוב בעוד רגע 🔧',
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        drag
                        dragMomentum={false}
                        dragElastic={0}
                        onDragEnd={(e, info) => {
                            setPosition({ x: info.offset.x, y: info.offset.y });
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, x: position.x, y: position.y }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-24 md:bottom-6 left-6 z-[9999] w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary shadow-2xl shadow-primary/50 flex items-center justify-center group hover:shadow-primary/70 transition-shadow cursor-move"
                    >
                        <Bot size={28} className="text-black group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#050510] rounded-full animate-pulse"></span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            height: isMinimized ? 'auto' : '600px'
                        }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="fixed bottom-24 md:bottom-6 left-6 z-[9999] w-96 bg-[#0e0e1b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/30 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px] flex items-center justify-center">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                        <Bot size={20} className="text-primary" />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-1">
                                        GamerBot
                                        <Sparkles size={12} className="text-primary" />
                                    </h3>
                                    <span className="text-[10px] text-green-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> מחובר
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                                >
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        {!isMinimized && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#050510]" ref={scrollRef}>
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                    msg.sender === 'user'
                                                        ? 'bg-primary text-black rounded-tl-sm'
                                                        : 'bg-[#1a1a2e] text-gray-200 border border-white/5 rounded-tr-sm'
                                                }`}>
                                                    {msg.content}
                                                    <span className={`text-[9px] flex items-center justify-end gap-1 mt-1 opacity-60 ${
                                                        msg.sender === 'user' ? 'text-black/70' : 'text-gray-500'
                                                    }`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {isTyping && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                                <div className="px-4 py-3 rounded-2xl rounded-tr-sm flex gap-1 items-center bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
                                                    <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] bg-primary"></span>
                                                    <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] bg-primary"></span>
                                                    <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-primary"></span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-white/5 bg-[#0e0e1b]/80 backdrop-blur-lg">
                                    <form onSubmit={handleSend} className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl p-1.5 focus-within:border-primary/50 transition-colors">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="כתוב הודעה..."
                                            className="flex-1 bg-transparent text-white text-sm outline-none px-2 text-right dir-rtl placeholder:text-gray-600 h-9"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim() || isTyping}
                                            className="p-2 bg-primary rounded-lg text-black hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <Send size={18} className={input.trim() && !isTyping ? "translate-x-0.5 -translate-y-0.5" : ""} />
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
