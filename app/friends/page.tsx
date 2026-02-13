'use client'

import { useState } from 'react'
import { UserPlus, Users, Clock, Check, X, UserMinus, MessageCircle, Search } from 'lucide-react'
import Navigation from '../components/Navigation'
import OptimizedAvatar from '../components/OptimizedAvatar'
import { useAuth } from '@/context/AuthContext'
import { useFriendship, FriendWithProfile } from '@/hooks/useFriendship'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

type Tab = 'friends' | 'pending' | 'sent'

function FriendCard({
    item,
    type,
    onAccept,
    onReject,
    onUnfriend,
    onCancel
}: {
    item: FriendWithProfile
    type: Tab
    onAccept?: (id: string) => void
    onReject?: (id: string) => void
    onUnfriend?: (id: string) => void
    onCancel?: (id: string) => void
}) {
    const friend = item.friend

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group"
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <OptimizedAvatar
                    seed={friend?.avatar_url || '/avatars/gamer.png'}
                    size={48}
                    className="rounded-full bg-black border border-white/10"
                />
                {friend?.is_online && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#050510] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">
                    {friend?.username || 'Unknown'}
                </h3>
                <p className="text-white/40 text-xs truncate">
                    {friend?.bio || (friend?.is_online ? 'מחובר/ת' : 'לא מחובר/ת')}
                </p>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-2">
                {type === 'friends' && (
                    <>
                        <Link
                            href={`/chat?target=${friend?.id}`}
                            className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-blue-400 transition-colors"
                            title="שלח הודעה"
                        >
                            <MessageCircle size={18} />
                        </Link>
                        <button
                            onClick={() => onUnfriend?.(item.id)}
                            className="p-2 rounded-xl hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="הסר חבר"
                        >
                            <UserMinus size={18} />
                        </button>
                    </>
                )}

                {type === 'pending' && (
                    <>
                        <button
                            onClick={() => onAccept?.(item.id)}
                            className="p-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                            title="אשר"
                        >
                            <Check size={18} />
                        </button>
                        <button
                            onClick={() => onReject?.(item.id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="דחה"
                        >
                            <X size={18} />
                        </button>
                    </>
                )}

                {type === 'sent' && (
                    <button
                        onClick={() => onCancel?.(item.id)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 text-xs font-medium transition-colors"
                    >
                        בטל בקשה
                    </button>
                )}
            </div>
        </motion.div>
    )
}

export default function FriendsPage() {
    const { user } = useAuth()
    const {
        friends,
        pendingReceived,
        pendingSent,
        loading,
        acceptRequest,
        rejectRequest,
        unfriend,
        cancelRequest
    } = useFriendship(user?.id)

    const [activeTab, setActiveTab] = useState<Tab>('friends')
    const [searchTerm, setSearchTerm] = useState('')

    const handleAccept = async (id: string) => {
        const { error } = await acceptRequest(id)
        if (error) toast.error(error)
        else toast.success('בקשת החברות אושרה!')
    }

    const handleReject = async (id: string) => {
        const { error } = await rejectRequest(id)
        if (error) toast.error(error)
        else toast.success('הבקשה נדחתה')
    }

    const handleUnfriend = async (id: string) => {
        const { error } = await unfriend(id)
        if (error) toast.error(error)
        else toast.success('החבר הוסר')
    }

    const handleCancel = async (id: string) => {
        const { error } = await cancelRequest(id)
        if (error) toast.error(error)
        else toast.success('הבקשה בוטלה')
    }

    const currentList = activeTab === 'friends' ? friends
        : activeTab === 'pending' ? pendingReceived
        : pendingSent

    const filteredList = searchTerm
        ? currentList.filter(f =>
            f.friend?.username?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : currentList

    const onlineCount = friends.filter(f => f.friend?.is_online).length

    const tabs: { key: Tab; label: string; count: number; icon: typeof Users }[] = [
        { key: 'friends', label: 'חברים', count: friends.length, icon: Users },
        { key: 'pending', label: 'בקשות', count: pendingReceived.length, icon: Clock },
        { key: 'sent', label: 'נשלחו', count: pendingSent.length, icon: UserPlus },
    ]

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64 bg-[#050510]">
            <Navigation />

            <main className="p-6 max-w-2xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                <Users size={20} className="text-white" />
                            </div>
                            <span>חברים</span>
                        </h1>
                        {friends.length > 0 && (
                            <div className="text-sm text-white/40">
                                <span className="text-green-400 font-bold">{onlineCount}</span> מחוברים מתוך {friends.length}
                            </div>
                        )}
                    </div>
                    <p className="text-gray-400">נהל את רשימת החברים שלך</p>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                                activeTab === tab.key
                                    ? 'bg-white text-black border-white'
                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`min-w-[20px] h-5 rounded-full text-xs font-bold flex items-center justify-center px-1 ${
                                    activeTab === tab.key
                                        ? 'bg-black/20 text-black'
                                        : tab.key === 'pending' && tab.count > 0
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/10 text-white/60'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search (only for friends tab) */}
                {activeTab === 'friends' && friends.length > 3 && (
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="חפש חבר..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white outline-none focus:border-primary/50 text-right h-12 transition-all focus:bg-white/[0.08]"
                        />
                        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                )}

                {/* List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            {activeTab === 'friends' ? (
                                <Users className="text-white/30" size={32} />
                            ) : activeTab === 'pending' ? (
                                <Clock className="text-white/30" size={32} />
                            ) : (
                                <UserPlus className="text-white/30" size={32} />
                            )}
                        </div>
                        <h3 className="text-white font-semibold text-lg">
                            {activeTab === 'friends' ? 'אין חברים עדיין'
                                : activeTab === 'pending' ? 'אין בקשות ממתינות'
                                : 'לא שלחת בקשות'}
                        </h3>
                        <p className="text-white/40 text-sm mt-1 max-w-xs mx-auto">
                            {activeTab === 'friends'
                                ? 'גלה שחקנים בעמוד הגילוי ושלח להם בקשת חברות!'
                                : activeTab === 'pending'
                                    ? 'כשמישהו ישלח לך בקשת חברות, היא תופיע כאן.'
                                    : 'בקשות שתשלח יופיעו כאן עד שיאושרו.'
                            }
                        </p>
                        {activeTab === 'friends' && (
                            <Link
                                href="/explore"
                                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all text-sm"
                            >
                                <Search size={16} />
                                גלה שחקנים
                            </Link>
                        )}
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="space-y-3">
                            {filteredList.map(item => (
                                <FriendCard
                                    key={item.id}
                                    item={item}
                                    type={activeTab}
                                    onAccept={handleAccept}
                                    onReject={handleReject}
                                    onUnfriend={handleUnfriend}
                                    onCancel={handleCancel}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    )
}
