
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "diaryvault_inactivity_minutes";
const DEFAULT_MINUTES = 5;
const OPTIONS = [1, 2, 5, 10, 15, 20, 30];
const CHANGE_EVENT = "diaryvault:inactivity-minutes-changed";

function readSavedMinutes(): number {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));

    if (OPTIONS.includes(saved)) {
      return saved;
    }
  } catch {
    // Use the default if browser storage is unavailable.
  }

  return DEFAULT_MINUTES;
}

export default function ManageSettingsPage() {
  const router = useRouter();
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMinutes(readSavedMinutes());
  }, []);

  function saveMinutes(value: number) {
    setMinutes(value);
    setError("");
    setMessage("");

    try {
      localStorage.setItem(STORAGE_KEY, String(value));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      setMessage(
        `Automatic lock set to ${value} ${value === 1 ? "minute" : "minutes"}.`
      );
    } catch {
      setError("Could not save this preference in your browser.");
    }
  }

  async function lockVault() {
    if (locking) return;

    setLocking(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/vault-pin", {
        method: "DELETE",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not lock the vault. Please try again.");
      }

      router.replace("/vault-lock");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while locking the vault."
      );
      setLocking(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0c0b12] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard" className="text-xl font-bold">
            Diary<span className="text-violet-400">Vault</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-violet-400"
          >
            ← Dashboard
          </Link>
        </header>

        <p className="text-sm tracking-[0.2em] text-violet-300">
          PREFERENCES &amp; SECURITY
        </p>

        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
          Manage settings<span className="text-violet-400">.</span>
        </h1>

        <p className="mt-3 leading-7 text-gray-400">
          Customize your vault security and automatic inactivity lock.
        </p>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#15131f] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl">
              ⏱️
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                Automatic inactivity lock
              </h2>

              <p className="mt-2 text-sm leading-7 text-gray-400">
                Choose how long DiaryVault can remain unlocked without activity.
                Your selection is saved in this browser and applied to the
                inactivity timer.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={minutes === option}
                    onClick={() => {
                      setSaving(true);
                      saveMinutes(option);
                      setSaving(false);
                    }}
                    className={`rounded-xl border px-4 py-4 text-left transition ${
                      minutes === option
                        ? "border-violet-400 bg-violet-500/20 text-white ring-1 ring-violet-400"
                        : "border-white/10 bg-[#0c0b12] text-gray-300 hover:border-violet-400/50"
                    }`}
                  >
                    <span className="block text-2xl font-bold">
                      {option}
                    </span>
                    <span className="mt-1 block text-sm text-gray-400">
                      {option === 1 ? "minute" : "minutes"}
                    </span>
                    {minutes === option && (
                      <span className="mt-2 block text-xs text-violet-300">
                        ✓ Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-[#0c0b12] p-4">
                <p className="text-sm text-gray-300">
                  Current timeout:{" "}
                  <span className="font-semibold text-violet-300">
                    {minutes} {minutes === 1 ? "minute" : "minutes"}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  The vault locks after this much time without activity.
                </p>
              </div>

              {message && (
                <p role="status" className="mt-4 text-sm text-green-300">
                  {message}
                </p>
              )}

              {error && (
                <p role="alert" className="mt-4 text-sm text-red-300">
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#15131f] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl">
              🔒
            </div>

            <div>
              <h2 className="text-xl font-semibold">Lock vault now</h2>
              <p className="mt-2 text-sm leading-7 text-gray-400">
                Lock your vault immediately. You will need to unlock it again
                before accessing your protected dashboard.
              </p>

              <button
                type="button"
                onClick={() => void lockVault()}
                disabled={locking}
                className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locking ? "Locking vault..." : "🔐 Lock vault now"}
              </button>

              {error && (
                <p role="alert" className="mt-4 text-sm text-red-300">
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#15131f] p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Security recommendations</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-400">
            <li>• Use a unique, strong account password.</li>
            <li>• Keep your Vault PIN private.</li>
            <li>• Lock your vault before leaving a shared computer.</li>
            <li>• Never share your server secrets or service-role key.</li>
          </ul>
        </section>

        <Link
          href="/dashboard/settings"
          className="mt-6 inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-300 transition hover:border-violet-400/50 hover:text-white"
        >
          ← Back to account settings
        </Link>
      </div>
    </main>
  );
}
