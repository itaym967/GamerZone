"use client";

import Image from "next/image";
import { useState } from "react";

interface OptimizedAvatarProps {
  alt?: string;
  className?: string;
  seed: string;
  size?: number;
  style?: "avataaars" | "bottts" | "personas";
}

/**
 * Optimized avatar component using Next.js Image with proper caching and sizing
 * Prevents loading full-resolution images for small avatars
 */
export default function OptimizedAvatar({
  seed,
  size = 48,
  className = "",
  alt = "avatar",
  style = "bottts",
}: OptimizedAvatarProps) {
  const [error, setError] = useState(false);

  // Handle local avatar paths vs DiceBear API
  const isLocalAvatar = seed.startsWith("/avatars");
  const avatarUrl = isLocalAvatar
    ? seed
    : `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`;

  // Fallback avatar
  const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;

  if (error) {
    return (
      <Image
        alt={alt}
        className={className}
        height={size}
        src={fallbackUrl}
        unoptimized
        width={size} // SVGs don't need optimization
      />
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      height={size}
      loading="lazy"
      onError={() => setError(true)}
      quality={90}
      src={avatarUrl} // SVGs from external API don't need Next.js optimization
      unoptimized // Lazy load off-screen avatars
      width={size}
    />
  );
}
