/**
 * Hook to handle authentication errors gracefully
 * Prevents routing loops and clears invalid sessions
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { isRefreshTokenError, recoverFromInvalidSession } from '@/utils/supabase/auth-helpers'

export function useAuthErrorHandler() {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Listen for auth errors
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Handle sign-in errors
            if (event === 'SIGNED_OUT' && !session) {
                // User was signed out, possibly due to invalid token
                const currentPath = window.location.pathname
                if (!['/login', '/signup', '/'].includes(currentPath)) {
                    router.push('/login')
                }
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, router])
}

/**
 * Wrap async auth operations with error handling
 */
export async function withAuthErrorHandling<T>(
    operation: () => Promise<T>,
    onError?: (error: any) => void
): Promise<T | null> {
    try {
        return await operation()
    } catch (error: any) {
        console.error('Auth operation error:', error)
        
        if (isRefreshTokenError(error)) {
            await recoverFromInvalidSession()
        }
        
        if (onError) {
            onError(error)
        }
        
        return null
    }
}
