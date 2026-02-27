"use client";
import {
  ArrowLeft01Icon,
  GameController02Icon,
  Mic01Icon,
  Shield01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Navigation from "@/app/components/Navigation";
import { createClient } from "@/lib/supabase/client";

const GAMES = [
  "Fortnite",
  "Call of Duty",
  "FIFA",
  "Valorant",
  "Minecraft",
  "Roblox",
  "Apex Legends",
  "Overwatch 2",
];

const GAME_MODES: { [key: string]: string[] } = {
  Fortnite: [
    "Battle Royale",
    "Zero Build",
    "Ranked",
    "Creative",
    "Team Rumble",
    "Arena",
  ],
  "Call of Duty": [
    "Multiplayer",
    "Warzone",
    "Ranked",
    "Search & Destroy",
    "Team Deathmatch",
    "Domination",
  ],
  FIFA: [
    "Ultimate Team",
    "Career Mode",
    "Pro Clubs",
    "Seasons",
    "Friendlies",
    "Volta",
  ],
  Valorant: [
    "Unrated",
    "Competitive",
    "Spike Rush",
    "Deathmatch",
    "Escalation",
    "Team Deathmatch",
  ],
  Minecraft: [
    "Survival",
    "Creative",
    "Hardcore",
    "Adventure",
    "Skyblock",
    "Bedwars",
  ],
  Roblox: ["Roleplay", "Obby", "Tycoon", "Simulator", "Fighting", "Racing"],
  "Apex Legends": ["Battle Royale", "Ranked", "Arenas", "Control", "Mixtape"],
  "Overwatch 2": [
    "Quick Play",
    "Competitive",
    "Arcade",
    "Custom Games",
    "Mystery Heroes",
  ],
};

const SKILL_LEVELS = ["מתחיל", "ממוצע", "מתקדם", "מומחה"];

export default function CreatePartyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    game: "",
    mode: "",
    title: "",
    max_members: 5,
    skill_level_required: "",
    mic_required: false,
    region: "ישראל",
    language: "עברית",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data: existingParty } = await supabase
        .from("parties")
        .select("id")
        .eq("leader_id", user.id)
        .in("status", ["open", "full"])
        .single();

      if (existingParty) {
        toast.error("כבר יש לך קבוצה פעילה");
        router.push(`/party-finder/${existingParty.id}`);
        return;
      }

      const { data: party, error: partyError } = await supabase
        .from("parties")
        .insert({
          leader_id: user.id,
          game: formData.game,
          mode: formData.mode,
          title: formData.title,
          max_members: formData.max_members,
          skill_level_required: formData.skill_level_required || null,
          mic_required: formData.mic_required,
          region: formData.region,
          language: formData.language,
        })
        .select()
        .single();

      if (partyError) {
        throw partyError;
      }

      const { error: memberError } = await supabase
        .from("party_members")
        .insert({
          party_id: party.id,
          user_id: user.id,
          role: "leader",
        });

      if (memberError) {
        throw memberError;
      }

      toast.success("הקבוצה נוצרה בהצלחה!");
      router.push(`/party-finder/${party.id}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "שגיאה ביצירת הקבוצה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pr-64 md:pb-0">
      <Navigation />

      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="mb-6 flex items-center gap-3">
          <Link
            className="-mr-2 rounded-full p-2 transition-colors hover:bg-white/10"
            href="/party-finder"
          >
            <HugeiconsIcon className="text-white" icon={ArrowLeft01Icon} />
          </Link>
          <h1 className="font-bold text-2xl text-white">יצירת קבוצה חדשה</h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium text-sm text-white/80">
              <HugeiconsIcon
                className="text-purple-400"
                icon={GameController02Icon}
                size={16}
              />
              בחר משחק
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GAMES.map((game) => (
                <button
                  className={`rounded-xl border p-3 text-right font-medium text-sm transition-all ${
                    formData.game === game
                      ? "border-blue-500 bg-blue-600 text-white shadow-blue-500/20 shadow-lg"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                  key={game}
                  onClick={() => setFormData({ ...formData, game, mode: "" })}
                  type="button"
                >
                  {game}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-sm text-white/80">
              מצב משחק
            </label>
            {formData.game && (
              <div className="mb-2 flex flex-wrap gap-2">
                {GAME_MODES[formData.game]?.map((mode: string) => (
                  <button
                    className={`rounded-full border px-3 py-1.5 font-medium text-xs transition-all ${
                      formData.mode === mode
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                    key={mode}
                    onClick={() => setFormData({ ...formData, mode })}
                    type="button"
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-white transition-colors focus:border-blue-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!formData.game}
              maxLength={30}
              onChange={(e) =>
                setFormData({ ...formData, mode: e.target.value })
              }
              placeholder={
                formData.game
                  ? "או הקלד מצב משחק מותאם אישית..."
                  : "בחר משחק תחילה..."
              }
              required
              type="text"
              value={formData.mode}
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-sm text-white/80">
              שם הקבוצה
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-white transition-colors focus:border-blue-500 focus:outline-hidden"
              maxLength={50}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="לדוגמה: מחפשים שחקן לרנקד..."
              required
              type="text"
              value={formData.title}
            />
            <div className="text-left text-white/40 text-xs">
              {formData.title.length}/50
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium text-sm text-white/80">
              <HugeiconsIcon
                className="text-cyan-400"
                icon={UserGroupIcon}
                size={16}
              />
              מספר חברים מקסימלי
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  className={`flex-1 rounded-xl border py-2 font-medium text-sm transition-all ${
                    formData.max_members === num
                      ? "border-cyan-500 bg-cyan-600 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                  key={num}
                  onClick={() => setFormData({ ...formData, max_members: num })}
                  type="button"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium text-sm text-white/80">
              <HugeiconsIcon
                className="text-purple-400"
                icon={Shield01Icon}
                size={16}
              />
              רמת מיומנות נדרשת (אופציונלי)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-full border px-3 py-1.5 font-medium text-xs transition-all ${
                  formData.skill_level_required
                    ? "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    : "border-white bg-white text-black"
                }`}
                onClick={() =>
                  setFormData({ ...formData, skill_level_required: "" })
                }
                type="button"
              >
                לא משנה
              </button>
              {SKILL_LEVELS.map((level) => (
                <button
                  className={`rounded-full border px-3 py-1.5 font-medium text-xs transition-all ${
                    formData.skill_level_required === level
                      ? "border-purple-500/20 bg-purple-500/20 text-purple-400"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                  key={level}
                  onClick={() =>
                    setFormData({ ...formData, skill_level_required: level })
                  }
                  type="button"
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <label className="flex items-center gap-2 font-medium text-sm text-white/80">
              <HugeiconsIcon
                className="text-red-400"
                icon={Mic01Icon}
                size={16}
              />
              מיקרופון חובה
            </label>
            <input
              checked={formData.mic_required}
              className="h-5 w-5 rounded-xs accent-blue-600"
              onChange={(e) =>
                setFormData({ ...formData, mic_required: e.target.checked })
              }
              type="checkbox"
            />
          </div>

          <button
            className="w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 py-4 font-bold text-lg text-white shadow-blue-600/20 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            disabled={
              loading || !formData.game || !formData.mode || !formData.title
            }
            type="submit"
          >
            {loading ? "יוצר קבוצה..." : "צור קבוצה"}
          </button>
          <p className="text-center text-white/40 text-xs">
            הקבוצה תפוג אוטומטית תוך שעתיים.
          </p>
        </form>
      </div>
    </div>
  );
}
