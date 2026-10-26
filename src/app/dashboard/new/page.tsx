
"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import EntryPhotos from "@/components/EntryPhotos";

const moods = [
  { name: "Happy", emoji: "😊" },
  { name: "Grateful", emoji: "🙏" },
  { name: "Calm", emoji: "😌" },
  { name: "Reflective", emoji: "🌙" },
  { name: "Sad", emoji: "🌧️" },
  { name: "Anxious", emoji: "🌊" },
  { name: "Excited", emoji: "✨" },
  { name: "Tired", emoji: "😴" },
];

const prompts = [
  "What made today meaningful?",
  "What is something I want to remember?",
  "What am I grateful for today?",
  "What is on my mind right now?",
  "What did I learn about myself?",
];

const AUTO_SAVE_KEY = "diaryvault_entry_autosave";

type EntryDraft = {
  title: string;
  content: string;
  mood: string;
  tagsInput: string;
  entryDate: string;
  isFavorite: boolean;
};

function getLocalDate() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseTags(tagsInput: string) {
  return [
    ...new Set(
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 40))
    ),
  ];
}

export default function NewEntryPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("Reflective");
  const [tagsInput, setTagsInput] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [autoSaveReady, setAutoSaveReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "pending" | "saving" | "saved" | "error"
  >("idle");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const entryId = useRef<string | null>(null);
  const savingRef = useRef(false);
  const autoSaveRef = useRef(false);
  const latestDraft = useRef<EntryDraft | null>(null);

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  const currentDraft: EntryDraft = {
    title,
    content,
    mood,
    tagsInput,
    entryDate,
    isFavorite,
  };

  latestDraft.current = currentDraft;
  autoSaveRef.current = autoSaveEnabled;

  useEffect(() => {
    setEntryDate(getLocalDate());

    try {
      setAutoSaveEnabled(localStorage.getItem(AUTO_SAVE_KEY) === "true");
    } catch {
      setAutoSaveEnabled(false);
    }

    setAutoSaveReady(true);
  }, []);

  function toggleAutoSave(enabled: boolean) {
    setAutoSaveEnabled(enabled);
    autoSaveRef.current = enabled;
    setMessage("");

    try {
      localStorage.setItem(AUTO_SAVE_KEY, String(enabled));
      setSaveStatus(enabled ? "pending" : "idle");
    } catch {
      setAutoSaveEnabled(false);
      autoSaveRef.current = false;
      setMessageType("error");
      setMessage("Could not save your auto-save preference in this browser.");
      setSaveStatus("error");
    }
  }

  const persistDraft = useCallback(async (draft: EntryDraft) => {
    if (savingRef.current) return false;

    const cleanTitle = draft.title.trim();
    const cleanContent = draft.content.trim();

    if (!cleanTitle || !cleanContent || !draft.entryDate) {
      return false;
    }

    savingRef.current = true;
    setSaving(true);
    setSaveStatus("saving");

    let succeeded = false;

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        if (!user) router.replace("/login");

        throw new Error(
          authError?.message ?? "Please sign in again to save your entry."
        );
      }

      const values = {
        title: cleanTitle,
        content: cleanContent,
        mood: draft.mood,
        tags: parseTags(draft.tagsInput),
        entry_date: draft.entryDate,
        is_favorite: draft.isFavorite,
      };

      if (entryId.current) {
        const { data, error } = await supabase
          .from("diary_entries")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entryId.current)
          .eq("user_id", user.id)
          .select("id")
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          throw new Error(
            "Your saved entry could not be found. Please check your entries before continuing."
          );
        }

        setSavedEntryId(data.id);
      } else {
        const { data, error } = await supabase
          .from("diary_entries")
          .insert({
            user_id: user.id,
            ...values,
          })
          .select("id")
          .single();

        if (error) throw error;

        entryId.current = data.id;
        setSavedEntryId(data.id);
      }

      succeeded = true;
      setSaveStatus("saved");
      setMessageType("success");
      setMessage("Your entry is saved privately. ✨");
      return true;
    } catch (error) {
      console.error("DiaryVault save error:", error);
      setSaveStatus("error");
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? `Save failed: ${error.message}`
          : "Could not save your entry. Please try again."
      );
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);

      const latest = latestDraft.current;

      if (
        succeeded &&
        autoSaveRef.current &&
        latest &&
        (latest.title.trim() !== cleanTitle ||
          latest.content.trim() !== cleanContent ||
          latest.mood !== draft.mood ||
          latest.tagsInput !== draft.tagsInput ||
          latest.entryDate !== draft.entryDate ||
          latest.isFavorite !== draft.isFavorite)
      ) {
        window.setTimeout(() => {
          if (autoSaveRef.current && latestDraft.current) {
            void persistDraft(latestDraft.current);
          }
        }, 300);
      }
    }
  }, [router]);

  useEffect(() => {
    if (!autoSaveReady || !autoSaveEnabled) return;
    if (!title.trim() || !content.trim() || !entryDate) return;

    setSaveStatus("pending");

    const timeout = window.setTimeout(() => {
      if (latestDraft.current) {
        void persistDraft(latestDraft.current);
      }
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [
    autoSaveReady,
    autoSaveEnabled,
    title,
    content,
    mood,
    tagsInput,
    entryDate,
    isFavorite,
    persistDraft,
  ]);

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (savingRef.current) {
      setMessageType("error");
      setMessage("Please wait for the current save to finish.");
      return;
    }

    if (!title.trim()) {
      setMessageType("error");
      setMessage("Please type a title for your entry.");
      document.getElementById("entry-title")?.focus();
      return;
    }

    if (!content.trim()) {
      setMessageType("error");
      setMessage("Please write something in your diary before saving.");
      document.getElementById("entry-content")?.focus();
      return;
    }

    if (!entryDate) {
      setMessageType("error");
      setMessage("Please select an entry date.");
      return;
    }

    const saved = await persistDraft({
      title,
      content,
      mood,
      tagsInput,
      entryDate,
      isFavorite,
    });

    if (saved) {
      setMessageType("success");
      setMessage(
        "Your entry has been saved! Photos can finish uploading in the photo section. ✨"
      );

      // Stay on the page so queued photo uploads can complete.
      // The user can return to the dashboard using the top navigation.
    }
  }

  function insertPrompt(prompt: string) {
    setContent((current) =>
      current ? `${current}\n\n${prompt}\n` : `${prompt}\n`
    );
  }

  const statusText = {
    idle: "Changes save when you click Save entry.",
    pending: "Changes detected — waiting to auto-save…",
    saving: "Saving your entry…",
    saved: "All changes saved ✓",
    error: "Save needs attention — check the message below.",
  }[saveStatus];

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

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:border-violet-400/50 hover:text-white"
          >
            ← Back to dashboard
          </Link>
        </header>

        <div className="mb-8">
          <p className="text-sm font-medium tracking-[0.22em] text-violet-300">
            YOUR PRIVATE SPACE
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            New entry<span className="text-violet-400">.</span>
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-gray-400">
            Take a breath. Put your thoughts into words. This moment belongs
            to you.
          </p>
        </div>

        <form
          onSubmit={saveEntry}
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
        >
          <section className="min-w-0 rounded-3xl border border-white/10 bg-[#15131f] p-5 sm:p-8">
            <div className="mb-7">
              <label
                htmlFor="entry-title"
                className="mb-3 block text-sm font-medium text-gray-300"
              >
                Entry title
              </label>
              <input
                id="entry-title"
                name="title"
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setMessage("");
                }}
                maxLength={150}
                required
                autoComplete="off"
                placeholder="Give this moment a name..."
                className="w-full border-0 border-b border-white/10 bg-transparent py-4 text-2xl font-semibold outline-none transition placeholder:text-gray-600 focus:border-violet-400 sm:text-3xl"
              />
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
              <span>YOUR THOUGHTS, YOUR SPACE</span>
              <span>
                {words} words · {readingTime} min read
              </span>
            </div>

            <label htmlFor="entry-content" className="sr-only">
              Write your diary entry
            </label>
            <textarea
              id="entry-content"
              name="content"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setMessage("");
              }}
              required
              placeholder={"Dear diary,\n\nStart wherever you are. You don't need perfect words. Just be yourself..."}
              rows={17}
              className="min-h-[380px] w-full resize-y rounded-2xl border border-white/5 bg-black/10 p-5 text-base leading-8 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-violet-400/50 sm:p-6"
            />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
              <span>{statusText}</span>
              <span>{content.length} characters</span>
            </div>

            <div className="mt-7 border-t border-white/10 pt-6">
              <p className="mb-3 text-sm font-medium text-gray-300">
                Need a little inspiration?
              </p>
              <div className="flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => insertPrompt(prompt)}
                    className="rounded-xl border border-violet-400/15 bg-violet-500/5 px-3 py-2 text-left text-xs text-violet-200 transition hover:border-violet-400/50 hover:bg-violet-500/10"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <EntryPhotos entryId={savedEntryId} mode="manage" />
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-[#15131f] p-6">
              <h2 className="text-lg font-semibold">Entry details</h2>
              <p className="mt-1 text-sm text-gray-500">
                Add a little context to your memory.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Auto-save</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Save after 2 seconds without typing.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoSaveEnabled}
                    aria-label="Automatic saving"
                    onClick={() => toggleAutoSave(!autoSaveEnabled)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      autoSaveEnabled ? "bg-violet-500" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                        autoSaveEnabled ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <p
                  className={`mt-3 text-xs ${
                    autoSaveEnabled ? "text-emerald-300" : "text-gray-500"
                  }`}
                >
                  {autoSaveEnabled ? "Auto-save is ON" : "Auto-save is OFF"}
                </p>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="entry-date"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Entry date
                </label>
                <input
                  id="entry-date"
                  name="entry_date"
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0c0b12] px-3 py-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm text-gray-300">
                  How are you feeling?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {moods.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setMood(item.name)}
                      aria-pressed={mood === item.name}
                      className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                        mood === item.name
                          ? "border-violet-400 bg-violet-500/15 text-white"
                          : "border-white/10 bg-black/10 text-gray-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span className="mr-2">{item.emoji}</span>
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="entry-tags"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Tags
                </label>
                <input
                  id="entry-tags"
                  name="tags"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="personal, work, life"
                  className="w-full rounded-xl border border-white/10 bg-[#0c0b12] px-3 py-3 text-sm outline-none placeholder:text-gray-600 focus:border-violet-400"
                />
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Separate tags with commas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFavorite((value) => !value)}
                aria-pressed={isFavorite}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  isFavorite
                    ? "border-pink-400/40 bg-pink-500/10 text-pink-300"
                    : "border-white/10 text-gray-300 hover:border-pink-400/30"
                }`}
              >
                <span>{isFavorite ? "♥" : "♡"}</span>
                {isFavorite ? "Added to favorites" : "Mark as favorite"}
              </button>
            </section>

            <section className="rounded-3xl border border-violet-400/15 bg-gradient-to-br from-violet-500/10 to-[#15131f] p-6">
              <div className="text-2xl">🔒</div>
              <h2 className="mt-3 font-semibold">A space just for you</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Your entry is associated with your signed-in account. Keep
                your Vault PIN private.
              </p>
            </section>

            {message && (
              <p
                role="status"
                aria-live="polite"
                className={`break-words rounded-xl border p-4 text-sm leading-6 ${
                  messageType === "success"
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                    : "border-red-400/20 bg-red-500/10 text-red-300"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-violet-500 px-5 py-4 font-semibold shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving your entry..." : "Save entry  →"}
            </button>

            <p className="text-center text-xs leading-5 text-gray-500">
              Take your time. Your story matters.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}
