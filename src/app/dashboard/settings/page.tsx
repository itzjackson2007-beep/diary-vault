
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function AccountSettingsPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        setError("Could not load your account details.");
        return;
      }

      setEmail(data.user?.email ?? "");
    }

    void loadAccount();
  }, [supabase]);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Your password was updated successfully.");
      setPassword("");
      setConfirmPassword("");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0c0b12] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between gap-4">
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
          YOUR PROFILE
        </p>
        <h1 className="mt-3 text-4xl font-bold">
          Account settings<span className="text-violet-400">.</span>
        </h1>
        <p className="mt-3 text-gray-400">
          Manage your account information and password.
        </p>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#15131f] p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Account information</h2>
          <label className="mt-6 block text-sm text-gray-400">
            Email address
          </label>
          <input
            type="email"
            value={email}
            readOnly
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0b12] px-4 py-3 text-gray-300 outline-none"
          />
          <p className="mt-2 text-xs text-gray-500">
            Your registered email address.
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#15131f] p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Change password</h2>
          <p className="mt-2 text-sm text-gray-400">
            Choose a strong password with at least 8 characters.
          </p>

          <form onSubmit={updatePassword} className="mt-6 space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm text-gray-300">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0b12] px-4 py-3 outline-none focus:border-violet-400"
                placeholder="Enter a new password"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm text-gray-300">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0b12] px-4 py-3 outline-none focus:border-violet-400"
                placeholder="Enter the password again"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-300">{error}</p>
            )}
            {message && (
              <p role="status" className="text-sm text-green-300">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500 disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#15131f] p-6 sm:p-8">
          <h2 className="text-xl font-semibold">More preferences</h2>
          <p className="mt-2 text-sm text-gray-400">
            Manage your vault lock and security options.
          </p>
          <Link
            href="/dashboard/settings/manage"
            className="mt-5 inline-flex rounded-xl border border-violet-400/30 px-5 py-3 text-sm font-semibold text-violet-200 hover:bg-violet-500/10"
          >
            Manage settings →
          </Link>
        </section>
      </div>
    </main>
  );
}
