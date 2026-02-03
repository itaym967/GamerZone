'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ChevronLeft, Gamepad2, Mic, Users, Shield } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/app/components/Navigation'
import { toast } from 'sonner'

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

const SKILL_LEVELS = ['מתחיל', 'ממוצע', 'מתקדם', 'מומחה']

export default function CreatePartyPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        game: '',
        mode: '',
        title: '',
        max_members: 5,
        skill_level_required: '',
        mic_required: false,
        region: 'ישראל',
        language: 'עברית'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: existingParty } = await supabase
                .from('parties')
                .select('id')
                .eq('leader_id', user.id)
                .in('status', ['open', 'full'])
                .single()

            if (existingParty) {
                toast.error('כבר יש לך קבוצה פעילה')
                router.push(`/party-finder/${existingParty.id}`)
                return
            }

            const { data: party, error: partyError } = await supabase
                .from('parties')
                .insert({
                    leader_id: user.id,
                    game: formData.game,
                    mode: formData.mode,
                    title: formData.title,
                    max_members: formData.max_members,
                    skill_level_required: formData.skill_level_required || null,
                    mic_required: formData.mic_required,
                    region: formData.region,
                    language: formData.language
                })
                .select()
                .single()

            if (partyError) throw partyError

            const { error: memberError } = await supabase
                .from('party_members')
                .insert({
                    party_id: party.id,
                    user_id: user.id,
                    role: 'leader'
                })

            if (memberError) throw memberError

            toast.success('הקבוצה נוצרה בהצלחה!')
            router.push(`/party-finder/${party.id}`)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'שגיאה ביצירת הקבוצה')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64">
            <Navigation />

            <div className="pt-6 px-4 max-w-lg mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <Link href="/party-finder" className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft className="text-white" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">יצירת קבוצה חדשה</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                                    onClick={() => setFormData({ ...formData, game, mode: '' })}
                                    className={`p-3 rounded-xl text-sm font-medium transition-all text-right border ${
                                        formData.game === game
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    }`}
                                >
                                    {game}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">מצב משחק</label>
                        {formData.game && (
                            <div className="flex gap-2 flex-wrap mb-2">
                                {GAME_MODES[formData.game]?.map((mode: string) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, mode })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                            formData.mode === mode
                                                ? 'bg-white text-black border-white'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                        }`}
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">שם הקבוצה</label>
                        <input
                            type="text"
                            required
                            maxLength={50}
                            placeholder="לדוגמה: מחפשים שחקן לרנקד..."
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-right"
                        />
                        <div className="text-left text-xs text-white/40">
                            {formData.title.length}/50
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                            <Users size={16} className="text-cyan-400" />
                            מספר חברים מקסימלי
                        </label>
                        <div className="flex gap-2">
                            {[2, 3, 4, 5, 6].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, max_members: num })}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
                                        formData.max_members === num
                                            ? 'bg-cyan-600 border-cyan-500 text-white'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                            <Shield size={16} className="text-purple-400" />
                            רמת מיומנות נדרשת (אופציונלי)
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, skill_level_required: '' })}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                    !formData.skill_level_required
                                        ? 'bg-white text-black border-white'
                                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                }`}
                            >
                                לא משנה
                            </button>
                            {SKILL_LEVELS.map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, skill_level_required: level })}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                        formData.skill_level_required === level
                                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/20'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

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

                    <button
                        type="submit"
                        disabled={loading || !formData.game || !formData.mode || !formData.title}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? 'יוצר קבוצה...' : 'צור קבוצה'}
                    </button>
                    <p className="text-center text-xs text-white/40">
                        הקבוצה תפוג אוטומטית תוך שעתיים.
                    </p>
                </form>
            </div>
        </div>
    )
}
