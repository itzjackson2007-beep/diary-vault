"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VaultLockPage() {
  const router = useRouter();

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkPin() {
      try {
        const response = await fetch("/api/vault-pin", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        if (active) {
          setConfigured(Boolean(data.configured));
        }
      } catch {
        if (active) {
          setMessage("Unable to connect. Please refresh and try again.");
        }
      }
    }

    void checkPin();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(pin)) {
      setMessage("Enter exactly six digits.");
      return;
    }

    if (configured === false && pin !== confirmPin) {
      setMessage("Your PIN entries do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/vault-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          configured
            ? { action: "verify", pin }
            : { action: "setup", pin, confirmPin }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to continue.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setMessage("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c0b12] px-5 py-12 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-2xl">
            ✦
          </span>
          <span className="text-xl font-bold">
            Diary<span className="text-violet-400">Vault</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#15131f] p-7 sm:p-9">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl">
            🔐
          </div>

          <p className="text-sm font-medium tracking-widest text-violet-300">
            PRIVATE VAULT SECURITY
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            {configured === null
              ? "Checking security..."
              : configured
                ? "Welcome back"
                : "Create your Vault PIN"}
          </h1>

          <p className="mt-3 leading-6 text-gray-400">
            {configured
              ? "Enter your six-digit PIN to unlock your personal diary."
              : "Create a separate six-digit PIN to protect your diary."}
          </p>

          {configured !== null && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="pin" className="mb-2 block text-sm">
                  {configured ? "Your six-digit PIN" : "Create a six-digit PIN"}
                </label>

                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoFocus
                  value={pin}
                  onChange={(event) =>
                    setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="••••••"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-center text-2xl tracking-[0.6em] outline-none focus:border-violet-400"
                />
              </div>

              {!configured && (
                <div>
                  <label htmlFor="confirmPin" className="mb-2 block text-sm">
                    Confirm your PIN
                  </label>

                  <input
                    id="confirmPin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={confirmPin}
                    onChange={(event) =>
                      setConfirmPin(
                        event.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    placeholder="Enter the same PIN again"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-violet-400"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-violet-500 px-5 py-4 font-semibold transition hover:bg-violet-400 disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : configured
                    ? "Unlock my vault →"
                    : "Set up my Vault PIN →"}
              </button>

              {message && (
                <p role="alert" className="text-sm leading-6 text-red-300">
                  {message}
                </p>
              )}
            </form>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-gray-500">
            Your Vault PIN is separate from your account password. Keep it
            somewhere safe.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Need to sign in?{" "}
          <Link href="/login" className="text-violet-300 hover:text-white">
            Go to login
          </Link>
        </p>
      </div>
    </main>
  );
}
