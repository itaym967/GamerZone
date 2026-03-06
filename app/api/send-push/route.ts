import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

interface PushSubscriptionRow {
  auth: string;
  endpoint: string;
  id: string;
  p256dh: string;
}

interface PushError extends Error {
  statusCode?: number;
}

interface PushRequestBody {
  message: string;
  title: string;
  url?: string;
  userId: string;
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

const MAX_PUSH_TITLE_LENGTH = 120;
const MAX_PUSH_MESSAGE_LENGTH = 500;
const MAX_PUSH_URL_LENGTH = 500;

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const validatePushPayload = (payload: unknown) => {
  const body = payload as PushRequestBody;
  const { userId, title, message, url } = body;

  if (!(isNonEmptyString(userId) && isNonEmptyString(title))) {
    return { error: "Invalid push payload", payload: null };
  }
  if (!isNonEmptyString(message)) {
    return { error: "Invalid push payload", payload: null };
  }
  if (title.length > MAX_PUSH_TITLE_LENGTH) {
    return { error: "Title is too long", payload: null };
  }
  if (message.length > MAX_PUSH_MESSAGE_LENGTH) {
    return { error: "Message is too long", payload: null };
  }
  if (url && (typeof url !== "string" || url.length > MAX_PUSH_URL_LENGTH)) {
    return { error: "Invalid URL", payload: null };
  }

  return { error: null, payload: body };
};

const initVapid = () => {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!(vapidPublicKey && vapidPrivateKey)) {
    return NextResponse.json({ error: "VAPID keys missing" }, { status: 500 });
  }

  try {
    webpush.setVapidDetails(
      "mailto:support@gamerzone.app",
      vapidPublicKey,
      vapidPrivateKey
    );
    return null;
  } catch (error: unknown) {
    const details =
      error instanceof Error ? error.message : "Unknown VAPID error";
    return NextResponse.json(
      { error: "Invalid VAPID configuration", details },
      { status: 500 }
    );
  }
};

const isActorAllowedToNotifyTarget = async (
  supabase: ServerSupabase,
  actorId: string,
  targetUserId: string
) => {
  if (actorId === targetUserId) {
    return true;
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", actorId)
    .single();
  if (actorProfile?.role === "admin") {
    return true;
  }

  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(sender_id.eq.${actorId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${actorId})`
    )
    .limit(1)
    .maybeSingle();
  if (friendship) {
    return true;
  }

  const { data: messageExchange } = await supabase
    .from("messages")
    .select("id")
    .or(
      `and(sender_id.eq.${actorId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${actorId})`
    )
    .limit(1)
    .maybeSingle();

  return !!messageExchange;
};

const sendNotificationForSubscription = async (
  supabase: ServerSupabase,
  subscription: PushSubscriptionRow,
  title: string,
  message: string,
  url?: string
) => {
  const payload = JSON.stringify({
    title,
    body: message,
    url,
  });

  const subscriptionObject = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(subscriptionObject, payload);
  } catch (error: unknown) {
    const pushError = error as PushError;
    if (pushError.statusCode === 404 || pushError.statusCode === 410) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("id", subscription.id);
    }
  }
};

const getAuthenticatedActor = async (supabase: ServerSupabase) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
};

export async function POST(request: Request) {
  try {
    const vapidErrorResponse = initVapid();
    if (vapidErrorResponse) {
      return vapidErrorResponse;
    }

    const supabase = await createClient();
    const actor = await getAuthenticatedActor(supabase);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validationResult = validatePushPayload(await request.json());
    if (validationResult.error || !validationResult.payload) {
      return NextResponse.json(
        { error: validationResult.error ?? "Invalid push payload" },
        { status: 400 }
      );
    }

    const { userId, title, message, url } = validationResult.payload;
    const isAuthorized = await isActorAllowedToNotifyTarget(
      supabase,
      actor.id,
      userId
    );
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);
    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch subscriptions", details: fetchError.message },
        { status: 500 }
      );
    }
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: "No subscriptions found" });
    }

    const tasks = (subscriptions as PushSubscriptionRow[]).map((subscription) =>
      sendNotificationForSubscription(
        supabase,
        subscription,
        title,
        message,
        url
      )
    );
    await Promise.all(tasks);

    return NextResponse.json({ success: true, sent: subscriptions.length });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    const stack =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.stack
        : undefined;

    return NextResponse.json(
      {
        error: "Internal server error",
        details,
        stack,
      },
      { status: 500 }
    );
  }
}
