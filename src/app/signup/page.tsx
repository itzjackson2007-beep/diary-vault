"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Your password must be at least 8 characters.");
      return;
    }

    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.user && data.user.identities?.length === 0) {
        setMessage(
          "An account may already exist with this email. Try logging in instead."
        );
        return;
      }

      if (data.session) {
        window.location.href = "/dashboard";
        return;
      }

      setMessage(
        "Account created! Check your email for a confirmation link before logging in."
      );
    } catch {
      setMessage(
        "Unable to connect right now. Check your internet connection and try again."
      );
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
            YOUR PRIVATE WORLD
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Create your account</h1>
          <p className="mt-3 leading-6 text-gray-400">
            Start a personal space for your thoughts and memories.
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm">
                Your name
              </label>
              <input
                id="name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-violet-400"
              />
            </div>

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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-violet-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-violet-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-500 px-5 py-4 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account →"}
            </button>

            {message && (
              <p role="status" aria-live="polite" className="text-sm leading-6 text-violet-300">
                {message}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <a href="/login" className="text-violet-300 hover:text-white">
              Log in
            </a>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Your story deserves a space of its own.
        </p>
      </div>
    </main>
  );
}