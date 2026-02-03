'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/utils/supabase/types'
import { useAuth } from '@/context/AuthContext'
import Navigation from '@/app/components/Navigation'
import OptimizedAvatar from '@/app/components/OptimizedAvatar'
import { ChevronLeft, Crown, Gamepad2, Mic, Globe, Users, Shield, UserMinus, LogOut, X, Play } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

type Party = Database['public']['Tables']['parties']['Row']
type PartyMember = Database['public']['Tables']['party_members']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row'] | null
}

export default function PartyDetailsPage() {
    const params = useParams()
    const partyId = params.id as string
    const router = useRouter()
    const { user } = useAuth()
    const supabase = createClient()
    const [party, setParty] = useState<Party | null>(null)
    const [members, setMembers] = useState<PartyMember[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    const isLeader = user?.id === party?.leader_id
    const isMember = members.some(m => m.user_id === user?.id)

    const fetchPartyDetails = async () => {
        setLoading(true)
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
            .eq('id', partyId)
            .single()

        if (error) {
            console.error('Error fetching party:', error)
            toast.error('שגיאה בטעינת הקבוצה')
            router.push('/party-finder')
            return
        }

        setParty(data)
        setMembers((data.party_members || []).map((pm: any) => ({
            ...pm,
            profile: pm.profile
        })))
        setLoading(false)
    }

    useEffect(() => {
        fetchPartyDetails()

        const channel = supabase
            .channel(`party_${partyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'parties',
                    filter: `id=eq.${partyId}`
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        toast.info('הקבוצה נסגרה')
                        router.push('/party-finder')
                    } else if (payload.eventType === 'UPDATE') {
                        setParty(payload.new as Party)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'party_members',
                    filter: `party_id=eq.${partyId}`
                },
                () => {
                    fetchPartyDetails()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [partyId])

    const handleLeaveParty = async () => {
        if (!user) return

        setActionLoading(true)
        try {
            const response = await fetch('/api/parties/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partyId })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to leave party')
            }

            toast.success('עזבת את הקבוצה')
            router.push('/party-finder')
        } catch (error: any) {
            console.error('Error leaving party:', error)
            toast.error(error.message || 'שגיאה ביציאה מהקבוצה')
        } finally {
            setActionLoading(false)
        }
    }

    const handleKickMember = async (userId: string) => {
        if (!isLeader) return

        setActionLoading(true)
        try {
            const response = await fetch('/api/parties/kick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partyId, userId })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to kick member')
            }

            toast.success('החבר הוצא מהקבוצה')
        } catch (error: any) {
            console.error('Error kicking member:', error)
            toast.error(error.message || 'שגיאה בהוצאת החבר')
        } finally {
            setActionLoading(false)
        }
    }

    const handleCloseParty = async () => {
        if (!isLeader) return

        if (!confirm('האם אתה בטוח שברצונך לסגור את הקבוצה?')) return

        setActionLoading(true)
        try {
            const response = await fetch('/api/parties/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partyId })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to close party')
            }

            toast.success('הקבוצה נסגרה')
            router.push('/party-finder')
        } catch (error: any) {
            console.error('Error closing party:', error)
            toast.error(error.message || 'שגיאה בסגירת הקבוצה')
        } finally {
            setActionLoading(false)
        }
    }

    const handleStartGame = async () => {
        if (!isLeader) return

        setActionLoading(true)
        try {
            const { error } = await supabase
                .from('parties')
                .update({
                    status: 'in_game',
                    game_started_at: new Date().toISOString()
                })
                .eq('id', partyId)

            if (error) throw error

            toast.success('המשחק התחיל!')
        } catch (error: any) {
            console.error('Error starting game:', error)
            toast.error('שגיאה בהתחלת המשחק')
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen pb-24 md:pb-0 md:pr-64">
                <Navigation />
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        )
    }

    if (!party) {
        return null
    }

    const leaderMember = members.find(m => m.role === 'leader')
    const regularMembers = members.filter(m => m.role !== 'leader')

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64">
            <Navigation />

            <div className="pt-6 px-4 max-w-3xl mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <Link href="/party-finder" className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft className="text-white" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">פרטי קבוצה</h1>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-2">{party.title}</h2>
                            <div className="flex items-center gap-2 text-sm text-white/40">
                                <Users size={14} />
                                <span>{members.length}/{party.max_members} חברים</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(party.created_at), { addSuffix: true })}</span>
                            </div>
                        </div>
                        {party.skill_level_required && (
                            <div className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-sm font-semibold border border-purple-500/20 flex items-center gap-1.5">
                                <Shield size={14} />
                                {party.skill_level_required}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-6">
                        <span className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold border border-blue-500/20 flex items-center gap-1.5">
                            <Gamepad2 size={14} />
                            {party.game}
                        </span>
                        <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-medium border border-cyan-500/20">
                            {party.mode}
                        </span>
                        {party.mic_required && (
                            <span className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/20 flex items-center gap-1.5">
                                <Mic size={14} />
                                מיקרופון חובה
                            </span>
                        )}
                        {party.region && (
                            <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/20 flex items-center gap-1.5">
                                <Globe size={14} />
                                {party.region}
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                            <Users size={18} />
                            חברי הקבוצה
                        </h3>

                        {leaderMember && (
                            <div className="bg-white/5 rounded-xl p-4 border border-yellow-500/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-500">
                                                <OptimizedAvatar
                                                    seed={leaderMember.profile?.avatar_url || leaderMember.profile?.username || '?'}
                                                    alt={leaderMember.profile?.username || 'Leader'}
                                                    size={48}
                                                />
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
                                                <Crown size={12} className="text-black" fill="currentColor" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">{leaderMember.profile?.username}</p>
                                            <p className="text-yellow-400 text-xs font-medium">מנהיג הקבוצה</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {regularMembers.map(member => (
                            <div key={member.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                                            <OptimizedAvatar
                                                seed={member.profile?.avatar_url || member.profile?.username || '?'}
                                                alt={member.profile?.username || 'Member'}
                                                size={48}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">{member.profile?.username}</p>
                                            <p className="text-white/40 text-xs">חבר</p>
                                        </div>
                                    </div>
                                    {isLeader && member.user_id !== user?.id && (
                                        <button
                                            onClick={() => handleKickMember(member.user_id)}
                                            disabled={actionLoading}
                                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                                        >
                                            <UserMinus size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {isLeader && (
                        <>
                            {party.status === 'open' || party.status === 'full' ? (
                                <button
                                    onClick={handleStartGame}
                                    disabled={actionLoading}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    <Play size={18} />
                                    התחל משחק
                                </button>
                            ) : null}
                            <button
                                onClick={handleCloseParty}
                                disabled={actionLoading}
                                className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-red-500/20"
                            >
                                <X size={18} />
                                סגור קבוצה
                            </button>
                        </>
                    )}
                    {isMember && !isLeader && (
                        <button
                            onClick={handleLeaveParty}
                            disabled={actionLoading}
                            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            <LogOut size={18} />
                            עזוב קבוצה
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
