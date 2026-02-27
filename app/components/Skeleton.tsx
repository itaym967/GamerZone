interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

/**
 * Skeleton loader component for better perceived performance
 * Shows while content is loading instead of blank space
 */
export function Skeleton({
  className = "",
  variant = "rectangular",
}: SkeletonProps) {
  const baseClasses =
    "animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]";

  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        animation: "shimmer 2s infinite linear",
      }}
    />
  );
}

/**
 * Skeleton for GamerCard component
 */
export function GamerCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl border border-transparent p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12" variant="circular" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-1 w-24" />
          </div>
        </div>
      </div>

      <Skeleton className="mt-4 h-10 w-full" />

      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-14" />
      </div>

      <div className="mt-5 flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
}

/**
 * Skeleton for chat contact item
 */
export function ChatContactSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl p-3">
      <Skeleton className="h-10 w-10" variant="circular" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2 w-8" />
        </div>
        <Skeleton className="h-2 w-32" />
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
