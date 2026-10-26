import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import LogoutButton from "./logout-button";

export const instant = false;

function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c0b12] text-white">
      <p className="text-violet-300">Opening your private vault...</p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/login");
  }

  const email =
    typeof claims.email === "string"
      ? claims.email
      : "DiaryVault member";

  const metadata = claims.user_metadata;

  const displayName =
    metadata &&
    typeof metadata === "object" &&
    "full_name" in metadata &&
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : email.includes("@")
        ? email.split("@")[0]
        : email;

  return (
    <main className="min-h-screen bg-[#0c0b12] text-white">
      <header className="border-b border-white/10 bg-[#15131f]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500 text-2xl">
              ✦
            </span>
            <span className="text-xl font-bold">
              Diary<span className="text-violet-400">Vault</span>
            </span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <p className="text-sm font-medium text-violet-300">
          YOUR PERSONAL SPACE
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Welcome back, {displayName}!
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-gray-400">
          Your private diary is ready. Capture your thoughts, feelings,
          and memories in your own personal space.
        </p>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/new"
            className="rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-[#15131f] p-7 transition hover:border-violet-400/70"
          >
            <span className="text-3xl">✍️</span>
            <h2 className="mt-6 text-xl font-semibold">Write a new entry</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Capture today's thoughts, feelings, and memories.
            </p>
            <p className="mt-5 text-sm font-medium text-violet-300">
              Start writing →
            </p>
          </Link>

          <Link
            href="/dashboard/entries"
            className="rounded-3xl border border-white/10 bg-[#15131f] p-7 transition hover:border-violet-400/50"
          >
            <span className="text-3xl">📖</span>
            <h2 className="mt-6 text-xl font-semibold">My diary entries</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Read and revisit your saved memories.
            </p>
            <p className="mt-5 text-sm font-medium text-violet-300">
              View entries →
            </p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="rounded-3xl border border-white/10 bg-[#15131f] p-7 transition hover:border-violet-400/50"
          >
            <span className="text-3xl">⚙️</span>
            <h2 className="mt-6 text-xl font-semibold">Account settings</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Manage your account and preferences.
            </p>
            <p className="mt-5 text-sm font-medium text-violet-300">
              Manage account →
            </p>
          </Link>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#15131f] p-7 sm:p-9">
          <div className="text-3xl">🌙</div>
          <h2 className="mt-4 text-xl font-semibold">
            A little space for yourself
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-gray-400">
            You don't have to make every day extraordinary. Sometimes
            the smallest moments become the memories worth keeping.
            Your diary is here whenever you're ready.
          </p>
        </section>

        <footer className="mt-10 text-center text-sm text-gray-500">
          Your story deserves a space of its own. ✦
        </footer>
      </div>
    </main>
  );
}