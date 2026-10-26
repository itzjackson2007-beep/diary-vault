
import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { isUnlockTokenValid } from "@/lib/vault-security";
import VaultActivity from "./vault-activity";

// This dashboard requires request-time authentication and vault checks.
export const instant = false;

const COOKIE_NAME = "diaryvault_vault_unlocked";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!isUnlockTokenValid(token, user.id)) {
    redirect("/vault-lock");
  }

  return <VaultActivity>{children}</VaultActivity>;
}
