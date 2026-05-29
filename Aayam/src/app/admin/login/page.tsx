import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLoginFormClient } from "./login-form-client";

export default async function AdminLoginPage() {
  const session = await getSession();

  if (session.isLoggedIn) {
    redirect("/admin");
  }

  return <AdminLoginFormClient />;
}
