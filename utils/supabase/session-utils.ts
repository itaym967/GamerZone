import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROFILE_CHECK_PATHS = ['/admin', '/onboarding']
const PROTECTED_ROUTES = ['/admin', '/onboarding', '/chat', '/profile', '/settings']
const PUBLIC_AUTH_PATHS = ['/login', '/signup', '/auth', '/forgot-password', '/update-password']

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const path = request.nextUrl.pathname

    // Public auth paths - skip heavy checks
    if (PUBLIC_AUTH_PATHS.some(p => path.startsWith(p))) {
        return response
    }

    // This will refresh session if needed - required for Server Components
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        // Only fetch profile for paths that actually need it (admin, onboarding)
        const needsProfileCheck = PROFILE_CHECK_PATHS.some(p => path.startsWith(p))
        
        if (needsProfileCheck) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, onboarding_completed')
                .eq('id', user.id)
                .single()

            // Admin Check (Secure: Fail Closed)
            if (path.startsWith('/admin')) {
                if (!profile || profile.role !== 'admin') {
                    return NextResponse.redirect(new URL('/', request.url))
                }
            }

            // Onboarding Check
            if (profile) {
                if (!profile.onboarding_completed && !path.startsWith('/onboarding')) {
                    return NextResponse.redirect(new URL('/onboarding', request.url))
                }

                if (profile.onboarding_completed && path.startsWith('/onboarding')) {
                    return NextResponse.redirect(new URL('/', request.url))
                }
            }
        }
    } else {
        // Not Authenticated - protect specific routes
        if (PROTECTED_ROUTES.some(route => path.startsWith(route))) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return response
}
