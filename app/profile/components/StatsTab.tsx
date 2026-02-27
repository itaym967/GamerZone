"use client";
import {
  Agreement01Icon,
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
  BarChartIcon,
  Calendar01Icon,
  GameController02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ProfileStats } from "../types";

interface StatsTabProps {
  stats: ProfileStats;
}

export default function StatsTab({ stats }: StatsTabProps) {
  const memberSinceFormatted = stats.memberSince
    ? new Date(stats.memberSince).toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "לא ידוע";

  const statCards = [
    {
      icon: ArrowUpRight01Icon,
      label: "בקשות שנשלחו",
      value: stats.swapsSent,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: ArrowDownLeft01Icon,
      label: "בקשות שהתקבלו",
      value: stats.swapsReceived,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      icon: Agreement01Icon,
      label: "החלפות מוצלחות",
      value: stats.swapsApproved,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      icon: UserGroupIcon,
      label: "חברים",
      value: stats.friendsCount,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    },
    {
      icon: GameController02Icon,
      label: "משחקים",
      value: stats.gamesCount,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    {
      icon: Calendar01Icon,
      label: "חבר מאז",
      value: memberSinceFormatted,
      color: "text-gray-400",
      bg: "bg-white/5",
      border: "border-white/10",
    },
  ];

  return (
    <div className="glass-panel space-y-6 rounded-2xl border border-white/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <HugeiconsIcon icon={BarChartIcon} size={24} />
        </div>
        <h2 className="font-bold text-white text-xl">סטטיסטיקות</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <div
            className={`${card.bg} border ${card.border} rounded-xl p-4 transition-all hover:scale-[1.02]`}
            key={card.label}
          >
            <div className="mb-2 flex items-center gap-2">
              <HugeiconsIcon
                className={card.color}
                icon={card.icon}
                size={16}
              />
              <span className="text-gray-400 text-xs">{card.label}</span>
            </div>
            <p className={`font-bold text-2xl ${card.color}`}>
              {typeof card.value === "number"
                ? card.value.toLocaleString()
                : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Swap Success Rate */}
      {stats.swapsSent + stats.swapsReceived > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-gray-400 text-sm">אחוז הצלחה בהחלפות</span>
            <span className="font-bold text-primary text-sm">
              {Math.round(
                (stats.swapsApproved /
                  (stats.swapsSent + stats.swapsReceived)) *
                  100
              )}
              %
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-secondary transition-all duration-500"
              style={{
                width: `${Math.round((stats.swapsApproved / (stats.swapsSent + stats.swapsReceived)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
