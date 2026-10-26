
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret) {
      return NextResponse.json(
        { error: "Bot protection is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim() : "";
    const token =
      typeof body.token === "string" ? body.token : "";

    if (!email || !token || email.length > 320 || token.length > 2048) {
      return NextResponse.json(
        { error: "Please enter your email and complete the bot check." },
        { status: 400 }
      );
    }

    const verificationResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          response: token,
        }),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      }
    );

    if (!verificationResponse.ok) {
      return NextResponse.json(
        { error: "Bot verification is temporarily unavailable." },
        { status: 503 }
      );
    }

    const verification = await verificationResponse.json();

    const requestHostname = new URL(request.url).hostname;

    if (
      verification.success !== true ||
      verification.hostname !== requestHostname
    ) {
      return NextResponse.json(
        { error: "Bot verification failed. Please try again." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
    });

    if (error) {
      return NextResponse.json(
        { error: "Unable to process your request. Please try again later." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message:
        "If an account exists for this email, a password reset link will be sent. Check your inbox and spam folder.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process your request. Please try again." },
      { status: 500 }
    );
  }
}
