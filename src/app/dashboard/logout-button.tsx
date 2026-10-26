
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogout() {
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage("Unable to log out. Please try again.");
        setLoading(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setMessage("Unable to connect. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium transition hover:border-violet-400 hover:bg-violet-500/10 disabled:opacity-60"
      >
        {loading ? "Logging out..." : "Log out ↗"}
      </button>

      {message && (
        <p role="status" className="mt-2 text-xs text-red-300">
          {message}
        </p>
      )}
    </div>
  );
}
