"use client";

import {
  Add01Icon,
  ArrowRight01Icon,
  BotIcon,
  Delete02Icon,
  Flag01Icon,
  MoreVerticalIcon,
  Search01Icon,
  SentIcon,
  Shield01Icon,
  SparklesIcon,
  Tick01Icon,
  TickDouble01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { type Contact, type Message, useChat } from "@/hooks/use-chat";
import { createClient } from "@/lib/supabase/client";
import { haptic } from "@/utils/haptics";
import { filterContent } from "@/utils/kid-safety";
import Navigation from "../components/Navigation";
import OptimizedAvatar from "../components/OptimizedAvatar";
import ReportMessageModal from "../components/ReportMessageModal";

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
    return "טיפ ל-FPS: תתאמן 10 דקות על aim לפני ranked ותשמור על crosshair בגובה הראש.";
  }
  if (
    normalizedMessage.includes("party") ||
    normalizedMessage.includes("team") ||
    normalizedMessage.includes("קבוצה")
  ) {
    return "לחיפוש קבוצה טובה: תגדיר role ברור, שעות משחק קבועות, וסגנון תקשורת מראש.";
  }
  return "כרגע הבוט עובד במצב בסיסי מקומי ללא DeepSeek. כתוב משחק ספציפי ואחזיר לך טיפים ממוקדים.";
}

function getContentFilterLevel(accountType?: string) {
  if (accountType === "supervised") {
    return "strict";
  }
  if (accountType === "minor") {
    return "moderate";
  }
  return "standard";
}

function getFilterWarningMessage(reasons: string[]) {
  if (reasons.includes("personal_info")) {
    return "מידע אישי הוסר מההודעה להגנתך";
  }
  if (reasons.includes("url_removed")) {
    return "קישורים הוסרו מההודעה";
  }
  if (reasons.length > 0) {
    return "הודעתך סוננה עקב שפה לא נאותה";
  }
  return null;
}

function getSendButtonTitle(
  hasUser: boolean,
  hasActiveChat: boolean,
  isLoading: boolean
) {
  if (!hasUser) {
    return "אנא התחבר";
  }
  if (!hasActiveChat) {
    return "בחר שיחה";
  }
  if (isLoading) {
    return "טוען...";
  }
  return "שלח הודעה";
}

function getTypingDotClasses(isConnected: boolean) {
  return `h-1.5 w-1.5 animate-bounce rounded-full ${
    isConnected ? "bg-primary" : "bg-gray-500"
  }`;
}

async function sendGamerBotMessage(params: {
  input: string;
  userId?: string;
  setInput: (value: string) => void;
  setBotMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsBotTyping: (value: boolean) => void;
}) {
  const { input, userId, setInput, setBotMessages, setIsBotTyping } = params;
  const userMessage = input.trim();
  setInput("");

  const userMsg: Message = {
    id: `user-${Date.now()}`,
    sender_id: userId || "guest",
    receiver_id: "gamerbot-ai",
    content: userMessage,
    created_at: new Date().toISOString(),
    is_read: true,
  };
  setBotMessages((prev) => [...prev, userMsg]);
  setIsBotTyping(true);

  await new Promise((resolve) => {
    setTimeout(resolve, 300);
  });

  const botMsg: Message = {
    id: `bot-${Date.now()}`,
    sender_id: "gamerbot-ai",
    receiver_id: userId || "guest",
    content: getLocalBotReply(userMessage),
    created_at: new Date().toISOString(),
    is_read: true,
  };
  setBotMessages((prev) => [...prev, botMsg]);
  setIsBotTyping(false);
}

function ChatContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("target");

  const { user, profile, isLoading: authLoading } = useAuth();
  const [activeChat, setActiveChat] = useState<Contact | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [input, setInput] = useState("");

  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [botMessages, setBotMessages] = useState<Message[]>([]);

  // Kid safety state
  const [reportModal, setReportModal] = useState<{
    open: boolean;
    messageId: string | null;
    userId: string | null;
  }>({
    open: false,
    messageId: null,
    userId: null,
  });
  const contentFilterLevel = getContentFilterLevel(profile?.account_type);
  const isChatRestricted = profile?.chat_restricted;

  // GamerBot special contact
  const GAMERBOT_ID = "gamerbot-ai";
  const gamerbotContact: Contact = {
    id: GAMERBOT_ID,
    username: "GamerBot ✨",
    avatar_url: "bot",
    last_msg: "שלום! אני כאן לעזור לך עם כל שאלה על משחקים 🎮",
    last_msg_time: "",
    online: true,
    unread_count: 0,
  };

  const supabase = useMemo(() => createClient(), []);

  // Initial Load & Param Handling
  useEffect(() => {
    async function init() {
      // Fetch Blocked Words (cached in component)
      const { data: words } = await supabase
        .from("blocked_words")
        .select("word");
      if (words) {
        setBlockedWords(words.map((w) => w.word));
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
            online: profile.is_online,
          });
          setMobileView("chat");
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
    isRemoteTyping: isTyping,
  } = useChat(user?.id, activeChat?.id, (msg) => {
    if (!activeChat || msg.sender_id !== activeChat.id) {
      const sender = contacts.find((c) => c.id === msg.sender_id);
      const senderName = sender ? sender.username : "משתמש";
      toast.info(`הודעה חדשה מ-${senderName}`);
    }
  });

  // Initial Scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Trigger fetch when activeChat changes (including from param)
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
    }
  }, [activeChat?.id, activeChat, fetchMessages]);

  // Auto-mark messages as read when viewing
  useEffect(() => {
    if (!(activeChat && user) || messages.length === 0) {
      return;
    }

    const unreadMessages = messages.filter(
      (m) =>
        m.receiver_id === user.id && m.sender_id === activeChat.id && !m.is_read
    );

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((m) => m.id);
      markAsRead(unreadIds, activeChat.id);
    }
  }, [messages, activeChat, user, markAsRead]);

  // Handle Contact Selection
  const handleSelectContact = (contact: Contact) => {
    setActiveChat(contact);
    setMobileView("chat");
    // fetchMessages is called by the effect above
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      toast.error("לא ניתן לשלוח הודעה ריקה");
      return;
    }

    if (!activeChat) {
      toast.error("אנא בחר שיחה");
      return;
    }

    if (activeChat.id === GAMERBOT_ID) {
      await sendGamerBotMessage({
        input,
        userId: user?.id,
        setInput,
        setBotMessages,
        setIsBotTyping,
      });
      return;
    }

    if (!user) {
      toast.error("אנא התחבר כדי לשלוח הודעות");
      return;
    }

    if (isLoading) {
      toast.warning("אנא המתן לטעינת ההודעות");
      return;
    }

    const filterResult = filterContent(input, blockedWords, contentFilterLevel);
    const messageToSend = filterResult.filtered;

    if (filterResult.wasFiltered) {
      const warningMessage = getFilterWarningMessage(filterResult.reasons);
      if (warningMessage) {
        toast.warning(warningMessage);
      }
    }

    setInput("");
    haptic("light");

    await sendMessage(messageToSend, activeChat.id);
  };

  const handleClearConversation = async () => {
    if (!activeChat) {
      return;
    }
    toast.warning("למחוק את כל השיחה?", {
      description: "הפעולה אינה ניתנת לביטול.",
      action: {
        label: "מחק",
        onClick: async () => {
          await clearConversation(activeChat.id);
        },
      },
      cancel: "ביטול",
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-foreground">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-white">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-primary-foreground pb-24 md:pr-64 md:pb-0">
      <Navigation />

      <main className="relative mx-auto flex h-screen w-full max-w-7xl flex-1 overflow-hidden">
        {/* Contacts Sidebar */}
        <aside
          className={`${mobileView === "list" ? "flex" : "hidden"} w-full flex-col border-white/5 border-l bg-card lg:flex lg:w-80`}
        >
          <div className="border-white/5 border-b p-4">
            <div className="relative">
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 pr-10 text-right text-fluid-sm text-white outline-hidden focus:border-primary/50"
                placeholder="חפש שיחות..."
                type="text"
              />
              <HugeiconsIcon
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                icon={Search01Icon}
                size={16}
              />
            </div>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {/* GamerBot - Always first */}
            <button
              className={`flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 to-secondary/5 p-3 transition-all hover:from-primary/10 hover:to-secondary/10 ${activeChat?.id === GAMERBOT_ID ? "ring-2 ring-primary" : ""}`}
              onClick={() => handleSelectContact(gamerbotContact)}
              type="button"
            >
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary to-secondary p-px">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-black">
                    <HugeiconsIcon
                      className="text-primary"
                      icon={BotIcon}
                      size={20}
                    />
                  </div>
                </div>
                <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 truncate font-medium text-fluid-sm text-white">
                    GamerBot
                    <HugeiconsIcon
                      className="text-primary"
                      icon={SparklesIcon}
                      size={12}
                    />
                  </span>
                </div>
                <p className="truncate text-fluid-xs text-gray-400 opacity-80">
                  {gamerbotContact.last_msg}
                </p>
              </div>
            </button>

            {/* Regular contacts */}
            {contacts.map((contact) => (
              <button
                className={`flex w-full items-center gap-3 rounded-xl p-3 transition-all ${activeChat?.id === contact.id ? "bg-white/10" : "hover:bg-white/5"}`}
                key={contact.id}
                onClick={() => handleSelectContact(contact)}
                type="button"
              >
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary to-secondary p-px">
                    <OptimizedAvatar
                      className="rounded-full bg-black"
                      seed={contact.avatar_url || contact.username}
                      size={40}
                      style="avataaars"
                    />
                  </div>
                  {contact.online && (
                    <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
                  )}
                  {/* Unread badge */}
                  {contact.unread_count && contact.unread_count > 0 && (
                    <span className="absolute -top-1 -left-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 font-bold text-fluid-xs text-white">
                      {contact.unread_count > 99 ? "99+" : contact.unread_count}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="truncate font-medium text-fluid-sm text-white">
                      {contact.username}
                    </span>
                    <span className="text-fluid-xs text-gray-500">
                      {contact.last_msg_time}
                    </span>
                  </div>
                  <p className="truncate text-fluid-xs text-gray-400 opacity-80">
                    {contact.last_msg}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <section
          className={`${mobileView === "chat" ? "flex" : "hidden"} relative flex-1 flex-col bg-primary-foreground lg:flex`}
        >
          {/* Header */}
          {activeChat ? (
            <header className="flex h-16 items-center justify-between border-white/5 border-b bg-card/50 px-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  className="-mr-2 p-2 text-gray-400 hover:text-white lg:hidden"
                  onClick={() => setMobileView("list")}
                  type="button"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                </button>
                <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary to-secondary p-px">
                  <OptimizedAvatar
                    className="rounded-full bg-black"
                    seed={activeChat.avatar_url || activeChat.username}
                    size={40}
                    style="avataaars"
                  />
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-fluid-sm text-white">
                    {activeChat.username}
                  </h3>
                  {activeChat.online ? (
                    <span className="flex items-center gap-1 text-fluid-xs text-green-500">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />{" "}
                      מחובר
                    </span>
                  ) : (
                    <span className="text-fluid-xs text-gray-500">
                      נראה לאחרונה לפני שעה
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-70">
                <button
                  className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                  onClick={handleClearConversation}
                  title="מחק שיחה"
                  type="button"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={18} />
                </button>
                <button
                  className="rounded-lg p-2 text-white hover:bg-white/10"
                  type="button"
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
                </button>
              </div>
            </header>
          ) : (
            <header className="flex h-16 items-center justify-center border-white/5 border-b text-gray-500">
              בחר שיחה בצד ימין כדי להתחיל
            </header>
          )}

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4" ref={scrollRef}>
            <AnimatePresence initial={false}>
              {activeChat &&
                (activeChat.id === GAMERBOT_ID ? botMessages : messages).map(
                  (msg) => (
                    <motion.div
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"} group`}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.2 },
                      }}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      key={msg.id}
                    >
                      <div className="relative">
                        <div
                          className={`max-w-[clamp(16rem,75%,30rem)] rounded-2xl px-4 py-2.5 text-fluid-sm leading-relaxed ${
                            msg.sender_id === user?.id
                              ? "rounded-tl-sm bg-primary text-black"
                              : "rounded-tr-sm border border-white/5 bg-[#1a1a2e] text-gray-200"
                          }`}
                        >
                          {msg.content}
                          <span
                            className={`mt-1 flex items-center justify-end gap-1 text-fluid-xs opacity-60 ${msg.sender_id === user?.id ? "text-black/70" : "text-gray-500"}`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString(
                              "he-IL",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                            {/* Read receipts - only for sent messages */}
                            {msg.sender_id === user?.id &&
                              (msg.is_read ? (
                                <HugeiconsIcon
                                  className="text-blue-400"
                                  icon={TickDouble01Icon}
                                  size={14}
                                />
                              ) : (
                                <HugeiconsIcon
                                  className="opacity-50"
                                  icon={Tick01Icon}
                                  size={14}
                                />
                              ))}
                          </span>
                        </div>
                        {/* Action buttons - appear on hover */}
                        <div
                          className={`absolute -top-2 ${msg.sender_id === user?.id ? "-left-8" : "-right-8"} flex gap-1 opacity-0 transition-opacity group-hover:opacity-100`}
                        >
                          <button
                            className="rounded-full bg-red-500/90 p-1.5 text-white shadow-lg hover:bg-red-600"
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="מחק הודעה"
                            type="button"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={12} />
                          </button>
                          {msg.sender_id !== user?.id && (
                            <button
                              className="rounded-full bg-amber-500/90 p-1.5 text-white shadow-lg hover:bg-amber-600"
                              onClick={() =>
                                setReportModal({
                                  open: true,
                                  messageId: msg.id,
                                  userId: msg.sender_id,
                                })
                              }
                              title="דווח על הודעה"
                              type="button"
                            >
                              <HugeiconsIcon icon={Flag01Icon} size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                )}
              {(isTyping || isBotTyping) && activeChat && (
                <motion.div
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                >
                  <div
                    className={`flex items-center gap-1 rounded-2xl rounded-tr-sm px-4 py-3 ${
                      isBotTyping
                        ? "border border-primary/30 bg-linear-to-r from-primary/20 to-secondary/20"
                        : "border border-white/5 bg-[#1a1a2e]"
                    }`}
                  >
                    <span
                      className={`${getTypingDotClasses(isBotTyping)} [animation-delay:-0.3s]`}
                    />
                    <span
                      className={`${getTypingDotClasses(isBotTyping)} [animation-delay:-0.15s]`}
                    />
                    <span className={getTypingDotClasses(isBotTyping)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat restriction notice for supervised accounts */}
          {isChatRestricted && activeChat && activeChat.id !== GAMERBOT_ID && (
            <div className="flex items-center justify-end gap-2 border-amber-500/20 border-t bg-amber-500/10 px-4 py-2 text-amber-400 text-fluid-sm">
              <span>הצ׳אט מוגבל לחברים בלבד - סינון תוכן מוגבר פעיל</span>
              <HugeiconsIcon icon={Shield01Icon} size={14} />
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input-area border-white/5 border-t bg-card/80 p-4 backdrop-blur-lg">
            <form
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-1.5 transition-colors focus-within:border-primary/50"
              onSubmit={handleSend}
            >
              <button
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                type="button"
              >
                <HugeiconsIcon
                  className="rotate-45"
                  icon={Add01Icon}
                  size={20}
                />
              </button>
              <input
                className="dir-rtl h-9 flex-1 bg-transparent px-2 text-right text-fluid-sm text-white outline-hidden placeholder:text-gray-600 disabled:cursor-not-allowed"
                disabled={!activeChat}
                onChange={(e) => {
                  setInput(e.target.value);
                  sendTyping();
                }}
                placeholder="כתוב הודעה..."
                type="text"
                value={input}
              />
              <button
                className="rounded-lg bg-primary p-2 text-black transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!(input.trim() && activeChat && user) || isLoading}
                title={getSendButtonTitle(
                  Boolean(user),
                  Boolean(activeChat),
                  isLoading
                )}
                type="submit"
              >
                <HugeiconsIcon
                  className={
                    input.trim() && !isLoading
                      ? "translate-x-0.5 -translate-y-0.5"
                      : ""
                  }
                  icon={SentIcon}
                  size={18}
                />
              </button>
            </form>
          </div>
        </section>
      </main>
      {/* Report Modal */}
      <ReportMessageModal
        isOpen={reportModal.open}
        messageId={reportModal.messageId}
        onClose={() =>
          setReportModal({ open: false, messageId: null, userId: null })
        }
        reportedUserId={reportModal.userId}
        reporterId={user?.id || ""}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-primary-foreground text-white">
          טוען...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
