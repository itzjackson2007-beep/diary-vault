
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (password.length < 8) {
      setMessage("Your password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        setMessage(
          "Your reset link is invalid or expired. Please request a new one."
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setSuccess(true);
      setMessage("Your password has been updated successfully.");

      await supabase.auth.signOut();
      setPassword("");
      setConfirmPassword("");
    } catch {
      setMessage("Something went wrong. Please request a new reset link.");
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
            Set a new password
          </h1>

          <p className="mt-3 leading-6 text-gray-400">
            Choose a new password for your private DiaryVault account.
          </p>

          <form onSubmit={handleReset} className="mt-8 space-y-5">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-violet-400"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter your new password again"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-violet-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded-xl bg-violet-500 px-5 py-4 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating password..." : "Update password →"}
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

            {success && (
              <a
                href="/login"
                className="block text-center text-sm text-violet-300 hover:text-white"
              >
                Return to login →
              </a>
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
