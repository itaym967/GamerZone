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
const LEGACY_AVATAR_PATH_REGEX = /^\/avatars\/([^./?#]+)(?:\.[a-z0-9]+)?$/i;

function normalizeRemoteAvatarUrl(url: string) {
  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
}

function toLegacyAvatarSeed(path: string) {
  const match = path.match(LEGACY_AVATAR_PATH_REGEX);
  if (!match?.[1]) {
    return null;
  }
  return decodeURIComponent(match[1]).replaceAll(/[-_]+/g, " ").trim();
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
  const legacyAvatarSeed = toLegacyAvatarSeed(safeSeed);
  const fallbackSeed = legacyAvatarSeed || safeSeed;

  // Support real URLs/paths and generated avatars from a plain seed.
  const isRemoteUrl = HTTP_URL_REGEX.test(safeSeed);
  const isDataUrl = safeSeed.startsWith("data:image/");
  const isLocalPath = safeSeed.startsWith("/");
  let avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(fallbackSeed)}&backgroundColor=transparent`;
  if (isDataUrl || isLocalPath) {
    avatarUrl = safeSeed;
  } else if (isRemoteUrl) {
    avatarUrl = normalizeRemoteAvatarUrl(safeSeed);
  }
  if (legacyAvatarSeed) {
    avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(legacyAvatarSeed)}&backgroundColor=transparent`;
  }

  // Fallback avatar
  const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackSeed)}`;

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
