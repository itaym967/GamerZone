'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/utils/supabase/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
import LFGCard from './components/LFGCard'
import { useAuth } from '@/context/AuthContext'
import Navigation from '../components/Navigation'

type PostWithProfile = Database['public']['Tables']['lfg_posts']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row'] | null
}

const GAMES = ['Fortnite', 'Call of Duty', 'FIFA', 'Valorant', 'Minecraft', 'Roblox', 'Apex Legends', 'Overwatch 2']

export default function LFGPage() {
    const [posts, setPosts] = useState<PostWithProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedGame, setSelectedGame] = useState<string | null>(null)
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    const fetchPosts = async () => {
        setLoading(true)
        let query = supabase
            .from('lfg_posts')
            .select(`
        *,
        profiles (
          id,
          username,
          avatar_url,
          is_banned
        )
      `)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })

        if (selectedGame) {
            query = query.eq('game', selectedGame)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching posts:', error)
        } else {
            setPosts(data as PostWithProfile[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPosts()

        // Real-time Subscription
        const channel = supabase
            .channel('lfg_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'lfg_posts',
                },
                async (payload) => {
                    // Fetch the full post with profile to prepend
                    const { data, error } = await supabase
                        .from('lfg_posts')
                        .select(`
                    *,
                    profiles (
                    id,
                    username,
                    avatar_url,
                    is_banned
                    )
                `)
                        .eq('id', payload.new.id)
                        .single()

                    if (data && !error) {
                        setPosts((prev) => [data as PostWithProfile, ...prev])
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedGame])

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64">
            <Navigation />

            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 pt-4 pb-4 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-white">לוח חיפוש שחקנים</h1>
                        <Link href="/lfg/create">
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm shadow-lg shadow-blue-600/20 active:scale-95">
                                <Plus size={18} />
                                <span className="hidden sm:inline">פרסם מודעה</span>
                                <span className="sm:hidden">פרסם</span>
                            </button>
                        </Link>
                    </div>

                    {/* Game Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        <button
                            onClick={() => setSelectedGame(null)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${!selectedGame ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                        >
                            כל המשחקים
                        </button>
                        {GAMES.map(game => (
                            <button
                                key={game}
                                onClick={() => setSelectedGame(game)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${selectedGame === game ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                            >
                                {game}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div className="max-w-4xl mx-auto px-4 pt-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-40 bg-white/5 rounded-2xl"></div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-white/40" size={32} />
                        </div>
                        <h3 className="text-white font-semibold text-lg">אין מודעות פעילות</h3>
                        <p className="text-white/40 text-sm mt-1 max-w-xs mx-auto">
                            היה הראשון לחפש קבוצה בקטגוריה זו!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {posts.map(post => (
                            <LFGCard key={post.id} post={post} currentUserId={user?.id || null} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
