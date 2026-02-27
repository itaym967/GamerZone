"use client";

import {
  Add01Icon,
  ArrowLeft01Icon,
  BotIcon,
  Delete02Icon,
  GameController02Icon,
  Message01Icon,
  SparklesIcon,
  UserGroupIcon,
  UserIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import AvatarCreator from "../components/AvatarCreator";
import Logo from "../components/Logo";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form Data
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [gamertags, setGamertags] = useState<
    { platform: string; tag: string }[]
  >([]);
  const [newPlatform, setNewPlatform] = useState("Valorant");
  const [newTag, setNewTag] = useState("");

  const PLATFORMS = [
    "Valorant",
    "Fortnite",
    "Minecraft",
    "CS2",
    "Apex Legends",
    "League of Legends",
    "FIFA 24",
    "Call of Duty",
    "Roblox",
    "GTA V",
    "Overwatch 2",
    "Rocket League",
    "Rainbow Six Siege",
    "Discord",
    "Steam",
  ];

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      // Pre-fill existing data if any?
      const { data } = await supabase
        .from("profiles")
        .select("bio, avatar_url, username")
        .eq("id", user.id)
        .single();
      if (data?.bio) {
        setBio(data.bio);
      }
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
      if (!data?.avatar_url && data?.username) {
        setAvatarUrl(
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`
        );
      }
    };
    checkUser();
  }, [supabase, router]);

  const handleAddGamertag = () => {
    if (!newTag.trim()) {
      return;
    }
    if (gamertags.some((g) => g.platform === newPlatform)) {
      toast.error(`כבר קיים תיוג ל-${newPlatform}`);
      return;
    }
    setGamertags([...gamertags, { platform: newPlatform, tag: newTag }]);
    setNewTag("");
    toast.success("נוסף בהצלחה!");
  };

  const removeGamertag = (platform: string) => {
    setGamertags(gamertags.filter((g) => g.platform !== platform));
  };

  const handleComplete = async () => {
    let finalUserId = userId;

    // Fallback: Try to get user again if state is missing
    if (!finalUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        finalUserId = user.id;
        setUserId(user.id);
      }
    }

    if (!finalUserId) {
      console.error("Onboarding: No UserID set!");
      toast.error("שגיאה: משתמש לא מזוהה");
      return;
    }
    setIsLoading(true);

    try {
      // 1. Update Profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: finalUserId,
        bio,
        avatar_url: avatarUrl,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Onboarding: Profile update error", profileError);
        throw profileError;
      }

      // 2. Insert Gamertags
      if (gamertags.length > 0) {
        const tagsToInsert = gamertags.map((g) => ({
          user_id: finalUserId,
          platform: g.platform,
          tag: g.tag,
          is_hidden: false, // Default to public for now
        }));

        const { error: tagsError } = await supabase
          .from("gamertags")
          .insert(tagsToInsert);
        if (tagsError) {
          console.error("Onboarding: Tags insert error", tagsError);
          throw tagsError;
        }
      }

      toast.success("ברוכים הבאים ");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      console.error("Onboarding: Catch error", error);
      toast.error("שגיאה בשמירת הפרופיל", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-foreground p-4">
      {/* Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] h-[31.25rem] w-[31.25rem] rounded-full bg-primary/20 blur-[7.5rem]" />
      <div className="absolute bottom-[-20%] left-[-10%] h-[31.25rem] w-[31.25rem] rounded-full bg-secondary/20 blur-[7.5rem]" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-10 text-center">
          <Logo className="mb-4 justify-center" size="lg" />
          <h1 className="mb-2 font-bold text-fluid-2xl text-white">
            בוא נבנה את הפרופיל שלך
          </h1>
          <p className="text-fluid-base text-gray-400">
            אנחנו צריכים כמה פרטים כדי למצוא לך את הסקוואד המושלם
          </p>

          {/* Progress Bar */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div
              className={`h-1.5 w-10 rounded-full transition-colors ${step >= 0 ? "bg-primary" : "bg-white/10"}`}
            />
            <div
              className={`h-1.5 w-10 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-white/10"}`}
            />
            <div
              className={`h-1.5 w-10 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-white/10"}`}
            />
            <div
              className={`h-1.5 w-10 rounded-full transition-colors ${step >= 3 ? "bg-primary" : "bg-white/10"}`}
            />
            <div
              className={`h-1.5 w-10 rounded-full transition-colors ${step >= 4 ? "bg-primary" : "bg-white/10"}`}
            />
          </div>
        </div>

        <div className="min-h-[31.25rem] rounded-3xl border border-white/10 bg-card p-8 shadow-2xl backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8 text-center"
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key="step0"
              >
                <div className="py-6">
                  <div className="mx-auto mb-6 flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-linear-to-br from-primary to-secondary text-fluid-2xl">
                    🎮
                  </div>
                  <h2 className="mb-4 font-bold text-fluid-2xl text-white">
                    ברוכים הבאים ל-GamerZone!
                  </h2>
                  <p className="mx-auto mb-8 max-w-md text-gray-400">
                    הפלטפורמה המובילה לגיימרים בישראל למצוא שותפים למשחק, לשתף
                    gamertags ולבנות את הסקוואד המושלם
                  </p>

                  {/* Features Grid */}
                  <div className="mx-auto mb-8 grid max-w-lg grid-cols-2 gap-4">
                    <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/10 to-primary/5 p-4">
                      <HugeiconsIcon
                        className="mx-auto mb-2 text-primary"
                        icon={BotIcon}
                        size={32}
                      />
                      <h3 className="mb-1 font-bold text-fluid-sm text-white">
                        GamerBot AI
                      </h3>
                      <p className="text-fluid-xs text-gray-400">
                        בוט חכם שעונה על שאלות על משחקים
                      </p>
                    </div>
                    <div className="rounded-xl border border-secondary/20 bg-linear-to-br from-secondary/10 to-secondary/5 p-4">
                      <HugeiconsIcon
                        className="mx-auto mb-2 text-secondary"
                        icon={Message01Icon}
                        size={32}
                      />
                      <h3 className="mb-1 font-bold text-fluid-sm text-white">
                        צ'אט בזמן אמת
                      </h3>
                      <p className="text-fluid-xs text-gray-400">
                        שלח הודעות לשחקנים אחרים מיידית
                      </p>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/10 to-primary/5 p-4">
                      <HugeiconsIcon
                        className="mx-auto mb-2 text-primary"
                        icon={ZapIcon}
                        size={32}
                      />
                      <h3 className="mb-1 font-bold text-fluid-sm text-white">
                        Live Board
                      </h3>
                      <p className="text-fluid-xs text-gray-400">
                        מצא שחקנים שמחפשים קבוצה עכשיו
                      </p>
                    </div>
                    <div className="rounded-xl border border-secondary/20 bg-linear-to-br from-secondary/10 to-secondary/5 p-4">
                      <HugeiconsIcon
                        className="mx-auto mb-2 text-secondary"
                        icon={UserGroupIcon}
                        size={32}
                      />
                      <h3 className="mb-1 font-bold text-fluid-sm text-white">
                        גלה שחקנים
                      </h3>
                      <p className="text-fluid-xs text-gray-400">
                        חפש לפי משחק, סגנון ועוד
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    className="flex items-center gap-2 rounded-xl bg-primary px-12 py-4 font-bold text-black shadow-lg shadow-primary/20 transition-all hover:bg-primary/80"
                    onClick={nextStep}
                  >
                    <span>בוא נתחיל!</span>
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key="step1"
              >
                <div className="mb-6 flex items-center gap-3 font-bold text-fluid-lg text-white">
                  <HugeiconsIcon className="text-primary" icon={UserIcon} />
                  <span>בחר את האווטאר שלך</span>
                </div>

                <AvatarCreator
                  initialSeed={userId || ""}
                  onSelect={setAvatarUrl}
                />

                <div className="flex justify-between pt-4">
                  <button
                    className="px-6 py-3 font-medium text-gray-400 transition-colors hover:text-white"
                    onClick={prevStep}
                  >
                    חזרה
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-black transition-colors hover:bg-gray-200"
                    onClick={nextStep}
                  >
                    <span>המשך</span>
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key="step2"
              >
                <div className="mb-6 flex items-center gap-3 font-bold text-fluid-lg text-white">
                  <HugeiconsIcon className="text-primary" icon={UserIcon} />
                  <span>קצת עליך</span>
                </div>

                <div>
                  <label className="mb-2 block text-right font-medium text-fluid-sm text-gray-400">
                    הביו שלך
                  </label>
                  <textarea
                    className="h-32 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-4 text-right text-white outline-hidden focus:border-primary/50"
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="ספר קצת על סגנון המשחק שלך, באילו שעות אתה משחק, ומה אתה מחפש..."
                    value={bio}
                  />
                  <p className="mt-2 text-right text-fluid-xs text-gray-500">
                    זה מה שאנשים יראו כשהם יחפשו אותך.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    className="flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-black transition-colors hover:bg-gray-200"
                    onClick={nextStep}
                  >
                    <span>המשך</span>
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key="step3"
              >
                <div className="mb-6 flex items-center gap-3 font-bold text-fluid-lg text-white">
                  <HugeiconsIcon
                    className="text-primary"
                    icon={GameController02Icon}
                  />
                  <span>המשחקים שלך</span>
                </div>

                {/* Add Form */}
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <div className="flex gap-4">
                    <button
                      className="rounded-xl bg-primary p-3 text-black transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!newTag}
                      onClick={handleAddGamertag}
                    >
                      <HugeiconsIcon icon={Add01Icon} size={20} />
                    </button>
                    <input
                      className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-right text-white outline-hidden focus:border-primary/50"
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="הכינוי שלך..."
                      type="text"
                      value={newTag}
                    />
                    <div className="relative min-w-[7.5rem]">
                      <select
                        className="h-full w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-2 text-right text-white outline-hidden focus:border-primary/50"
                        onChange={(e) => setNewPlatform(e.target.value)}
                        value={newPlatform}
                      >
                        {PLATFORMS.map((p) => (
                          <option className="bg-card" key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tags List */}
                <div className="custom-scrollbar max-h-[12.5rem] space-y-2 overflow-y-auto pr-2">
                  {gamertags.map((g, i) => (
                    <div
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3"
                      key={i}
                    >
                      <button
                        className="text-gray-500 transition-colors hover:text-red-500"
                        onClick={() => removeGamertag(g.platform)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} />
                      </button>
                      <div className="text-right">
                        <div className="font-bold text-fluid-sm text-white">
                          {g.tag}
                        </div>
                        <div className="text-fluid-xs text-primary">
                          {g.platform}
                        </div>
                      </div>
                    </div>
                  ))}
                  {gamertags.length === 0 && (
                    <div className="py-8 text-center text-fluid-sm text-gray-500">
                      עדיין לא הוספת משחקים. הוסף לפחות אחד כדי להמשיך.
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    className="px-6 py-3 font-medium text-gray-400 transition-colors hover:text-white"
                    onClick={prevStep}
                  >
                    חזרה
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-black transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={gamertags.length === 0}
                    onClick={nextStep}
                  >
                    <span>המשך</span>
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6 text-center"
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key="step4"
              >
                <div className="flex flex-col items-center py-10">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                    <HugeiconsIcon icon={SparklesIcon} size={40} />
                  </div>
                  <h2 className="mb-2 font-bold text-fluid-xl text-white">
                    אתה מוכן ב-100%!
                  </h2>
                  <p className="mx-auto max-w-sm text-gray-400">
                    הפרופיל שלך הוגדר בהצלחה. עכשיו כל מה שנשאר זה למצוא שחקנים
                    ולהתחיל לשחק.
                  </p>
                </div>

                <div className="flex w-full justify-between pt-4">
                  <button
                    className="px-6 py-3 font-medium text-gray-400 transition-colors hover:text-white"
                    onClick={prevStep}
                  >
                    חזרה
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-xl bg-primary px-12 py-3 font-bold text-black shadow-lg shadow-primary/20 transition-all hover:bg-primary/80"
                    disabled={isLoading}
                    onClick={handleComplete}
                  >
                    {isLoading ? (
                      <span className="animate-spin text-fluid-lg">⏳</span>
                    ) : (
                      <span>יאללה מתחילים!</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
