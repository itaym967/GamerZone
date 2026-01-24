import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/utils/supabase/server';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:support@gamerzone.app',
        vapidPublicKey,
        vapidPrivateKey
    );
}

export async function POST(request: Request) {
    if (!vapidPublicKey || !vapidPrivateKey) {
        console.error("VAPID keys not configured");
        return NextResponse.json({ error: 'VAPID keys missing' }, { status: 500 });
    }

    const { userId, title, message, url } = await request.json();
    const supabase = await createClient();

    // 1. Get subscriptions for user
    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

    if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ message: 'No subscriptions found' });
    }

    // 2. Send push to all points
    const notifications = subscriptions.map((sub: any) => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: atob(sub.p256dh).split('').map(c => c.charCodeAt(0)), // messy decode back to raw? NO.
                // web-push expects keys as string if base64? 
                // Actually the hook stored them as base64 string from array.
                // check web-push documentation: keys: { p256dh: '...', auth: '...' }
                // My hook stored them as base64. So I can pass them directly?
                // Let's decode them to be safe if web-push expects buffer or specific format.
                // Actually web-push handles base64 strings usually.
                // Let's try passing the stored strings directly first.
            }
        };

        // Re-construct proper subscription object from DB
        // The DB stores base64 strings.
        // web-push sendNotification takes `pushSubscription` object.
        const subscriptionObject = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh, // stored as base64 in hook
                auth: sub.auth      // stored as base64 in hook
            }
        };

        const payload = JSON.stringify({
            title: title,
            body: message,
            url: url
        });

        return webpush.sendNotification(subscriptionObject, payload)
            .catch((error: any) => {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    console.log('Subscription expired or invalid:', sub.endpoint);
                    return supabase.from('push_subscriptions').delete().eq('id', sub.id);
                }
                console.error('Error sending push:', error);
            });
    });

    await Promise.all(notifications);

    return NextResponse.json({ success: true });
}
