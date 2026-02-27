"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Maximize2, Minimize2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface Message {
  content: string;
  id: string;
  sender: "user" | "bot";
  timestamp: string;
}

export default function FloatingGamerBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      content:
        "שלום! אני GamerBot 🎮 אני כאן לעזור לך עם כל שאלה על משחקים, טיפים, המלצות ועוד!",
      timestamp: new Date().toISOString(),
    },
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
  if (!user) {
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      toast.error("לא ניתן לשלוח הודעה ריקה");
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/deepseek/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בתקשורת עם הבוט");
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("GamerBot error:", error);
      toast.error(error.message || "שגיאה בתקשורת עם הבוט");

      const errorMessage: Message = {
        id: `bot-error-${Date.now()}`,
        sender: "bot",
        content: "סליחה, נתקלתי בבעיה טכנית. נסה שוב בעוד רגע 🔧",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
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
            animate={{ scale: 1, opacity: 1, x: position.x, y: position.y }}
            className="group fixed bottom-24 left-6 z-[9999] flex h-16 w-16 cursor-move items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-2xl shadow-primary/50 transition-shadow hover:shadow-primary/70 md:bottom-6"
            drag
            dragElastic={0}
            dragMomentum={false}
            exit={{ scale: 0, opacity: 0 }}
            initial={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            onDragEnd={(e, info) => {
              setPosition({ x: info.offset.x, y: info.offset.y });
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bot
              className="text-black transition-transform group-hover:scale-110"
              size={28}
            />
            <span className="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full border-2 border-[#050510] bg-green-500" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? "auto" : "600px",
            }}
            className="fixed bottom-24 left-6 z-[9999] flex w-96 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e1b] shadow-2xl md:bottom-6"
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-primary/30 border-b bg-gradient-to-r from-primary/20 to-secondary/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary p-[1px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-black">
                    <Bot className="text-primary" size={20} />
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="flex items-center gap-1 font-bold text-sm text-white">
                    GamerBot
                    <Sparkles className="text-primary" size={12} />
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] text-green-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />{" "}
                    מחובר
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? (
                    <Maximize2 size={16} />
                  ) : (
                    <Minimize2 size={16} />
                  )}
                </button>
                <button
                  className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div
                  className="flex-1 space-y-3 overflow-y-auto bg-[#050510] p-4"
                  ref={scrollRef}
                >
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        exit={{
                          opacity: 0,
                          scale: 0.9,
                          transition: { duration: 0.2 },
                        }}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        key={msg.id}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            msg.sender === "user"
                              ? "rounded-tl-sm bg-primary text-black"
                              : "rounded-tr-sm border border-white/5 bg-[#1a1a2e] text-gray-200"
                          }`}
                        >
                          {msg.content}
                          <span
                            className={`mt-1 flex items-center justify-end gap-1 text-[9px] opacity-60 ${
                              msg.sender === "user"
                                ? "text-black/70"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString(
                              "he-IL",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                        initial={{ opacity: 0 }}
                      >
                        <div className="flex items-center gap-1 rounded-2xl rounded-tr-sm border border-primary/30 bg-gradient-to-r from-primary/20 to-secondary/20 px-4 py-3">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="border-white/5 border-t bg-[#0e0e1b]/80 p-4 backdrop-blur-lg">
                  <form
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-1.5 transition-colors focus-within:border-primary/50"
                    onSubmit={handleSend}
                  >
                    <input
                      className="dir-rtl h-9 flex-1 bg-transparent px-2 text-right text-sm text-white outline-none placeholder:text-gray-600"
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="כתוב הודעה..."
                      type="text"
                      value={input}
                    />
                    <button
                      className="rounded-lg bg-primary p-2 text-black transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!input.trim() || isTyping}
                      type="submit"
                    >
                      <Send
                        className={
                          input.trim() && !isTyping
                            ? "translate-x-0.5 -translate-y-0.5"
                            : ""
                        }
                        size={18}
                      />
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
