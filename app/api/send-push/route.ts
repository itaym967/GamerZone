import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/utils/supabase/server";

// Remove top-level setVapidDetails configuration to prevent build-time errors

export async function POST(request: Request) {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    console.log("VAPID Keys present:", {
      public: !!vapidPublicKey,
      private: !!vapidPrivateKey,
    });

    if (!(vapidPublicKey && vapidPrivateKey)) {
      console.error("VAPID keys not configured");
      return NextResponse.json(
        { error: "VAPID keys missing" },
        { status: 500 }
      );
    }

    try {
      webpush.setVapidDetails(
        "mailto:support@gamerzone.app",
        vapidPublicKey,
        vapidPrivateKey
      );
    } catch (err: any) {
      console.error("Failed to set VAPID details:", err);
      return NextResponse.json(
        { error: "Invalid VAPID configuration", details: err.message },
        { status: 500 }
      );
    }

    const { userId, title, message, url } = await request.json();
    console.log("Push request for user:", userId);

    const supabase = await createClient();

    // 1. Get subscriptions for user
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found for user:", userId);
      return NextResponse.json({ message: "No subscriptions found" });
    }

    console.log(`Found ${subscriptions.length} subscription(s)`);

    // 2. Send push to all endpoints
    const notifications = subscriptions.map((sub: any) => {
      const subscriptionObject = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      const payload = JSON.stringify({
        title,
        body: message,
        url,
      });

      return webpush
        .sendNotification(subscriptionObject, payload)
        .then(() => {
          console.log(
            "Push sent successfully to:",
            `${sub.endpoint.substring(0, 50)}...`
          );
        })
        .catch((error: any) => {
          console.error("Error sending push:", error);
          if (error.statusCode === 404 || error.statusCode === 410) {
            console.log("Subscription expired, deleting:", sub.id);
            return supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }
        });
    });

    await Promise.all(notifications);

    return NextResponse.json({ success: true, sent: subscriptions.length });
  } catch (error: any) {
    console.error("Unexpected error in send-push:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
