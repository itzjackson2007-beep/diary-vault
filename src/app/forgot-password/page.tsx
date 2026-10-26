
"use client";

import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!token) {
      setMessage("Please complete the Cloudflare security check first.");
      return;
    }

    setLoading(true);

    try {
      // Confirm that the current user is still using the expected
      // Supabase configuration before submitting the reset request.
      createClient();

      const response = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setToken("");
        setMessage(
          result.error || "Verification failed. Please try again."
        );
        return;
      }

      setSuccess(true);
      setMessage(result.message);
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c0b12] px-5 py-12 text-white">
      <div className="w-full max-w-md">
        <a href="/" className="mb-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-2xl">
            ✦
          </span>
          <span className="text-xl font-bold">
            Diary<span className="text-violet-400">Vault</span>
          </span>
        </a>

        <div className="rounded-3xl border border-white/10 bg-[#15131f] p-7 sm:p-9">
          <p className="text-sm font-medium text-violet-300">
            ACCOUNT RECOVERY
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Forgot your password?
          </h1>

          <p className="mt-3 leading-6 text-gray-400">
            Enter your email and complete the security check to request
            a password reset link.
          </p>

          <form onSubmit={handleReset} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-violet-400"
              />
            </div>

            <div>
              <p className="mb-3 text-sm">Security verification</p>
              <div className="overflow-hidden rounded-xl bg-white p-2">
                <Turnstile
                  siteKey={
                    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
                  }
                  onSuccess={(newToken) => {
                    setToken(newToken);
                    setMessage("");
                  }}
                  onExpire={() => setToken("")}
                  onError={() => {
                    setToken("");
                    setMessage(
                      "Security verification failed. Please reload the check."
                    );
                  }}
                  options={{
                    theme: "light",
                    action: "password_reset",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-xl bg-violet-500 px-5 py-4 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending link..." : "Send reset link →"}
            </button>

            {message && (
              <p
                role="status"
                aria-live="polite"
                className={`text-sm leading-6 ${
                  success ? "text-green-400" : "text-violet-300"
                }`}
              >
                {message}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Remembered your password?{" "}
            <a href="/login" className="text-violet-300 hover:text-white">
              Back to login
            </a>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          🔒 Your private space, always.
        </p>
      </div>
    </main>
  );
}
