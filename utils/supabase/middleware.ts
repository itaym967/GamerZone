import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

    // This will refresh session if needed - required for Server Components
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Public paths that never need auth (mostly static assets, api headers, etc handled by matcher)
    // But strictly allowing auth pages
    if (path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/auth')) {
        // Optional: If user is logged in, redirect to dashboard? 
        // For now, let them access (maybe they want to switch accounts)
        return response
    }

    // Protected Routes Logic
    if (user) {
        // Get extended profile data
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, onboarding_completed')
            .eq('id', user.id)
            .single()

        // 2. Admin Check (Secure: Fail Closed)
        if (path.startsWith('/admin')) {
            if (!profile || profile.role !== 'admin') {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }

        // 1. Onboarding Check
        if (profile) {
            if (!profile.onboarding_completed && !path.startsWith('/onboarding')) {
                // Force redirect to onboarding if not completed
                return NextResponse.redirect(new URL('/onboarding', request.url))
            }

            if (profile.onboarding_completed && path.startsWith('/onboarding')) {
                // Prevent re-entry to onboarding if completed
                return NextResponse.redirect(new URL('/', request.url))
            }
        }
    } else {
        // Not Authenticated
        // Protect specific routes
        const protectedRoutes = ['/admin', '/onboarding', '/chat', '/profile', '/settings']
        // Dashboard might be protected or public? "Dashboard" in app usually implies auth. 
        // The implementation plan says "/dashboard (or root)".
        // app/page.tsx is the dashboard currently. Let's make it protected? 
        // Usually landing is public, but here "Dashboard" seems to be the main app.
        // Let's assume root is protected if it's the dashboard. 
        // Wait, explore is public? "Explore" page implementation showed no Auth requirement logic. 
        // Let's protect explicitly named routes for now and maybe root?
        // If I protect root, then landing page needs to be separate. 
        // Let's just protect clear "User" routes.

        if (protectedRoutes.some(route => path.startsWith(route))) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return response
}
