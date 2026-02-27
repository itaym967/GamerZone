"use client";

import { Refresh01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AvatarCreatorProps {
  initialSeed?: string;
  onSelect: (avatarUrl: string) => void;
}

const AVATAR_STYLES = [
  { id: "avataaars", name: "אווטאר קלאסי", emoji: "😎" },
  { id: "bottts", name: "רובוט", emoji: "🤖" },
  { id: "pixel-art", name: "פיקסל ארט", emoji: "🎮" },
  { id: "lorelei", name: "אנימה", emoji: "✨" },
  { id: "adventurer", name: "הרפתקן", emoji: "🗡️" },
  { id: "big-smile", name: "חיוך גדול", emoji: "😄" },
  { id: "fun-emoji", name: "אימוג'י", emoji: "🎭" },
  { id: "thumbs", name: "אגודל", emoji: "👍" },
];

export default function AvatarCreator({
  onSelect,
  initialSeed = "",
}: AvatarCreatorProps) {
  const [selectedStyle, setSelectedStyle] = useState("avataaars");
  const [seed, setSeed] = useState(initialSeed || `gamer-${Date.now()}`);
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const url = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}`;
    setAvatarUrl(url);
    onSelect(url);
  }, [selectedStyle, seed, onSelect]);

  const randomize = () => {
    setSeed(`gamer-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="flex justify-center">
        <motion.div
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          key={avatarUrl}
        >
          <div className="h-40 w-40 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
            <div className="h-full w-full overflow-hidden rounded-full bg-black">
              <img
                alt="Avatar Preview"
                className="h-full w-full object-cover"
                src={avatarUrl}
              />
            </div>
          </div>
          <button
            className="absolute -right-2 -bottom-2 rounded-full bg-primary p-3 text-black shadow-lg transition-all hover:scale-110 hover:bg-primary/80"
            onClick={randomize}
            title="אווטאר אקראי"
          >
            <HugeiconsIcon icon={Refresh01Icon} size={20} />
          </button>
        </motion.div>
      </div>

      {/* Style Selector */}
      <div>
        <label className="mb-3 block text-right font-medium text-gray-400 text-sm">
          בחר סגנון אווטאר
        </label>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_STYLES.map((style) => (
            <button
              className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                selectedStyle === style.id
                  ? "border-primary bg-primary/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
            >
              <div className="mb-1 text-2xl">{style.emoji}</div>
              <div className="font-medium text-white text-xs">{style.name}</div>
              {selectedStyle === style.id && (
                <div className="absolute -top-1 -right-1 rounded-full bg-primary p-0.5 text-black">
                  <HugeiconsIcon icon={Tick01Icon} size={12} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Randomize Button */}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-white transition-all hover:border-primary/50"
        onClick={randomize}
      >
        <HugeiconsIcon icon={Refresh01Icon} size={18} />
        <span>אווטאר אקראי חדש</span>
      </button>
    </div>
  );
}
