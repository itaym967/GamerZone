'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Mic, Gamepad2, Globe, Clock, MessageCircle } from 'lucide-react'
import OptimizedAvatar from '@/app/components/OptimizedAvatar'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/utils/supabase/types'

type PostWithProfile = Database['public']['Tables']['lfg_posts']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row'] | null
}

interface LFGCardProps {
    post: PostWithProfile
    currentUserId: string | null
}

export default function LFGCard({ post, currentUserId }: LFGCardProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleConnect = async () => {
        if (!currentUserId) {
            router.push('/login')
            return
        }

        if (currentUserId === post.user_id) return

        setLoading(true)
        try {
            // 1. Check if chat exists
            const { data: existingChats, error: fetchError } = await supabase
                .from('chat_participants')
                .select('chat_id')
                .eq('user_id', currentUserId)

            if (fetchError) throw fetchError

            // This is a naive check. A robust check would intersect the user's chats 
            // with the target user's chats. 
            // For MVP, we'll try to find a direct DM.
            // A better way is: Call an RPC or Edge Function to get_or_create_dm(target_id)
            // BUT, since we don't have that yet, let's just create a new chat or redirect if we can simple-find it.

            // Let's defer strict "Find existing" to a robust solution later if needed.
            // For now, let's just create a NEW chat for this interaction if we don't handle it elsewhere?
            // Actually, creating duplicate DMs is bad. 
            // Redirect to chat with target parameter
            router.push(`/chat?target=${post.user_id}`)

        } catch (error) {
            console.error('Error connecting:', error)
        } finally {
            setLoading(false)
        }
    }

    const isOwner = currentUserId === post.user_id

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all duration-300 group">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                        <OptimizedAvatar
                            seed={post.profiles?.avatar_url || post.profiles?.username || '?'}
                            alt={post.profiles?.username || 'User'}
                            size={40}
                        />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">
                        {post.profiles?.username || 'Unknown Gamer'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                        {post.region && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Globe size={10} />
                                    {post.region}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold border border-blue-500/20 flex items-center gap-1.5">
                        <Gamepad2 size={14} />
                        {post.game}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium border border-purple-500/20">
                        {post.mode}
                    </span>
                    {post.mic_required && (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/20 flex items-center gap-1.5" title="Mic Required">
                            <Mic size={14} />
                            Mic
                        </span>
                    )}
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                    {post.description}
                </p>
            </div>

            {/* Action */}
            {!isOwner && (
                <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-semibold transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white"
                >
                    <MessageCircle size={18} />
                    {loading ? 'מתחבר...' : 'התחבר'}
                </button>
            )}
            {isOwner && (
                <div className="w-full py-2.5 text-center text-white/30 text-sm italic">
                    המודעה שלך
                </div>
            )}
        </div>
    )
}
