import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { verifySSOToken } from "@/lib/sso";

interface SSOPageProps {
  searchParams: Promise<{ token?: string }>;
}

export const dynamic = "force-dynamic";

export default async function SSOPage({ searchParams }: SSOPageProps) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  if (!token) {
    redirect("/admin/login?error=missing_token");
  }

  const verified = verifySSOToken(token, process.env.SESSION_SECRET!);

  if (!verified) {
    redirect("/admin/login?error=invalid_token");
  }

  // Create local session
  const session = await getSession();
  session.adminId = verified.adminId;
  session.adminEmail = verified.adminEmail;
  session.adminName = verified.adminName;
  session.isLoggedIn = true;
  await session.save();

  redirect("/admin");
}
