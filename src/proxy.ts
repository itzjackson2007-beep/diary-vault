
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase-proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on application pages, excluding Next.js static assets,
     * image optimization, favicon, and common image files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

