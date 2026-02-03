'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/utils/supabase/types'
import { Gamepad2, Mic, Globe, Users, Shield } from 'lucide-react'
import PartyMemberSlot from './PartyMemberSlot'
import { formatDistanceToNow } from 'date-fns'

type Party = Database['public']['Tables']['parties']['Row']
type PartyMember = Database['public']['Tables']['party_members']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row'] | null
}

interface PartyCardProps {
    party: Party
    members: PartyMember[]
    currentUserId: string | null
    onJoin?: (partyId: string) => Promise<void>
}

export default function PartyCard({ party, members, currentUserId, onJoin }: PartyCardProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const isLeader = currentUserId === party.leader_id
    const isMember = members.some(m => m.user_id === currentUserId)
    const isFull = party.status === 'full' || members.length >= party.max_members
    const emptySlots = Math.max(0, party.max_members - members.length)

    const handleJoinClick = async () => {
        if (!currentUserId) {
            router.push('/login')
            return
        }

        if (isFull || isMember) return

        setLoading(true)
        try {
            if (onJoin) {
                await onJoin(party.id)
            }
        } catch (error) {
            console.error('Error joining party:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCardClick = () => {
        router.push(`/party-finder/${party.id}`)
    }

    const leaderMember = members.find(m => m.role === 'leader')
    const regularMembers = members.filter(m => m.role !== 'leader')

    return (
        <div 
            onClick={handleCardClick}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all duration-300 group cursor-pointer"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg truncate mb-1">
                        {party.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                            <Users size={12} />
                            {members.length}/{party.max_members}
                        </span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(party.created_at), { addSuffix: true })}</span>
                    </div>
                </div>
                {party.skill_level_required && (
                    <div className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold border border-purple-500/20 flex items-center gap-1.5 whitespace-nowrap">
                        <Shield size={12} />
                        {party.skill_level_required}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold border border-blue-500/20 flex items-center gap-1.5">
                    <Gamepad2 size={14} />
                    {party.game}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-medium border border-cyan-500/20">
                    {party.mode}
                </span>
                {party.mic_required && (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/20 flex items-center gap-1.5">
                        <Mic size={14} />
                        מיקרופון
                    </span>
                )}
                {party.region && (
                    <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/20 flex items-center gap-1.5">
                        <Globe size={14} />
                        {party.region}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2 mb-4">
                {leaderMember && (
                    <PartyMemberSlot
                        member={{
                            user_id: leaderMember.user_id,
                            role: leaderMember.role,
                            is_ready: leaderMember.is_ready,
                            profile: leaderMember.profile
                        }}
                        isLeader={true}
                    />
                )}
                {regularMembers.map(member => (
                    <PartyMemberSlot
                        key={member.id}
                        member={{
                            user_id: member.user_id,
                            role: member.role,
                            is_ready: member.is_ready,
                            profile: member.profile
                        }}
                    />
                ))}
                {Array.from({ length: emptySlots }).map((_, i) => (
                    <PartyMemberSlot key={`empty-${i}`} isEmpty />
                ))}
            </div>

            {!isMember && !isLeader && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleJoinClick()
                    }}
                    disabled={loading || isFull}
                    className={`w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        isFull
                            ? 'bg-white/5 text-white/30 cursor-not-allowed'
                            : 'bg-white/10 hover:bg-blue-600 text-white active:scale-[0.98]'
                    }`}
                >
                    {loading ? 'מצטרף...' : isFull ? 'קבוצה מלאה' : 'הצטרף לקבוצה'}
                </button>
            )}
            {(isMember || isLeader) && (
                <div className="w-full py-2.5 text-center text-blue-400 text-sm font-semibold">
                    {isLeader ? 'הקבוצה שלך' : 'חבר בקבוצה'}
                </div>
            )}
        </div>
    )
}
