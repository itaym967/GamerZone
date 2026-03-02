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
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

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
  return "תכתוב משחק/ז'אנר ואני אתן טיפים ממוקדים.";
}

export default function FloatingGamerBot() {
  const [ui, setUi] = useState({
    isOpen: false,
    isMinimized: false,
    input: "",
    isTyping: false,
    position: { x: 0, y: 0 },
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      content:
        "שלום! אני GamerBot 🎮 אני כאן לעזור לך עם כל שאלה על משחקים, טיפים, המלצות ועוד!",
      timestamp: "",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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

    if (!ui.input.trim()) {
      toast.error("לא ניתן לשלוח הודעה ריקה");
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: ui.input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setUi((prev) => ({ ...prev, input: "", isTyping: true }));
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });

    let botReply = getLocalBotReply(userMessage.content);
    try {
      const response = await fetch("/api/gamerbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });
      if (response.ok) {
        const payload = (await response.json()) as { reply?: string };
        if (payload.reply?.trim()) {
          botReply = payload.reply.trim();
        }
      }
    } catch (error: unknown) {
      console.error("Floating GamerBot API fallback to local reply", error);
    }

    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      content: botReply,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setUi((prev) => ({ ...prev, isTyping: false }));
  };

  return (
    <LazyMotion features={domAnimation}>
      {/* Floating Button */}
      <AnimatePresence>
        {!ui.isOpen && (
          <m.button
            animate={{
              scale: 1,
              opacity: 1,
              x: ui.position.x,
              y: ui.position.y,
            }}
            className="group fixed bottom-24 left-4 z-9999 flex h-14 w-14 cursor-move items-center justify-center rounded-full bg-linear-to-br from-primary to-secondary shadow-2xl shadow-primary/50 transition-shadow hover:shadow-primary/70 md:bottom-6 md:left-6 md:h-16 md:w-16"
            drag
            dragElastic={0}
            dragMomentum={false}
            exit={{ scale: 0.95, opacity: 0 }}
            initial={{ scale: 0.95, opacity: 0 }}
            onClick={() => setUi((prev) => ({ ...prev, isOpen: true }))}
            onDragEnd={(_e, info) => {
              setUi((prev) => ({
                ...prev,
                position: { x: info.offset.x, y: info.offset.y },
              }));
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
          </m.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {ui.isOpen && (
          <m.div
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: ui.isMinimized ? "auto" : "37.5rem",
            }}
            className="fixed right-3 bottom-24 left-3 z-9999 flex w-auto max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl md:right-auto md:bottom-6 md:left-6 md:w-96 md:max-w-none"
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
                  onClick={() =>
                    setUi((prev) => ({
                      ...prev,
                      isMinimized: !prev.isMinimized,
                    }))
                  }
                  type="button"
                >
                  {ui.isMinimized ? (
                    <HugeiconsIcon icon={Maximize02Icon} size={16} />
                  ) : (
                    <HugeiconsIcon icon={Minimize02Icon} size={16} />
                  )}
                </button>
                <button
                  className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
                  onClick={() => setUi((prev) => ({ ...prev, isOpen: false }))}
                  type="button"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!ui.isMinimized && (
              <>
                <div
                  className="flex-1 space-y-3 overflow-y-auto bg-primary-foreground p-4"
                  ref={scrollRef}
                >
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <m.div
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
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-fluid-sm leading-relaxed md:max-w-[clamp(16rem,85%,28rem)] ${
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
                      </m.div>
                    ))}
                    {ui.isTyping && (
                      <m.div
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                        initial={{ opacity: 0 }}
                      >
                        <div className="flex items-center gap-1 rounded-2xl rounded-tr-sm border border-primary/30 bg-linear-to-r from-primary/20 to-secondary/20 px-4 py-3">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                        </div>
                      </m.div>
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
                      onChange={(e) =>
                        setUi((prev) => ({ ...prev, input: e.target.value }))
                      }
                      placeholder="כתוב הודעה..."
                      type="text"
                      value={ui.input}
                    />
                    <button
                      className="rounded-lg bg-primary p-2 text-black transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!ui.input.trim() || ui.isTyping}
                      type="submit"
                    >
                      <HugeiconsIcon
                        className={
                          ui.input.trim() && !ui.isTyping
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
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
