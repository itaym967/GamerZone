"use client";

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedAvatarProps {
    seed: string;
    size?: number;
    className?: string;
    alt?: string;
    style?: 'avataaars' | 'bottts' | 'personas';
}

/**
 * Optimized avatar component using Next.js Image with proper caching and sizing
 * Prevents loading full-resolution images for small avatars
 */
export default function OptimizedAvatar({
    seed,
    size = 48,
    className = '',
    alt = 'avatar',
    style = 'bottts'
}: OptimizedAvatarProps) {
    const [error, setError] = useState(false);

    // Handle local avatar paths vs DiceBear API
    const isLocalAvatar = seed.startsWith('/avatars');
    const avatarUrl = isLocalAvatar
        ? seed
        : `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`;

    // Fallback avatar
    const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;

    if (error) {
        return (
            <Image
                src={fallbackUrl}
                alt={alt}
                width={size}
                height={size}
                className={className}
                unoptimized // SVGs don't need optimization
            />
        );
    }

    return (
        <Image
            src={avatarUrl}
            alt={alt}
            width={size}
            height={size}
            className={className}
            onError={() => setError(true)}
            unoptimized // SVGs from external API don't need Next.js optimization
            loading="lazy" // Lazy load off-screen avatars
            quality={90}
        />
    );
}
