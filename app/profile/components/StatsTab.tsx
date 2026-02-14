"use client";

import { BarChart3, ArrowUpRight, ArrowDownLeft, Handshake, Users, Gamepad2, Calendar } from "lucide-react";
import type { ProfileStats } from "../types";

interface StatsTabProps {
    stats: ProfileStats;
}

export default function StatsTab({ stats }: StatsTabProps) {
    const memberSinceFormatted = stats.memberSince
        ? new Date(stats.memberSince).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'לא ידוע';

    const statCards = [
        {
            icon: ArrowUpRight,
            label: "בקשות שנשלחו",
            value: stats.swapsSent,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            icon: ArrowDownLeft,
            label: "בקשות שהתקבלו",
            value: stats.swapsReceived,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
        },
        {
            icon: Handshake,
            label: "החלפות מוצלחות",
            value: stats.swapsApproved,
            color: "text-primary",
            bg: "bg-primary/10",
            border: "border-primary/20"
        },
        {
            icon: Users,
            label: "חברים",
            value: stats.friendsCount,
            color: "text-pink-400",
            bg: "bg-pink-500/10",
            border: "border-pink-500/20"
        },
        {
            icon: Gamepad2,
            label: "משחקים",
            value: stats.gamesCount,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20"
        },
        {
            icon: Calendar,
            label: "חבר מאז",
            value: memberSinceFormatted,
            color: "text-gray-400",
            bg: "bg-white/5",
            border: "border-white/10"
        }
    ];

    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <BarChart3 size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">סטטיסטיקות</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className={`${card.bg} border ${card.border} rounded-xl p-4 transition-all hover:scale-[1.02]`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <card.icon size={16} className={card.color} />
                            <span className="text-xs text-gray-400">{card.label}</span>
                        </div>
                        <p className={`text-2xl font-bold ${card.color}`}>
                            {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Swap Success Rate */}
            {(stats.swapsSent + stats.swapsReceived) > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">אחוז הצלחה בהחלפות</span>
                        <span className="text-sm font-bold text-primary">
                            {Math.round((stats.swapsApproved / (stats.swapsSent + stats.swapsReceived)) * 100)}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                            style={{
                                width: `${Math.round((stats.swapsApproved / (stats.swapsSent + stats.swapsReceived)) * 100)}%`
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
