"use client";
import {
  ArrowLeft01Icon,
  GameController02Icon,
  Mic01Icon,
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

export default function CreateLFGPage() {
  const MODE_LABEL_ID = "lfg-create-mode";
  const MODE_INPUT_ID = "lfg-create-mode-input";
  const MIC_REQUIRED_ID = "lfg-create-mic-required";
  const DESCRIPTION_LABEL_ID = "lfg-create-description";
  const DESCRIPTION_INPUT_ID = "lfg-create-description-input";
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    game: "",
    mode: "",
    description: "",
    mic_required: false,
    region: "ישראל", // Always Israel
  });

  // Check auth on load? Middleware handles it mostly, but good to be safe.

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

      const { error } = await supabase.from("lfg_posts").insert({
        user_id: user.id,
        game: formData.game,
        mode: formData.mode,
        description: formData.description,
        mic_required: formData.mic_required,
        region: formData.region,
      });

      if (error) {
        throw error;
      }

      router.push("/lfg");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בפרסום המודעה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pr-64 md:pb-0">
      <Navigation />

      <div className="max-w-lg pt-6 content-shell">
        <div className="mb-6 flex items-center gap-3">
          <Link
            className="-ml-2 rounded-full p-2 transition-colors hover:bg-white/10"
            href="/lfg"
          >
            <HugeiconsIcon className="text-white" icon={ArrowLeft01Icon} />
          </Link>
          <h1 className="font-bold text-fluid-xl text-white">
            פרסום מודעה חדשה
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Game Selection */}
          <div className="space-y-2">
            <fieldset className="space-y-2">
              <legend className="mb-2 flex items-center gap-2 font-medium text-fluid-sm text-white/80">
                <HugeiconsIcon
                  className="text-purple-400"
                  icon={GameController02Icon}
                  size={16}
                />
                בחר משחק
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {GAMES.map((game) => (
                  <button
                    className={`rounded-xl border p-3 text-left font-medium text-fluid-sm transition-all ${formData.game === game ? "border-blue-500 bg-blue-600 text-white shadow-blue-500/20 shadow-lg" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}
                    key={game}
                    onClick={() => setFormData({ ...formData, game })}
                    type="button"
                  >
                    {game}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Mode Input */}
          <div className="space-y-2">
            <label
              className="font-medium text-fluid-sm text-white/80"
              htmlFor={MODE_INPUT_ID}
              id={MODE_LABEL_ID}
            >
              מצב משחק
            </label>
            {formData.game && (
              <div className="mb-2 flex flex-wrap gap-2">
                {GAME_MODES[formData.game]?.map((mode: string) => (
                  <button
                    className={`rounded-full border px-3 py-1.5 font-medium text-fluid-xs transition-all ${formData.mode === mode ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}
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
              id={MODE_INPUT_ID}
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

          {/* Mic Required */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <label
              className="flex items-center gap-2 font-medium text-fluid-sm text-white/80"
              htmlFor={MIC_REQUIRED_ID}
            >
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
              id={MIC_REQUIRED_ID}
              onChange={(e) =>
                setFormData({ ...formData, mic_required: e.target.checked })
              }
              type="checkbox"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              className="font-medium text-fluid-sm text-white/80"
              htmlFor={DESCRIPTION_INPUT_ID}
              id={DESCRIPTION_LABEL_ID}
            >
              תיאור
            </label>
            <textarea
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-white transition-colors focus:border-blue-500 focus:outline-hidden"
              id={DESCRIPTION_INPUT_ID}
              maxLength={140}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="לדוגמה: מחפש שחקן אחד לרנקד, חייב 2.0 KD..."
              required
              rows={3}
              value={formData.description}
            />
            <div className="text-right text-fluid-xs text-white/40">
              {formData.description.length}/140
            </div>
          </div>

          {/* Submit */}
          <button
            className="w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 py-4 font-bold text-fluid-lg text-white shadow-blue-600/20 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            disabled={loading || !formData.game || !formData.mode}
            type="submit"
          >
            {loading ? "מפרסם..." : "פרסם ללוח"}
          </button>
          <p className="text-center text-fluid-xs text-white/40">
            המודעה תפוג אוטומטית תוך שעה.
          </p>
        </form>
      </div>
    </div>
  );
}
