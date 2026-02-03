'use client'

import { Filter } from 'lucide-react'

interface PartyFiltersProps {
    selectedGame: string | null
    selectedSkillLevel: string | null
    selectedStatus: string | null
    onGameChange: (game: string | null) => void
    onSkillLevelChange: (level: string | null) => void
    onStatusChange: (status: string | null) => void
    games: string[]
}

const SKILL_LEVELS = ['מתחיל', 'ממוצע', 'מתקדם', 'מומחה']
const STATUS_OPTIONS = [
    { value: 'open', label: 'פתוחות' },
    { value: 'full', label: 'מלאות' }
]

export default function PartyFilters({
    selectedGame,
    selectedSkillLevel,
    selectedStatus,
    onGameChange,
    onSkillLevelChange,
    onStatusChange,
    games
}: PartyFiltersProps) {
    return (
        <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <button
                    onClick={() => onGameChange(null)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        !selectedGame
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                    }`}
                >
                    כל המשחקים
                </button>
                {games.map(game => (
                    <button
                        key={game}
                        onClick={() => onGameChange(game)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                            selectedGame === game
                                ? 'bg-white text-black border-white'
                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        {game}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 items-center">
                <Filter size={16} className="text-white/40" />
                <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                    <button
                        onClick={() => onSkillLevelChange(null)}
                        className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                            !selectedSkillLevel
                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/20'
                                : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        כל הרמות
                    </button>
                    {SKILL_LEVELS.map(level => (
                        <button
                            key={level}
                            onClick={() => onSkillLevelChange(level)}
                            className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                                selectedSkillLevel === level
                                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/20'
                                    : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
