'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ChevronLeft, Gamepad2, Mic } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/app/components/Navigation'

const GAMES = ['Fortnite', 'Call of Duty', 'FIFA', 'Valorant', 'Minecraft', 'Roblox', 'Apex Legends', 'Overwatch 2']

const GAME_MODES: { [key: string]: string[] } = {
    'Fortnite': ['Battle Royale', 'Zero Build', 'Ranked', 'Creative', 'Team Rumble', 'Arena'],
    'Call of Duty': ['Multiplayer', 'Warzone', 'Ranked', 'Search & Destroy', 'Team Deathmatch', 'Domination'],
    'FIFA': ['Ultimate Team', 'Career Mode', 'Pro Clubs', 'Seasons', 'Friendlies', 'Volta'],
    'Valorant': ['Unrated', 'Competitive', 'Spike Rush', 'Deathmatch', 'Escalation', 'Team Deathmatch'],
    'Minecraft': ['Survival', 'Creative', 'Hardcore', 'Adventure', 'Skyblock', 'Bedwars'],
    'Roblox': ['Roleplay', 'Obby', 'Tycoon', 'Simulator', 'Fighting', 'Racing'],
    'Apex Legends': ['Battle Royale', 'Ranked', 'Arenas', 'Control', 'Mixtape'],
    'Overwatch 2': ['Quick Play', 'Competitive', 'Arcade', 'Custom Games', 'Mystery Heroes']
}

export default function CreateLFGPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        game: '',
        mode: '',
        description: '',
        mic_required: false,
        region: 'ישראל' // Always Israel
    })

    // Check auth on load? Middleware handles it mostly, but good to be safe.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('lfg_posts')
                // @ts-ignore - Types mismatch with generated Database but runtime is correct
                .insert({
                    user_id: user.id,
                    game: formData.game,
                    mode: formData.mode,
                    description: formData.description,
                    mic_required: formData.mic_required,
                    region: formData.region
                })

            if (error) throw error

            router.push('/lfg')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('שגיאה בפרסום המודעה')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64">
            <Navigation />

            <div className="pt-6 px-4 max-w-lg mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <Link href="/lfg" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft className="text-white" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">פרסום מודעה חדשה</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Game Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                            <Gamepad2 size={16} className="text-purple-400" />
                            בחר משחק
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {GAMES.map(game => (
                                <button
                                    key={game}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, game })}
                                    className={`p-3 rounded-xl text-sm font-medium transition-all text-left border ${formData.game === game ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                                >
                                    {game}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">מצב משחק</label>
                        {formData.game && (
                            <div className="flex gap-2 flex-wrap mb-2">
                                {GAME_MODES[formData.game]?.map((mode: string) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, mode })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${formData.mode === mode ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        )}
                        <input
                            type="text"
                            required
                            maxLength={30}
                            placeholder={formData.game ? "או הקלד מצב משחק מותאם אישית..." : "בחר משחק תחילה..."}
                            value={formData.mode}
                            onChange={e => setFormData({ ...formData, mode: e.target.value })}
                            disabled={!formData.game}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-right disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Mic Required */}
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                            <Mic size={16} className="text-red-400" />
                            מיקרופון חובה
                        </label>
                        <input
                            type="checkbox"
                            checked={formData.mic_required}
                            onChange={e => setFormData({ ...formData, mic_required: e.target.checked })}
                            className="w-5 h-5 accent-blue-600 rounded"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">תיאור</label>
                        <textarea
                            required
                            maxLength={140}
                            rows={3}
                            placeholder="לדוגמה: מחפש שחקן אחד לרנקד, חייב 2.0 KD..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none text-right"
                        />
                        <div className="text-right text-xs text-white/40">
                            {formData.description.length}/140
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !formData.game || !formData.mode}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? 'מפרסם...' : 'פרסם ללוח'}
                    </button>
                    <p className="text-center text-xs text-white/40">
                        המודעה תפוג אוטומטית תוך שעה.
                    </p>

                </form>
            </div>
        </div>
    )
}
