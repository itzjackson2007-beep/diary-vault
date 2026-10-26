
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type DiaryEntry = {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[] | null;
  entry_date: string;
  is_favorite: boolean;
  created_at: string;
};

const moodOptions = [
  "All moods", "Happy", "Grateful", "Calm", "Reflective",
  "Sad", "Anxious", "Excited", "Tired",
];

const moodEmojis: Record<string, string> = {
  Happy: "😊", Grateful: "🙏", Calm: "😌", Reflective: "🌙",
  Sad: "🌧️", Anxious: "🌊", Excited: "✨", Tired: "😴",
};

function formatDate(date: string) {
  if (!date) return "Date unavailable";
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function EntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMood, setSelectedMood] = useState("All moods");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DiaryEntry | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("diary_entries")
        .select("id, title, content, mood, tags, entry_date, is_favorite, created_at")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (queryError) {
        console.error("Load diary entries error:", queryError);
        setError(`Could not load your entries: ${queryError.message}`);
        return;
      }

      setEntries((data ?? []) as DiaryEntry[]);
    } catch (err) {
      console.error("Unexpected entries error:", err);
      setError("Something went wrong while loading your entries.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesSearch =
        !term ||
        entry.title.toLowerCase().includes(term) ||
        entry.content.toLowerCase().includes(term) ||
        (entry.tags ?? []).some((tag) => tag.toLowerCase().includes(term));

      const matchesMood =
        selectedMood === "All moods" || entry.mood === selectedMood;
      const matchesFavorite = !favoritesOnly || entry.is_favorite;

      return matchesSearch && matchesMood && matchesFavorite;
    });
  }, [entries, search, selectedMood, favoritesOnly]);

  async function deleteEntry(entry: DiaryEntry) {
    if (deletingId) return;

    setDeletingId(entry.id);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setConfirmDelete(null);
        router.replace("/login");
        return;
      }

      const { error: deleteError } = await supabase
        .from("diary_entries")
        .delete()
        .eq("id", entry.id)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Delete diary entry error:", deleteError);
        setError(`Could not delete this entry: ${deleteError.message}`);
        return;
      }

      setEntries((current) => current.filter((item) => item.id !== entry.id));

      if (selectedEntry?.id === entry.id) {
        setSelectedEntry(null);
      }

      setConfirmDelete(null);
    } catch (err) {
      console.error("Unexpected delete error:", err);
      setError("Something went wrong while deleting this entry.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0c0b12] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-2xl shadow-lg shadow-violet-950/40">
              ✦
            </span>
            <span className="text-xl font-bold">
              Diary<span className="text-violet-400">Vault</span>
            </span>
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:border-violet-400/50 hover:text-white">
              ← Dashboard
            </Link>
            <Link href="/dashboard/new" className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-400">
              + New entry
            </Link>
          </div>
        </header>

        <section className="mb-9">
          <p className="text-sm font-medium tracking-[0.22em] text-violet-300">YOUR MEMORIES</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Your entries<span className="text-violet-400">.</span>
              </h1>
              <p className="mt-3 max-w-xl leading-7 text-gray-400">
                Revisit the moments, feelings, and little things worth remembering.
              </p>
            </div>
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-5 py-4">
              <p className="text-sm text-gray-400">Your collection</p>
              <p className="mt-1 text-2xl font-bold">
                {entries.length}{" "}
                <span className="text-sm font-normal text-gray-400">
                  {entries.length === 1 ? "entry" : "entries"}
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="mb-7 rounded-3xl border border-white/10 bg-[#15131f] p-4 sm:p-5">
          <label htmlFor="entry-search" className="sr-only">Search diary entries</label>
          <input
            id="entry-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search titles, memories, or tags..."
            className="w-full rounded-xl border border-white/10 bg-[#0c0b12] px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-500 focus:border-violet-400"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label htmlFor="mood-filter" className="text-sm text-gray-400">Filter by mood</label>
            <select
              id="mood-filter"
              value={selectedMood}
              onChange={(event) => setSelectedMood(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0c0b12] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400"
            >
              {moodOptions.map((mood) => (
                <option key={mood} value={mood} className="bg-[#15131f}">{mood}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setFavoritesOnly((value) => !value)}
              aria-pressed={favoritesOnly}
              className={`rounded-xl border px-4 py-2.5 text-sm transition ${
                favoritesOnly
                  ? "border-pink-400/40 bg-pink-500/10 text-pink-300"
                  : "border-white/10 text-gray-300 hover:border-pink-400/30"
              }`}
            >
              {favoritesOnly ? "♥ Favorites only" : "♡ Favorites"}
            </button>

            {(search || selectedMood !== "All moods" || favoritesOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedMood("All moods");
                  setFavoritesOnly(false);
                }}
                className="px-2 py-2 text-sm text-violet-300 hover:text-violet-200"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {error && (
          <div role="alert" className="mb-6 break-words rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
            {error}
            <button type="button" onClick={() => void loadEntries()} className="ml-3 underline underline-offset-4">
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#15131f] px-6 py-20 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
            <p className="text-gray-300">Opening your memories...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-[#15131f]/70 px-6 py-16 text-center sm:py-20">
            <div className="text-5xl">{entries.length === 0 ? "📖" : "🔎"}</div>
            <h2 className="mt-5 text-xl font-semibold">
              {entries.length === 0 ? "Your story starts here" : "No matching entries"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-400">
              {entries.length === 0
                ? "Your saved diary entries will appear here. Create your first entry whenever you're ready."
                : "Try another search, choose a different mood, or clear your filters."}
            </p>
            {entries.length === 0 ? (
              <Link href="/dashboard/new" className="mt-6 inline-flex rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold transition hover:bg-violet-400">
                Write your first entry →
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedMood("All moods");
                  setFavoritesOnly(false);
                }}
                className="mt-6 rounded-xl border border-violet-400/30 px-5 py-3 text-sm text-violet-200 hover:bg-violet-500/10"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              Showing {filteredEntries.length} of {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </p>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredEntries.map((entry) => (
                <article key={entry.id} className="flex min-w-0 flex-col rounded-3xl border border-white/10 bg-[#15131f] p-5 transition hover:border-violet-400/30 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-1.5 text-xs text-gray-400">
                      {formatDate(entry.entry_date)}
                    </span>
                    {entry.is_favorite && <span className="text-lg text-pink-400" aria-label="Favorite entry" title="Favorite">♥</span>}
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-sm text-violet-300">
                    <span>{moodEmojis[entry.mood ?? ""] ?? "✦"}</span>
                    <span>{entry.mood || "No mood selected"}</span>
                  </div>

                  <h2 className="mt-3 break-words text-xl font-semibold leading-7">{entry.title}</h2>
                  <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-gray-400">
                    {entry.content.length > 200 ? `${entry.content.slice(0, 200).trimEnd()}…` : entry.content}
                  </p>

                  {(entry.tags ?? []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(entry.tags ?? []).map((tag, index) => (
                        <span key={`${tag}-${index}`} className="max-w-full break-words rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-xs text-violet-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    <button type="button" onClick={() => setSelectedEntry(entry)} className="flex-1 rounded-xl bg-violet-500 px-3 py-3 text-sm font-semibold transition hover:bg-violet-400">
                      Read entry →
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(entry)}
                      disabled={deletingId !== null}
                      className="rounded-xl border border-red-400/20 px-3 py-3 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                      aria-label={`Delete ${entry.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <footer className="mt-12 border-t border-white/10 pt-6 text-center text-xs leading-6 text-gray-500">
          Your memories are personal. DiaryVault displays entries from your signed-in account.
        </footer>
      </div>

      {selectedEntry && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedEntry(null);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="reading-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#15131f] p-6 shadow-2xl sm:rounded-3xl sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-violet-300">
                  {moodEmojis[selectedEntry.mood ?? ""] ?? "✦"} {selectedEntry.mood || "Personal memory"}
                </p>
                <h2 id="reading-title" className="mt-3 break-words text-3xl font-bold leading-tight">{selectedEntry.title}</h2>
                <p className="mt-3 text-sm text-gray-500">
                  {formatDate(selectedEntry.entry_date)}{selectedEntry.is_favorite ? " · ♥ Favorite" : ""}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedEntry(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-violet-400/40 hover:text-white">
                Close ✕
              </button>
            </div>

            <div className="my-7 border-t border-white/10" />
            <div className="whitespace-pre-wrap break-words text-base leading-8 text-gray-200">{selectedEntry.content}</div>

            {(selectedEntry.tags ?? []).length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-6">
                {(selectedEntry.tags ?? []).map((tag, index) => (
                  <span key={`${tag}-${index}`} className="rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-200">#{tag}</span>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(selectedEntry)}
                disabled={deletingId !== null}
                className="rounded-xl border border-red-400/20 px-4 py-3 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                Delete entry
              </button>
              <button type="button" onClick={() => setSelectedEntry(null)} className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400">
                Done reading
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) {
              setConfirmDelete(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
            className="w-full max-w-md rounded-3xl border border-violet-400/20 bg-[#171126] p-6 shadow-2xl shadow-black/50 sm:p-8"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-2xl">
              🗑️
            </div>

            <p className="text-xs font-semibold tracking-[0.2em] text-red-300">DELETE ENTRY</p>
            <h2 id="delete-title" className="mt-2 break-words text-2xl font-bold text-white">
              Are you sure?
            </h2>
            <p id="delete-description" className="mt-3 text-sm leading-6 text-gray-400">
              You are about to permanently delete{" "}
              <span className="font-semibold text-gray-200">“{confirmDelete.title}”</span>.
              This action cannot be undone.
            </p>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => void deleteEntry(confirmDelete)}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === confirmDelete.id ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
