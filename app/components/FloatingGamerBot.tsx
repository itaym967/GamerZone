"use client";

import {
  BotIcon,
  Cancel01Icon,
  Maximize02Icon,
  Minimize02Icon,
  SentIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface Message {
  content: string;
  id: string;
  sender: "user" | "bot";
  timestamp: string;
}

function getLocalBotReply(message: string): string {
  const normalizedMessage = message.trim().toLowerCase();
  if (!normalizedMessage) {
    return "כתוב לי מה בא לך לשחק ואנסה לעזור.";
  }
  if (
    normalizedMessage.includes("fps") ||
    normalizedMessage.includes("shoot") ||
    normalizedMessage.includes("יריות")
  ) {
    return "למשחקי FPS תנסה לחמם aim ל-10 דקות, להוריד רגישות קצת, ולעבוד על crosshair placement.";
  }
  if (
    normalizedMessage.includes("rank") ||
    normalizedMessage.includes("competitive") ||
    normalizedMessage.includes("ראנק")
  ) {
    return "כדי לעלות ראנק: שחק עקבי, התמקד ב-2-3 דמויות/נשקים, ונתח משחק אחד ביום במקום רק לגריינד.";
  }
  return "כרגע אני במצב בסיסי בלי AI חיצוני. תכתוב משחק/ז'אנר ואני אתן טיפים ממוקדים.";
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
      timestamp: "",
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
  }, []);

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
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });

    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      content: getLocalBotReply(userMessage.content),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            animate={{ scale: 1, opacity: 1, x: position.x, y: position.y }}
            className="group fixed bottom-24 left-6 z-9999 flex h-16 w-16 cursor-move items-center justify-center rounded-full bg-linear-to-br from-primary to-secondary shadow-2xl shadow-primary/50 transition-shadow hover:shadow-primary/70 md:bottom-6"
            drag
            dragElastic={0}
            dragMomentum={false}
            exit={{ scale: 0, opacity: 0 }}
            initial={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            onDragEnd={(_e, info) => {
              setPosition({ x: info.offset.x, y: info.offset.y });
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <HugeiconsIcon
              className="text-black transition-transform group-hover:scale-110"
              icon={BotIcon}
              size={28}
            />
            <span className="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full border-2 border-primary-foreground bg-green-500" />
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
              height: isMinimized ? "auto" : "37.5rem",
            }}
            className="fixed bottom-24 left-6 z-9999 flex w-96 flex-col overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl md:bottom-6"
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-primary/30 border-b bg-linear-to-r from-primary/20 to-secondary/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary to-secondary p-px">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-black">
                    <HugeiconsIcon
                      className="text-primary"
                      icon={BotIcon}
                      size={20}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="flex items-center gap-1 font-bold text-fluid-sm text-white">
                    GamerBot
                    <HugeiconsIcon
                      className="text-primary"
                      icon={SparklesIcon}
                      size={12}
                    />
                  </h3>
                  <span className="flex items-center gap-1 text-fluid-xs text-green-500">
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
                    <HugeiconsIcon icon={Maximize02Icon} size={16} />
                  ) : (
                    <HugeiconsIcon icon={Minimize02Icon} size={16} />
                  )}
                </button>
                <button
                  className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div
                  className="flex-1 space-y-3 overflow-y-auto bg-primary-foreground p-4"
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
                          className={`max-w-[clamp(16rem,85%,28rem)] rounded-2xl px-4 py-2.5 text-fluid-sm leading-relaxed ${
                            msg.sender === "user"
                              ? "rounded-tl-sm bg-primary text-black"
                              : "rounded-tr-sm border border-white/5 bg-[#1a1a2e] text-gray-200"
                          }`}
                        >
                          {msg.content}
                          <span
                            className={`mt-1 flex items-center justify-end gap-1 text-fluid-xs opacity-60 ${
                              msg.sender === "user"
                                ? "text-black/70"
                                : "text-gray-500"
                            }`}
                          >
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleTimeString(
                                  "he-IL",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : ""}
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
                        <div className="flex items-center gap-1 rounded-2xl rounded-tr-sm border border-primary/30 bg-linear-to-r from-primary/20 to-secondary/20 px-4 py-3">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="border-white/5 border-t bg-card/80 p-4 backdrop-blur-lg">
                  <form
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-1.5 transition-colors focus-within:border-primary/50"
                    onSubmit={handleSend}
                  >
                    <input
                      className="dir-rtl h-9 flex-1 bg-transparent px-2 text-right text-fluid-sm text-white outline-hidden placeholder:text-gray-600"
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
                      <HugeiconsIcon
                        className={
                          input.trim() && !isTyping
                            ? "translate-x-0.5 -translate-y-0.5"
                            : ""
                        }
                        icon={SentIcon}
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
