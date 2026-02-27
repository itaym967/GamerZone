"use client";

import { Filter } from "lucide-react";

interface PartyFiltersProps {
  games: string[];
  onGameChange: (game: string | null) => void;
  onSkillLevelChange: (level: string | null) => void;
  onStatusChange: (status: string | null) => void;
  selectedGame: string | null;
  selectedSkillLevel: string | null;
  selectedStatus: string | null;
}

const SKILL_LEVELS = ["מתחיל", "ממוצע", "מתקדם", "מומחה"];
const _STATUS_OPTIONS = [
  { value: "open", label: "פתוחות" },
  { value: "full", label: "מלאות" },
];

export default function PartyFilters({
  selectedGame,
  selectedSkillLevel,
  selectedStatus,
  onGameChange,
  onSkillLevelChange,
  onStatusChange,
  games,
}: PartyFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        <button
          className={`whitespace-nowrap rounded-full border px-4 py-1.5 font-medium text-sm transition-all ${
            selectedGame
              ? "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              : "border-white bg-white text-black"
          }`}
          onClick={() => onGameChange(null)}
        >
          כל המשחקים
        </button>
        {games.map((game) => (
          <button
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 font-medium text-sm transition-all ${
              selectedGame === game
                ? "border-white bg-white text-black"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
            key={game}
            onClick={() => onGameChange(game)}
          >
            {game}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Filter className="text-white/40" size={16} />
        <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
          <button
            className={`whitespace-nowrap rounded-full border px-3 py-1 font-medium text-xs transition-all ${
              selectedSkillLevel
                ? "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                : "border-purple-500/20 bg-purple-500/20 text-purple-400"
            }`}
            onClick={() => onSkillLevelChange(null)}
          >
            כל הרמות
          </button>
          {SKILL_LEVELS.map((level) => (
            <button
              className={`whitespace-nowrap rounded-full border px-3 py-1 font-medium text-xs transition-all ${
                selectedSkillLevel === level
                  ? "border-purple-500/20 bg-purple-500/20 text-purple-400"
                  : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
              }`}
              key={level}
              onClick={() => onSkillLevelChange(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
