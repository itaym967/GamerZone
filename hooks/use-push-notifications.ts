import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const keyToBase64 = (key: ArrayBuffer | null) => {
  if (!key) {
    return null;
  }
  const bytes = new Uint8Array(key);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

export function usePushNotifications() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const supabase = useMemo(() => createClient(), []);

  const checkExistingSubscription = useCallback(async () => {
    try {
      // Use .ready instead of .register() to avoid double-registration
      // which can trigger SW update loops. Registration is handled by
      // ServiceWorkerRegistration component.
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Push subscription check failed:", error);
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      checkExistingSubscription();
    }
  }, [checkExistingSubscription]);

  const saveSubscription = useCallback(
    async (sub: PushSubscription) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const p256dh = keyToBase64(sub.getKey("p256dh"));
      const auth = keyToBase64(sub.getKey("auth"));
      if (!(p256dh && auth)) {
        console.error("Missing push subscription keys");
        return;
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh,
          auth,
        },
        { onConflict: "endpoint" }
      );

      if (error) {
        console.error("Error saving subscription:", error);
      }
    },
    [supabase]
  );

  const subscribeToPush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // 1. Get possible keys
      const envVarKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const hardcodedKey =
        "BMh2smgb3nI3qOBD7XJp6gl3jqpDcV9WC5qx3x0NZH6mphcEzVq7v_cGyFTAvtB37AGYTywnTnyMywB609EsImg";

      let convertedKey: Uint8Array | null = null;

      // 2. Try Env Var First
      if (envVarKey) {
        try {
          const cleanKey = envVarKey.trim().replace(/['"\s\u200b]/g, "");
          convertedKey = urlBase64ToUint8Array(cleanKey);
          console.log("Using Environment VAPID Key");
        } catch (e) {
          console.warn(
            "Environment VAPID Key failed decoding. Falling back to hardcoded.",
            e
          );
        }
      }

      // 3. Fallback if Env Var failed or missing
      if (!convertedKey) {
        try {
          convertedKey = urlBase64ToUint8Array(hardcodedKey);
          console.log("Using Hardcoded VAPID Key");
        } catch (e) {
          console.error("Hardcoded VAPID Key failed decoding!", e);
          toast.error("שגיאה קריטית: מפתח התראות פגום");
          return;
        }
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as BufferSource,
      });
      setSubscription(sub);
      await saveSubscription(sub);
      toast.success("התראות הופעלו בהצלחה!");
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("שגיאה בהפעלת התראות");
    }
  }, [saveSubscription]);

  return { subscription, subscribeToPush };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
