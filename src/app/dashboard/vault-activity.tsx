
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "diaryvault_inactivity_minutes";
const DEFAULT_MINUTES = 5;
const ALLOWED_MINUTES = [1, 2, 5, 10, 15, 20, 30];
const CHANGE_EVENT = "diaryvault:inactivity-minutes-changed";

function getSavedMinutes(): number {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));

    if (ALLOWED_MINUTES.includes(saved)) {
      return saved;
    }
  } catch {
    // Use the default if browser storage is unavailable.
  }

  return DEFAULT_MINUTES;
}

export default function VaultActivity({
  children,
}: {
  children: React.ReactNode;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locking = useRef(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [inactivityMinutes, setInactivityMinutes] =
    useState(DEFAULT_MINUTES);

  const lockVault = useCallback(async () => {
    if (locking.current) return;

    locking.current = true;
    setLockLoading(true);

    try {
      const response = await fetch("/api/vault-pin", {
        method: "DELETE",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("The vault lock request failed.");
      }
    } catch (error) {
      console.error("Failed to lock vault:", error);
    } finally {
      window.location.replace("/vault-lock");
    }
  }, []);

  useEffect(() => {
    setInactivityMinutes(getSavedMinutes());

    function syncMinutes() {
      setInactivityMinutes(getSavedMinutes());
    }

    window.addEventListener(CHANGE_EVENT, syncMinutes);
    window.addEventListener("storage", syncMinutes);

    return () => {
      window.removeEventListener(CHANGE_EVENT, syncMinutes);
      window.removeEventListener("storage", syncMinutes);
    };
  }, []);

  useEffect(() => {
    function resetTimer() {
      if (locking.current) return;

      if (timer.current) {
        clearTimeout(timer.current);
      }

      timer.current = setTimeout(() => {
        void lockVault();
      }, inactivityMinutes * 60 * 1000);
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [lockVault, inactivityMinutes]);

  return (
    <>
      {children}

      <button
        type="button"
        onClick={() => void lockVault()}
        disabled={lockLoading}
        className="fixed bottom-5 right-5 z-50 rounded-xl border border-violet-400/30 bg-[#201833] px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:border-violet-400 hover:bg-violet-500 disabled:opacity-60"
      >
        {lockLoading ? "Locking..." : "🔒 Lock vault"}
      </button>
    </>
  );
}
