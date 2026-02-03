'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/utils/supabase/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Users } from 'lucide-react'
import PartyCard from './components/PartyCard'
import PartyFilters from './components/PartyFilters'
import { useAuth } from '@/context/AuthContext'
import Navigation from '../components/Navigation'
import { toast } from 'sonner'

type Party = Database['public']['Tables']['parties']['Row']
type PartyMember = Database['public']['Tables']['party_members']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row'] | null
}

type PartyWithMembers = Party & {
    members: PartyMember[]
}

const GAMES = ['Fortnite', 'Call of Duty', 'FIFA', 'Valorant', 'Minecraft', 'Roblox', 'Apex Legends', 'Overwatch 2']

export default function PartyFinderPage() {
    const [parties, setParties] = useState<PartyWithMembers[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedGame, setSelectedGame] = useState<string | null>(null)
    const [selectedSkillLevel, setSelectedSkillLevel] = useState<string | null>(null)
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    const fetchParties = async () => {
        setLoading(true)
        let query = supabase
            .from('parties')
            .select(`
                *,
                party_members (
                    *,
                    profile:profiles (
                        id,
                        username,
                        avatar_url,
                        is_online,
                        is_banned
                    )
                )
            `)
            .gt('expires_at', new Date().toISOString())
            .in('status', ['open', 'full'])
            .order('created_at', { ascending: false })

        if (selectedGame) {
            query = query.eq('game', selectedGame)
        }

        if (selectedSkillLevel) {
            query = query.eq('skill_level_required', selectedSkillLevel)
        }

        if (selectedStatus) {
            query = query.eq('status', selectedStatus)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching parties:', error)
            toast.error('שגיאה בטעינת קבוצות')
        } else {
            const partiesWithMembers = (data || []).map(party => ({
                ...party,
                members: (party.party_members || []).map((pm: any) => ({
                    ...pm,
                    profile: pm.profile
                }))
            }))
            setParties(partiesWithMembers as PartyWithMembers[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchParties()

        if (!document.hidden) {
            const channel = supabase
                .channel('parties_realtime')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'parties',
                        filter: selectedGame ? `game=eq.${selectedGame}` : undefined
                    },
                    async (payload) => {
                        if (!selectedGame || (payload.new as any).game === selectedGame) {
                            const { data, error } = await supabase
                                .from('parties')
                                .select(`
                                    *,
                                    party_members (
                                        *,
                                        profile:profiles (
                                            id,
                                            username,
                                            avatar_url,
                                            is_online,
                                            is_banned
                                        )
                                    )
                                `)
                                .eq('id', (payload.new as any).id)
                                .single()

                            if (data && !error) {
                                const partyWithMembers = {
                                    ...data,
                                    members: (data.party_members || []).map((pm: any) => ({
                                        ...pm,
                                        profile: pm.profile
                                    }))
                                }
                                setParties(prev => [partyWithMembers as PartyWithMembers, ...prev])
                            }
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'parties'
                    },
                    (payload) => {
                        setParties(prev =>
                            prev.map(p =>
                                p.id === (payload.new as any).id
                                    ? { ...p, ...(payload.new as Party) }
                                    : p
                            )
                        )
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'parties'
                    },
                    (payload) => {
                        setParties(prev => prev.filter(p => p.id !== (payload.old as any).id))
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [selectedGame, selectedSkillLevel, selectedStatus])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                supabase.removeAllChannels()
            } else {
                fetchParties()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [selectedGame, selectedSkillLevel, selectedStatus])

    const handleJoinParty = async (partyId: string) => {
        if (!user) {
            router.push('/login')
            return
        }

        try {
            const response = await fetch('/api/parties/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partyId })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to join party')
            }

            toast.success('הצטרפת לקבוצה בהצלחה!')
            fetchParties()
        } catch (error: any) {
            console.error('Error joining party:', error)
            toast.error(error.message || 'שגיאה בהצטרפות לקבוצה')
        }
    }

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64">
            <Navigation />

            <div className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 pt-4 pb-4 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Users size={20} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">מוצא קבוצות</h1>
                        </div>
                        <Link href="/party-finder/create">
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm shadow-lg shadow-blue-600/20 active:scale-95">
                                <Plus size={18} />
                                <span className="hidden sm:inline">צור קבוצה</span>
                                <span className="sm:hidden">צור</span>
                            </button>
                        </Link>
                    </div>

                    <PartyFilters
                        selectedGame={selectedGame}
                        selectedSkillLevel={selectedSkillLevel}
                        selectedStatus={selectedStatus}
                        onGameChange={setSelectedGame}
                        onSkillLevelChange={setSelectedSkillLevel}
                        onStatusChange={setSelectedStatus}
                        games={GAMES}
                    />
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pt-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-white/5 rounded-2xl"></div>
                        ))}
                    </div>
                ) : parties.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-white/40" size={32} />
                        </div>
                        <h3 className="text-white font-semibold text-lg">אין קבוצות פעילות</h3>
                        <p className="text-white/40 text-sm mt-1 max-w-xs mx-auto">
                            היה הראשון ליצור קבוצה בקטגוריה זו!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {parties.map(party => (
                            <PartyCard
                                key={party.id}
                                party={party}
                                members={party.members}
                                currentUserId={user?.id || null}
                                onJoin={handleJoinParty}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
