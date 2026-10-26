"use client";

import { useState } from "react";

const features = [
  {
    icon: "✍️",
    title: "Your personal journal",
    description:
      "Write your thoughts, capture memories, and reflect on your journey.",
  },
  {
    icon: "🔐",
    title: "A private vault",
    description:
      "An extra layer of protection for the thoughts that matter most.",
  },
  {
    icon: "🌙",
    title: "Your peaceful space",
    description:
      "A calm, distraction-free place to be yourself, every single day.",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#0c0b12] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-2xl shadow-lg shadow-violet-500/20">
            ✦
          </div>
          <span className="text-xl font-bold tracking-tight">
            Diary<span className="text-violet-400">Vault</span>
          </span>
        </a>

        <div className="hidden items-center gap-6 text-sm text-gray-300 lg:flex">
          <a href="#features" className="transition hover:text-violet-300">
            Features
          </a>
          <a href="#privacy" className="transition hover:text-violet-300">
            Privacy
          </a>
          <a href="#about" className="transition hover:text-violet-300">
            About
          </a>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <a
            href="/login"
            className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-violet-400/50 hover:bg-white/5"
          >
            Log In
          </a>
          <a
            href="/signup"
            className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            Sign Up <span aria-hidden="true">↗</span>
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          className="rounded-xl border border-white/10 px-4 py-2 text-sm sm:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </nav>

      {menuOpen && (
        <div className="mx-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#15131f] p-5 text-gray-300 sm:hidden">
          <a href="#features" onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a href="#privacy" onClick={() => setMenuOpen(false)}>
            Privacy
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            About
          </a>
          <a
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl border border-white/15 px-4 py-3 text-center"
          >
            Log In
          </a>
          <a
            href="/signup"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl bg-violet-500 px-4 py-3 text-center font-semibold text-white"
          >
            Sign Up ↗
          </a>
        </div>
      )}

      <section className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 pb-24 pt-20 md:grid-cols-2 md:pb-32 md:pt-28">
        <div className="pointer-events-none absolute left-1/4 top-16 -z-0 h-72 w-72 rounded-full bg-violet-600/10 blur-[100px]" />

        <div className="relative z-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            Your thoughts. Your private world.
          </div>

          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Your life, written
            <span className="mt-2 block bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
              just for you.
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-8 text-gray-400">
            A quiet place for your thoughts, your memories, and the moments
            that make you who you are. Your story deserves its own space.
          </p>

          <div id="get-started" className="mt-10 flex flex-wrap gap-4">
            <a
              href="/signup"
              className="rounded-xl bg-violet-500 px-7 py-4 font-semibold transition hover:bg-violet-400"
            >
              Create Your Account →
            </a>
            <a
              href="/login"
              className="rounded-xl border border-white/15 px-7 py-4 font-medium text-gray-200 transition hover:bg-white/5"
            >
              Already a member? Log In
            </a>
          </div>

          <div className="mt-12 flex items-center gap-3 text-sm text-gray-500">
            <span className="text-xl text-violet-300">✧</span>
            A little space that belongs to you.
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-violet-500/10 blur-3xl" />

          <div className="relative rounded-[2rem] border border-white/10 bg-[#15131f] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <p className="text-sm text-gray-500">YOUR PERSONAL SPACE</p>
                <h2 className="mt-2 text-xl font-semibold">
                  A moment to reflect
                </h2>
              </div>
              <div className="rounded-2xl bg-violet-400/10 p-3 text-2xl">
                ✎
              </div>
            </div>

            <div className="my-7 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <p className="text-sm text-violet-300">A NOTE TO YOURSELF</p>
              <p className="mt-4 text-lg leading-8 text-gray-200">
                "Give yourself permission to grow at your own pace. Every
                little step counts."
              </p>
              <div className="mt-5 text-sm text-gray-500">
                A gentle reminder ♡
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 p-4">
                <span className="text-2xl">☾</span>
                <p className="mt-3 font-medium">Quiet moments</p>
                <p className="mt-1 text-sm text-gray-500">Take your time</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <span className="text-2xl">♡</span>
                <p className="mt-3 font-medium">Your memories</p>
                <p className="mt-1 text-sm text-gray-500">Keep them close</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-violet-500/10 p-4">
              <span className="text-xl">🔒</span>
              <div>
                <p className="text-sm font-medium">
                  Your private sanctuary
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Designed with privacy in mind
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-t border-white/10 bg-white/[0.02] px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300">
            Made for your inner world
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold sm:text-4xl">
            More than a diary. A space to be yourself.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-[#12111a] p-7 transition hover:-translate-y-1 hover:border-violet-400/30"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-6 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-gray-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="text-4xl">♧</div>
          <h2 className="mt-5 text-3xl font-semibold">
            Your story belongs to you.
          </h2>
          <p className="mt-4 leading-7 text-gray-400">
            Privacy is at the heart of our design. We're building toward
            secure accounts, private data access, and an additional diary
            lock before launch.
          </p>
        </div>
      </section>

      <footer id="about" className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-gray-500 sm:flex-row">
          <p>✦ DiaryVault — your story, your space.</p>
          <p>Made with care for the moments that matter.</p>
        </div>
      </footer>
    </main>
  );
}