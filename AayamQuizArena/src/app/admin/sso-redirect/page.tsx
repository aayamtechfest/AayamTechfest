import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { generateSSOToken } from "@/lib/sso";

export const dynamic = "force-dynamic";

export default async function SSORedirectPage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/admin/login?redirect=/admin/sso-redirect");
  }

  const token = generateSSOToken(
    {
      id: session.adminId,
      email: session.adminEmail,
      name: session.adminName,
    },
    process.env.SESSION_SECRET!
  );

  const targetUrl = process.env.NEXT_PUBLIC_AAYAM_URL || "http://localhost:3000";
  redirect(`${targetUrl}/admin/sso?token=${token}`);
}
