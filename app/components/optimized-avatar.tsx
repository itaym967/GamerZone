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

const HTTP_URL_REGEX = /^https?:\/\//i;

function normalizeRemoteAvatarUrl(url: string) {
  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
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
  const normalizedSeed = seed.trim();
  const safeSeed = normalizedSeed || "Gamer";

  // Support real URLs/paths and generated avatars from a plain seed.
  const isRemoteUrl = HTTP_URL_REGEX.test(safeSeed);
  const isDataUrl = safeSeed.startsWith("data:image/");
  const isLocalPath = safeSeed.startsWith("/");
  let avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(safeSeed)}&backgroundColor=transparent`;
  if (isDataUrl || isLocalPath) {
    avatarUrl = safeSeed;
  } else if (isRemoteUrl) {
    avatarUrl = normalizeRemoteAvatarUrl(safeSeed);
  }

  // Fallback avatar
  const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(safeSeed)}`;

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
