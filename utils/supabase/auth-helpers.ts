/**
 * Auth Helper Utilities
 * Handles common authentication patterns and error recovery
 */

import { createClient } from './client'
import { clearAllCachesOnAuthChange } from '@/utils/cache-utils'

/**
 * Clear all Supabase auth cookies from the browser
 * Useful for recovering from invalid session states
 */
export function clearAuthCookies() {
    if (typeof window === 'undefined') return

    // Get all cookies
    const cookies = document.cookie.split(';')
    
    // Clear Supabase auth cookies
    cookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0].trim()
        if (cookieName.startsWith('sb-') || cookieName.includes('auth-token')) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
    })
}

/**
 * Safely sign out and clear all auth state
 * Handles errors gracefully
 */
export async function safeSignOut() {
    try {
        const supabase = createClient()
        await supabase.auth.signOut()
    } catch (error) {
        console.error('Error during sign out:', error)
    } finally {
        clearAuthCookies()
        clearAllCachesOnAuthChange()
    }
}

/**
 * Check if an error is a refresh token error
 */
export function isRefreshTokenError(error: any): boolean {
    if (!error) return false
    
    const message = error.message || error.error_description || ''
    return (
        message.includes('refresh_token_not_found') ||
        message.includes('Invalid Refresh Token') ||
        message.includes('refresh token') ||
        error.code === 'refresh_token_not_found'
    )
}

/**
 * Recover from invalid session state
 * Clears cookies and redirects to login
 */
export async function recoverFromInvalidSession() {
    await safeSignOut()
    
    if (typeof window !== 'undefined') {
        // Only redirect if not already on login page
        if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login'
        }
    }
}

/**
 * Get session with error handling
 * Returns null if session is invalid or expired
 */
export async function getSafeSession() {
    try {
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
            if (isRefreshTokenError(error)) {
                await recoverFromInvalidSession()
                return null
            }
            console.error('Session error:', error)
            return null
        }
        
        return session
    } catch (error) {
        console.error('Failed to get session:', error)
        return null
    }
}
