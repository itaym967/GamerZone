import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export function usePushNotifications() {
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            registerServiceWorker()
        }
    }, [])

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            })
            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)
        } catch (error) {
            console.error('Service Worker registration failed:', error)
        }
    }

    async function subscribeToPush() {
        try {
            const registration = await navigator.serviceWorker.ready
            // Fallback to hardcoded key if env var fails in Vercel (Key is public safe)
            let vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BMh2smgb3nI3qOBD7XJp6gl3jqpDcV9WC5qx3x0NZH6mphcEzVq7v_cGyFTAvtB37AGYTywnTnyMywB609EsImg'

            // Sanitize: remove whitespace, newlines, and quotes
            vapidKey = vapidKey.trim().replace(/['"]/g, '').replace(/\s/g, '');

            if (!vapidKey) {
                console.error("Missing VAPID public key")
                toast.error("שגיאת קונפיגורציה: מפתח VAPID חסר")
                return
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            })
            setSubscription(sub)
            await saveSubscription(sub)
            toast.success('התראות הופעלו בהצלחה!')
        } catch (error) {
            console.error('Failed to subscribe:', error)
            toast.error('שגיאה בהפעלת התראות')
        }
    }

    async function saveSubscription(sub: PushSubscription) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: sub.endpoint,
                p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('p256dh')!) as any)),
                auth: btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('auth')!) as any)),
            }, { onConflict: 'endpoint' })

        if (error) {
            console.error('Error saving subscription:', error)
        }
    }

    return { subscription, subscribeToPush }
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
