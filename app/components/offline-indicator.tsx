"use client";
import { WifiOff01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useReducer } from "react";

interface OfflineState {
  isOffline: boolean;
  showBanner: boolean;
}

type OfflineAction =
  | { type: "ONLINE" }
  | { type: "OFFLINE" }
  | { type: "DISMISS" };

function offlineReducer(
  state: OfflineState,
  action: OfflineAction
): OfflineState {
  if (action.type === "ONLINE") {
    return { isOffline: false, showBanner: false };
  }
  if (action.type === "OFFLINE") {
    return { isOffline: true, showBanner: true };
  }
  return { ...state, showBanner: false };
}

async function hasConnectivity() {
  if (navigator.onLine) {
    return true;
  }

  try {
    await fetch("/", {
      cache: "no-store",
      method: "HEAD",
    });
    return true;
  } catch {
    return false;
  }
}

export default function OfflineIndicator() {
  const [state, dispatch] = useReducer(offlineReducer, {
    isOffline: false,
    showBanner: false,
  });

  useEffect(() => {
    let isActive = true;

    const updateConnectivity = () => {
      hasConnectivity()
        .then((isOnline) => {
          if (isActive) {
            dispatch({ type: isOnline ? "ONLINE" : "OFFLINE" });
          }
        })
        .catch(() => {
          if (isActive) {
            dispatch({ type: "OFFLINE" });
          }
        });
    };

    const handleOnline = () => {
      updateConnectivity();
    };
    const handleOffline = () => {
      updateConnectivity();
    };

    updateConnectivity();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isActive = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!(state.isOffline && state.showBanner)) {
    return null;
  }

  return (
    <div className="safe-area-pt fixed top-0 right-0 left-0 z-100 flex items-center justify-center gap-2 bg-yellow-500/90 px-4 py-2 font-medium text-black text-fluid-sm backdrop-blur-xs">
      <HugeiconsIcon icon={WifiOff01Icon} size={16} />
      <span>אתה במצב לא מקוון - חלק מהתכנים עשויים להיות לא מעודכנים</span>
      <button
        className="mr-2 text-black/70 hover:text-black"
        onClick={() => dispatch({ type: "DISMISS" })}
        type="button"
      >
        ✕
      </button>
    </div>
  );
}
