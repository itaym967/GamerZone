import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
}

/**
 * Skeleton loader component for better perceived performance
 * Shows while content is loading instead of blank space
 */
export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]';

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={{
                animation: 'shimmer 2s infinite linear'
            }}
        />
    );
}

/**
 * Skeleton for GamerCard component
 */
export function GamerCardSkeleton() {
    return (
        <div className="glass-panel p-5 rounded-2xl border border-transparent">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton variant="circular" className="w-12 h-12" />
                    <div className="space-y-2">
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-16 h-3" />
                        <Skeleton className="w-24 h-1" />
                    </div>
                </div>
            </div>

            <Skeleton className="mt-4 w-full h-10" />

            <div className="mt-4 flex gap-2">
                <Skeleton className="w-16 h-6" />
                <Skeleton className="w-20 h-6" />
                <Skeleton className="w-14 h-6" />
            </div>

            <div className="mt-5 flex gap-2">
                <Skeleton className="flex-1 h-10" />
                <Skeleton className="w-10 h-10" />
            </div>
        </div>
    );
}

/**
 * Skeleton for chat contact item
 */
export function ChatContactSkeleton() {
    return (
        <div className="w-full flex items-center gap-3 p-3 rounded-xl">
            <Skeleton variant="circular" className="w-10 h-10" />
            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                    <Skeleton className="w-20 h-3" />
                    <Skeleton className="w-8 h-2" />
                </div>
                <Skeleton className="w-32 h-2" />
            </div>
        </div>
    );
}

// Add shimmer animation to globals.css
export const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;
