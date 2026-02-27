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

export default function OfflineIndicator() {
  const initialOffline =
    typeof navigator !== "undefined" ? !navigator.onLine : false;
  const [state, dispatch] = useReducer(offlineReducer, {
    isOffline: initialOffline,
    showBanner: initialOffline,
  });

  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: "ONLINE" });
    };
    const handleOffline = () => {
      dispatch({ type: "OFFLINE" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
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
