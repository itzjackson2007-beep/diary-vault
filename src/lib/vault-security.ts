import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing server-only Supabase configuration.");
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSecret() {
  const secret = process.env.VAULT_LOCK_SECRET;

  if (!secret) {
    throw new Error("Missing VAULT_LOCK_SECRET.");
  }

  return secret;
}

export function createUnlockToken(userId: string) {
  const issuedAt = Date.now().toString();
  const payload = `${userId}.${issuedAt}`;

  const signature = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

export function isUnlockTokenValid(
  token: string | undefined,
  userId: string
) {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [tokenUserId, issuedAt, signature] = parts;

  if (tokenUserId !== userId) return false;
  if (!/^\d+$/.test(issuedAt)) return false;
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  const age = Date.now() - Number(issuedAt);
  const twelveHours = 12 * 60 * 60 * 1000;

  if (age < 0 || age > twelveHours) return false;

  const expected = createHmac("sha256", getSecret())
    .update(`${tokenUserId}.${issuedAt}`)
    .digest();

  const supplied = Buffer.from(signature, "hex");

  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
  );
}
