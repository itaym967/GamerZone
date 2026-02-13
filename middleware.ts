import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/session-utils'

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - sw.js (service worker)
         * - manifest.json (PWA manifest)
         * - offline.html (offline fallback)
         * - icons/ (PWA icons)
         * - avatars/ (avatar images)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|offline\\.html|icons/|avatars/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
