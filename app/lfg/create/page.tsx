'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ChevronLeft, Gamepad2, Mic, Globe } from 'lucide-react'
import Link from 'next/link'

const GAMES = ['Fortnite', 'Call of Duty', 'FIFA', 'Valorant', 'Minecraft', 'Roblox', 'Apex Legends', 'Overwatch 2']
const MODES = ['Ranked', 'Casual', 'Creative', 'Tournament', 'Zero Build', 'Battle Royale']

export default function CreateLFGPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        game: '',
        mode: '',
        description: '',
        mic_required: false,
        region: 'EU' // Default
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
            alert('Failed to modify post')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pb-24 pt-16 px-4 max-w-lg mx-auto">
            <div className="mb-6 flex items-center gap-3">
                <Link href="/lfg" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft className="text-white" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Create Post</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Game Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                        <Gamepad2 size={16} className="text-purple-400" />
                        Select Game
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
                    <label className="text-sm font-medium text-white/80">Game Mode</label>
                    <div className="flex gap-2 flex-wrap mb-2">
                        {MODES.map(mode => (
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
                    <input
                        type="text"
                        required
                        maxLength={30}
                        placeholder="or type custom mode..."
                        value={formData.mode}
                        onChange={e => setFormData({ ...formData, mode: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Region & Mic */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                            <Globe size={16} className="text-green-400" />
                            Region
                        </label>
                        <select
                            value={formData.region}
                            onChange={e => setFormData({ ...formData, region: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none"
                        >
                            <option value="EU">Europe</option>
                            <option value="NA">North America</option>
                            <option value="SA">South America</option>
                            <option value="AS">Asia</option>
                            <option value="OC">Oceania</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 pt-6 pb-6">
                        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                            <Mic size={16} className="text-red-400" />
                            Mic Required
                        </label>
                        <input
                            type="checkbox"
                            checked={formData.mic_required}
                            onChange={e => setFormData({ ...formData, mic_required: e.target.checked })}
                            className="w-5 h-5 accent-blue-600 rounded"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Description</label>
                    <textarea
                        required
                        maxLength={140}
                        rows={3}
                        placeholder="e.g., Need 1 sweat for ranked, must have 2.0 KD..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
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
                    {loading ? 'Posting...' : 'Post to Board'}
                </button>
                <p className="text-center text-xs text-white/40">
                    Post will automatically expire in 1 hour.
                </p>

            </form>
        </div>
    )
}
