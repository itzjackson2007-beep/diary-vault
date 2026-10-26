
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

type Attachment = {
  id: string;
  entry_id: string;
  file_name: string;
  storage_path: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  previewUrl?: string;
};

type EntryPhotosProps = {
  entryId: string | null;
  mode: "manage" | "view";
};

const BUCKET = "diary-attachments";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function EntryPhotos({ entryId, mode }: EntryPhotosProps) {
  const [photos, setPhotos] = useState<Attachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const uploadLock = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    if (!entryId) {
      setPhotos([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("diary_entry_attachments")
        .select(
          "id, entry_id, file_name, storage_path, content_type, size_bytes, created_at"
        )
        .eq("entry_id", entryId)
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;

      const rows = (data ?? []) as Attachment[];

      const withUrls = await Promise.all(
        rows.map(async (photo) => {
          const { data: signed, error: signedError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(photo.storage_path, 3600);

          if (signedError) {
            console.error("Photo preview URL error:", signedError);
            return photo;
          }

          return { ...photo, previewUrl: signed.signedUrl };
        })
      );

      setPhotos(withUrls);
    } catch (err) {
      console.error("Load entry photos error:", err);
      setError(
        err instanceof Error
          ? `Could not load photos: ${err.message}`
          : "Could not load the photos."
      );
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos, refreshKey]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!entryId || files.length === 0 || uploadLock.current) return;

      uploadLock.current = true;
      setBusy(true);
      setError("");
      setNotice("");

      const supabase = createClient();
      const uploadedPaths: string[] = [];
      let uploadedCount = 0;

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("Please sign in again before uploading photos.");
        }

        for (const file of files) {
          if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error(
              `${file.name}: choose a JPG, PNG, or WebP image.`
            );
          }

          if (file.size === 0 || file.size > MAX_FILE_SIZE) {
            throw new Error(
              `${file.name}: each photo must be smaller than 10 MB and cannot be empty.`
            );
          }

          const extension =
            file.type === "image/jpeg"
              ? "jpg"
              : file.type === "image/png"
                ? "png"
                : "webp";

          const path = `${user.id}/${entryId}/${crypto.randomUUID()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) throw uploadError;

          uploadedPaths.push(path);

          const { error: metadataError } = await supabase
            .from("diary_entry_attachments")
            .insert({
              entry_id: entryId,
              user_id: user.id,
              file_name: file.name,
              storage_path: path,
              content_type: file.type,
              size_bytes: file.size,
            });

          if (metadataError) {
            await supabase.storage.from(BUCKET).remove([path]);
            uploadedPaths.pop();
            throw metadataError;
          }

          uploadedCount++;
        }

        setPendingFiles([]);
        setNotice(
          uploadedCount === 1
            ? "Photo uploaded privately."
            : `${uploadedCount} photos uploaded privately.`
        );
        setRefreshKey((key) => key + 1);

        if (fileInput.current) fileInput.current.value = "";
      } catch (err) {
        console.error("Photo upload error:", err);

        // Clean up files from this batch if an upload fails midway.
        if (uploadedPaths.length > 0) {
          await supabase.storage.from(BUCKET).remove(uploadedPaths);

          await supabase
            .from("diary_entry_attachments")
            .delete()
            .eq("entry_id", entryId)
            .in("storage_path", uploadedPaths);
        }

        setError(
          err instanceof Error
            ? err.message
            : "Photo upload failed. Please try again."
        );
      } finally {
        uploadLock.current = false;
        setBusy(false);
      }
    },
    [entryId]
  );

  // If photos were selected before the first save, upload them once the
  // parent supplies the newly saved entry ID.
  useEffect(() => {
    if (mode === "manage" && entryId && pendingFiles.length > 0) {
      void uploadFiles(pendingFiles);
    }
  }, [mode, entryId, pendingFiles, uploadFiles]);

  async function handleSelection(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setError("");
    setNotice("");

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name}: choose a JPG, PNG, or WebP image.`);
        return;
      }

      if (file.size === 0 || file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: the photo must be smaller than 10 MB.`);
        return;
      }
    }

    if (entryId) {
      await uploadFiles(files);
    } else {
      setPendingFiles((current) => {
        const combined = [...current, ...files];
        const unique = new Map(
          combined.map((file) => [
            `${file.name}-${file.size}-${file.lastModified}`,
            file,
          ])
        );
        return Array.from(unique.values());
      });
      setNotice("Photos are ready and will upload after your entry is saved.");
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function deletePhoto(photo: Attachment) {
    if (!entryId || busy) return;

    const confirmed = window.confirm(
      `Remove "${photo.file_name}" from this diary entry?`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      const { error: metadataError } = await supabase
        .from("diary_entry_attachments")
        .delete()
        .eq("id", photo.id)
        .eq("entry_id", entryId);

      if (metadataError) {
        throw new Error(
          `The photo file was removed, but its record could not be deleted: ${metadataError.message}`
        );
      }

      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      setNotice("Photo removed.");
    } catch (err) {
      console.error("Delete photo error:", err);
      setError(
        err instanceof Error ? err.message : "Could not remove this photo."
      );
      setRefreshKey((key) => key + 1);
    } finally {
      setBusy(false);
    }
  }

  const isManage = mode === "manage";

  return (
    <section className="rounded-3xl border border-white/10 bg-[#15131f] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {isManage ? "Photo memories" : "Attached photos"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-400">
            {isManage
              ? "Attach JPG, PNG, or WebP images. Maximum 10 MB per photo."
              : "Photos attached to this memory."}
          </p>
        </div>

        {isManage && (
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-400 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "+ Add photos"}
          </button>
        )}
      </div>

      {isManage && (
        <>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={(event) => void handleSelection(event.target.files)}
            className="hidden"
          />

          {pendingFiles.length > 0 && !entryId && (
            <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-sm text-violet-200">
              {pendingFiles.length} photo(s) waiting for your entry to be saved.
              <button
                type="button"
                onClick={() => setPendingFiles([])}
                className="ml-2 underline underline-offset-4"
              >
                Clear selection
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 break-words rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"
        >
          {notice}
        </p>
      )}

      {loading ? (
        <p className="mt-5 text-sm text-gray-400">Loading photos…</p>
      ) : photos.length === 0 ? (
        <p className="mt-5 text-sm text-gray-500">
          {isManage
            ? "No photos attached yet."
            : "There are no photos attached to this entry."}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20"
            >
              {photo.previewUrl ? (
                <a
                  href={photo.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={`Open ${photo.file_name}`}
                >
                  {/* The URL is a short-lived, authenticated signed URL. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt={photo.file_name}
                    className="aspect-square w-full object-cover transition hover:opacity-90"
                  />
                </a>
              ) : (
                <div className="flex aspect-square items-center justify-center p-3 text-center text-xs text-gray-500">
                  Preview unavailable
                </div>
              )}

              <div className="p-3">
                <p className="break-words text-xs text-gray-300">
                  {photo.file_name}
                </p>
                {isManage && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deletePhoto(photo)}
                    className="mt-2 text-xs text-red-300 underline underline-offset-4 disabled:opacity-50"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
