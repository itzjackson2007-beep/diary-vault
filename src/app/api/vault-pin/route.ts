import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  createAdminClient,
  createUnlockToken,
} from "@/lib/vault-security";


const deriveKey = promisify(pbkdf2);
const ITERATIONS = 310000;
const PIN_PATTERN = /^\d{6}$/;
const COOKIE_NAME = "diaryvault_vault_unlocked";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;
  return data.user;
}

function setUnlockCookie(
  response: NextResponse,
  userId: string,
  request: NextRequest
) {
  response.cookies.set(COOKIE_NAME, createUnlockToken(userId), {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in again." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("vault_pin_settings")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Vault PIN status error:", error.message);
      return NextResponse.json(
        { error: "Unable to check vault settings." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { configured: Boolean(data) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Vault PIN GET failed:", error);

    return NextResponse.json(
      { error: "Server configuration error. Check the terminal." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in again." },
        { status: 401 }
      );
    }

    let body: {
      action?: string;
      pin?: string;
      confirmPin?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    const { action, pin, confirmPin } = body;

    if (typeof pin !== "string" || !PIN_PATTERN.test(pin)) {
      return NextResponse.json(
        { error: "Enter exactly six digits." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    if (action === "setup") {
      if (confirmPin !== pin) {
        return NextResponse.json(
          { error: "Your PIN entries do not match." },
          { status: 400 }
        );
      }

      const salt = randomBytes(16).toString("hex");
      const hash = (
        await deriveKey(pin, salt, ITERATIONS, 32, "sha256")
      ).toString("hex");

      const { error } = await admin
        .from("vault_pin_settings")
        .insert({
          user_id: user.id,
          pin_hash: hash,
          pin_salt: salt,
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "A Vault PIN already exists for this account. Refresh the page." },
            { status: 409 }
          );
        }

        console.error("Vault PIN setup error:", error.message);

        return NextResponse.json(
          { error: "Unable to set up your PIN. Check the terminal." },
          { status: 500 }
        );
      }

      const response = NextResponse.json({ success: true });
      setUnlockCookie(response, user.id, request);
      return response;
    }

    if (action === "verify") {
      const { data: settings, error } = await admin
        .from("vault_pin_settings")
        .select("pin_hash, pin_salt, failed_attempts, locked_until")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Vault PIN lookup error:", error.message);
        return NextResponse.json(
          { error: "Unable to verify your PIN." },
          { status: 500 }
        );
      }

      if (!settings) {
        return NextResponse.json(
          { error: "Create your Vault PIN first." },
          { status: 400 }
        );
      }

      if (
        settings.locked_until &&
        new Date(settings.locked_until).getTime() > Date.now()
      ) {
        return NextResponse.json(
          { error: "Too many attempts. Wait five minutes and try again." },
          { status: 429 }
        );
      }

      const calculated = await deriveKey(
        pin,
        settings.pin_salt,
        ITERATIONS,
        32,
        "sha256"
      );

      const stored = Buffer.from(settings.pin_hash, "hex");
      const matches =
        stored.length === calculated.length &&
        timingSafeEqual(stored, calculated);

      if (!matches) {
        const attempts = (settings.failed_attempts ?? 0) + 1;
        const lockedUntil =
          attempts >= 5
            ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
            : null;

        await admin
          .from("vault_pin_settings")
          .update({
            failed_attempts: lockedUntil ? 0 : attempts,
            locked_until: lockedUntil,
          })
          .eq("user_id", user.id);

        return NextResponse.json(
          {
            error: lockedUntil
              ? "Too many incorrect attempts. Wait five minutes."
              : `Incorrect PIN. ${5 - attempts} attempt(s) remaining.`,
          },
          { status: lockedUntil ? 429 : 401 }
        );
      }

      await admin
        .from("vault_pin_settings")
        .update({
          failed_attempts: 0,
          locked_until: null,
        })
        .eq("user_id", user.id);

      const response = NextResponse.json({ success: true });
      setUnlockCookie(response, user.id, request);
      return response;
    }

    return NextResponse.json(
      { error: "Unsupported action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Vault PIN POST failed:", error);

    return NextResponse.json(
      { error: "Server configuration error. Check the terminal." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
