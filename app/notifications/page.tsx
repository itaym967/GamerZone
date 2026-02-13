'use client'

import { useState } from 'react'
import { Bell, CheckCheck, Trash2, ExternalLink, Info, AlertTriangle, CheckCircle, Users, MessageCircle, Gamepad2 } from 'lucide-react'
import Navigation from '../components/Navigation'
import { useAuth } from '@/context/AuthContext'
import { useNotifications, Notification } from '@/hooks/useNotifications'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    error: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    party_kick: { icon: Users, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    party_join: { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    party_close: { icon: Users, color: 'text-gray-400', bg: 'bg-gray-500/10' },
    swap_request: { icon: Gamepad2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    message: { icon: MessageCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
}

function getTypeConfig(type: string) {
    return TYPE_CONFIG[type] || TYPE_CONFIG.info
}

function formatTimeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffMin < 1) return 'עכשיו'
    if (diffMin < 60) return `לפני ${diffMin} דקות`
    if (diffHr < 24) return `לפני ${diffHr} שעות`
    if (diffDay < 7) return `לפני ${diffDay} ימים`
    return date.toLocaleDateString('he-IL')
}

function NotificationItem({
    notification,
    onMarkRead,
    onDelete
}: {
    notification: Notification
    onMarkRead: (id: string) => void
    onDelete: (id: string) => void
}) {
    const config = getTypeConfig(notification.type)
    const Icon = config.icon

    const content = (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                notification.is_read
                    ? 'bg-white/[0.02] border-white/5 opacity-60'
                    : 'bg-white/[0.05] border-white/10 shadow-lg'
            }`}
        >
            {/* Unread dot */}
            {!notification.is_read && (
                <div className="absolute top-4 left-4 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            )}

            {/* Icon */}
            <div className={`shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                <Icon size={20} className={config.color} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm leading-tight mb-1">
                    {notification.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                    {notification.message}
                </p>
                <span className="text-white/30 text-xs mt-2 block">
                    {formatTimeAgo(notification.created_at)}
                </span>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.is_read && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkRead(notification.id) }}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-blue-400 transition-colors"
                        title="סמן כנקרא"
                    >
                        <CheckCheck size={16} />
                    </button>
                )}
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(notification.id) }}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                    title="מחק"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Link indicator */}
            {notification.action_url && (
                <div className="shrink-0 self-center text-white/20">
                    <ExternalLink size={14} />
                </div>
            )}
        </motion.div>
    )

    if (notification.action_url) {
        return (
            <Link href={notification.action_url} onClick={() => !notification.is_read && onMarkRead(notification.id)}>
                {content}
            </Link>
        )
    }

    return content
}

export default function NotificationsPage() {
    const { user, isLoading: authLoading } = useAuth()
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications(user?.id)
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications

    const handleMarkAllRead = async () => {
        await markAllAsRead()
        toast.success('כל ההתראות סומנו כנקראו')
    }

    const handleDelete = async (id: string) => {
        await deleteNotification(id)
        toast.success('ההתראה נמחקה')
    }

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64 bg-[#050510]">
            <Navigation />

            <main className="p-6 max-w-2xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Bell size={20} className="text-white" />
                            </div>
                            <span>התראות</span>
                            {unreadCount > 0 && (
                                <span className="text-sm bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </h1>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 transition-colors"
                            >
                                <CheckCheck size={16} />
                                סמן הכל כנקרא
                            </button>
                        )}
                    </div>
                    <p className="text-gray-400">כל העדכונים שלך במקום אחד</p>
                </header>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                            filter === 'all'
                                ? 'bg-white text-black border-white'
                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        הכל ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                            filter === 'unread'
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        לא נקראו ({unreadCount})
                    </button>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="text-white/30" size={32} />
                        </div>
                        <h3 className="text-white font-semibold text-lg">
                            {filter === 'unread' ? 'אין התראות חדשות' : 'אין התראות'}
                        </h3>
                        <p className="text-white/40 text-sm mt-1 max-w-xs mx-auto">
                            {filter === 'unread'
                                ? 'כל ההתראות שלך נקראו!'
                                : 'כשיהיו עדכונים חדשים, הם יופיעו כאן.'
                            }
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="space-y-3">
                            {filteredNotifications.map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkRead={markAsRead}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    )
}
