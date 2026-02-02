"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Gamepad2, User, Sparkles, Bot, MessageSquare, Zap, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Logo from "../components/Logo";
import AvatarCreator from "../components/AvatarCreator";

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Form Data
    const [avatarUrl, setAvatarUrl] = useState("");
    const [bio, setBio] = useState("");
    const [gamertags, setGamertags] = useState<{ platform: string; tag: string }[]>([]);
    const [newPlatform, setNewPlatform] = useState("Valorant");
    const [newTag, setNewTag] = useState("");

    const PLATFORMS = [
        "Valorant", "Fortnite", "Minecraft", "CS2", "Apex Legends",
        "League of Legends", "FIFA 24", "Call of Duty", "Roblox",
        "GTA V", "Overwatch 2", "Rocket League", "Rainbow Six Siege",
        "Discord", "Steam"
    ];

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUserId(user.id);
            // Pre-fill existing data if any?
            const { data } = await supabase.from('profiles').select('bio, avatar_url, username').eq('id', user.id).single();
            if (data?.bio) setBio(data.bio);
            if (data?.avatar_url) setAvatarUrl(data.avatar_url);
            if (!data?.avatar_url && data?.username) {
                setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`);
            }
        };
        checkUser();
    }, [supabase, router]);

    const handleAddGamertag = () => {
        if (!newTag.trim()) return;
        if (gamertags.some(g => g.platform === newPlatform)) {
            toast.error(`כבר קיים תיוג ל-${newPlatform}`);
            return;
        }
        setGamertags([...gamertags, { platform: newPlatform, tag: newTag }]);
        setNewTag("");
        toast.success("נוסף בהצלחה!");
    };

    const removeGamertag = (platform: string) => {
        setGamertags(gamertags.filter(g => g.platform !== platform));
    };

    const handleComplete = async () => {
        let finalUserId = userId;

        // Fallback: Try to get user again if state is missing
        if (!finalUserId) {
            const { data: { user } } = await supabase.auth.getUser();
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
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: finalUserId,
                    bio: bio,
                    avatar_url: avatarUrl,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                console.error("Onboarding: Profile update error", profileError);
                throw profileError;
            }

            // 2. Insert Gamertags
            if (gamertags.length > 0) {
                const tagsToInsert = gamertags.map(g => ({
                    user_id: finalUserId,
                    platform: g.platform,
                    tag: g.tag,
                    is_hidden: false // Default to public for now
                }));

                const { error: tagsError } = await supabase.from('gamertags').insert(tagsToInsert);
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

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    return (
        <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px]" />

            <div className="w-full max-w-2xl relative z-10">
                <div className="text-center mb-10">
                    <Logo size="lg" className="justify-center mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">בוא נבנה את הפרופיל שלך</h1>
                    <p className="text-gray-400">אנחנו צריכים כמה פרטים כדי למצוא לך את הסקוואד המושלם</p>

                    {/* Progress Bar */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <div className={`h-1.5 w-10 rounded-full transition-colors ${step >= 0 ? 'bg-primary' : 'bg-white/10'}`} />
                        <div className={`h-1.5 w-10 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`} />
                        <div className={`h-1.5 w-10 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`} />
                        <div className={`h-1.5 w-10 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-white/10'}`} />
                        <div className={`h-1.5 w-10 rounded-full transition-colors ${step >= 4 ? 'bg-primary' : 'bg-white/10'}`} />
                    </div>
                </div>

                <div className="bg-[#0e0e1b] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8 text-center"
                            >
                                <div className="py-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">
                                        🎮
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-4">ברוכים הבאים ל-GamerZone!</h2>
                                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                                        הפלטפורמה המובילה לגיימרים בישראל למצוא שותפים למשחק, לשתף gamertags ולבנות את הסקוואד המושלם
                                    </p>

                                    {/* Features Grid */}
                                    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
                                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
                                            <Bot className="text-primary mx-auto mb-2" size={32} />
                                            <h3 className="text-white font-bold text-sm mb-1">GamerBot AI</h3>
                                            <p className="text-xs text-gray-400">בוט חכם שעונה על שאלות על משחקים</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-xl p-4">
                                            <MessageSquare className="text-secondary mx-auto mb-2" size={32} />
                                            <h3 className="text-white font-bold text-sm mb-1">צ'אט בזמן אמת</h3>
                                            <p className="text-xs text-gray-400">שלח הודעות לשחקנים אחרים מיידית</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
                                            <Zap className="text-primary mx-auto mb-2" size={32} />
                                            <h3 className="text-white font-bold text-sm mb-1">Live Board</h3>
                                            <p className="text-xs text-gray-400">מצא שחקנים שמחפשים קבוצה עכשיו</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-xl p-4">
                                            <Users className="text-secondary mx-auto mb-2" size={32} />
                                            <h3 className="text-white font-bold text-sm mb-1">גלה שחקנים</h3>
                                            <p className="text-xs text-gray-400">חפש לפי משחק, סגנון ועוד</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center pt-4">
                                    <button onClick={nextStep} className="bg-primary text-black font-bold py-4 px-12 rounded-xl hover:bg-primary/80 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                                        <span>בוא נתחיל!</span>
                                        <ArrowLeft size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 text-xl font-bold text-white mb-6">
                                    <User className="text-primary" />
                                    <span>בחר את האווטאר שלך</span>
                                </div>

                                <AvatarCreator
                                    onSelect={setAvatarUrl}
                                    initialSeed={userId || ""}
                                />

                                <div className="flex justify-between pt-4">
                                    <button onClick={prevStep} className="text-gray-400 hover:text-white font-medium py-3 px-6 transition-colors">
                                        חזרה
                                    </button>
                                    <button onClick={nextStep} className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2">
                                        <span>המשך</span>
                                        <ArrowLeft size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 text-xl font-bold text-white mb-6">
                                    <User className="text-primary" />
                                    <span>קצת עליך</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2 text-right">הביו שלך</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="ספר קצת על סגנון המשחק שלך, באילו שעות אתה משחק, ומה אתה מחפש..."
                                        className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-primary/50 text-right resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2 text-right">זה מה שאנשים יראו כשהם יחפשו אותך.</p>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button onClick={nextStep} className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2">
                                        <span>המשך</span>
                                        <ArrowLeft size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 text-xl font-bold text-white mb-6">
                                    <Gamepad2 className="text-primary" />
                                    <span>המשחקים שלך</span>
                                </div>

                                {/* Add Form */}
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleAddGamertag}
                                            disabled={!newTag}
                                            className="bg-primary hover:bg-primary/80 text-black p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={20} />
                                        </button>
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="הכינוי שלך..."
                                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 text-white outline-none focus:border-primary/50 text-right"
                                        />
                                        <div className="relative min-w-[120px]">
                                            <select
                                                value={newPlatform}
                                                onChange={(e) => setNewPlatform(e.target.value)}
                                                className="w-full h-full bg-black/20 border border-white/10 rounded-xl px-2 text-white outline-none focus:border-primary/50 text-right appearance-none"
                                            >
                                                {PLATFORMS.map(p => <option key={p} value={p} className="bg-[#0e0e1b]">{p}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Tags List */}
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {gamertags.map((g, i) => (
                                        <div key={i} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                            <button onClick={() => removeGamertag(g.platform)} className="text-gray-500 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="text-right">
                                                <div className="text-white font-bold text-sm">{g.tag}</div>
                                                <div className="text-xs text-primary">{g.platform}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {gamertags.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            עדיין לא הוספת משחקים. הוסף לפחות אחד כדי להמשיך.
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button onClick={prevStep} className="text-gray-400 hover:text-white font-medium py-3 px-6 transition-colors">
                                        חזרה
                                    </button>
                                    <button
                                        onClick={nextStep}
                                        disabled={gamertags.length === 0}
                                        className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>המשך</span>
                                        <ArrowLeft size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 text-center"
                            >
                                <div className="py-10 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6">
                                        <Sparkles size={40} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">אתה מוכן ב-100%!</h2>
                                    <p className="text-gray-400 max-w-sm mx-auto">
                                        הפרופיל שלך הוגדר בהצלחה. עכשיו כל מה שנשאר זה למצוא שחקנים ולהתחיל לשחק.
                                    </p>
                                </div>

                                <div className="flex justify-between pt-4 w-full">
                                    <button onClick={prevStep} className="text-gray-400 hover:text-white font-medium py-3 px-6 transition-colors">
                                        חזרה
                                    </button>
                                    <button
                                        onClick={handleComplete}
                                        disabled={isLoading}
                                        className="bg-primary text-black font-bold py-3 px-12 rounded-xl hover:bg-primary/80 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        {isLoading ? <span className="animate-spin text-xl">⏳</span> : <span>יאללה מתחילים!</span>}
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
