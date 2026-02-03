'use client'

import OptimizedAvatar from '@/app/components/OptimizedAvatar'
import { Crown, Plus } from 'lucide-react'
import { Database } from '@/utils/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface PartyMemberSlotProps {
    member?: {
        user_id: string
        role: string
        is_ready: boolean | null
        profile: Profile | null
    }
    isEmpty?: boolean
    isLeader?: boolean
}

export default function PartyMemberSlot({ member, isEmpty, isLeader }: PartyMemberSlotProps) {
    if (isEmpty) {
        return (
            <div className="relative w-12 h-12 rounded-full bg-white/5 border-2 border-white/10 border-dashed flex items-center justify-center group-hover:border-white/20 transition-colors">
                <Plus size={20} className="text-white/30" />
            </div>
        )
    }

    if (!member?.profile) return null

    return (
        <div className="relative w-12 h-12 group/member">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/20 group-hover/member:border-blue-400 transition-colors">
                <OptimizedAvatar
                    seed={member.profile.avatar_url || member.profile.username || '?'}
                    alt={member.profile.username || 'Member'}
                    size={48}
                />
            </div>
            {isLeader && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-[#0a0a0a] shadow-lg">
                    <Crown size={12} className="text-black" fill="currentColor" />
                </div>
            )}
            {member.is_ready && !isLeader && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
            )}
            <div className="absolute inset-0 opacity-0 group-hover/member:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {member.profile.username}
                </div>
            </div>
        </div>
    )
}
