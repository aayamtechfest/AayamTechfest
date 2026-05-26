"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { loginSchema } from "@/schemas/auth.schema";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import type { ActionResponse } from "@/types";

export async function loginAction(formData: FormData) {
  try {
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const parsed = loginSchema.safeParse(rawData);

    if (!parsed.success) {
      return { error: "Invalid email or password format" };
    }

    const { email, password } = parsed.data;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return { error: "Invalid email or password" };
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return { error: "Invalid email or password" };
    }

    const session = await getSession();
    session.adminId = admin.id;
    session.adminEmail = admin.email;
    session.adminName = admin.name;
    session.isLoggedIn = true;
    await session.save();
  } catch (error) {
    const isRedirect = error instanceof Error && error.message === "NEXT_REDIRECT";
    if (isRedirect) throw error; // Allow Next.js redirect to function
    console.warn("⚠️ [Auth] Database connection failed during login:", error instanceof Error ? error.message : error);
    return { error: "Could not connect to database. Please verify your DATABASE_URL." };
  }

  redirect("/admin");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || !session.isLoggedIn || !session.adminId) {
      return { success: false, error: "Unauthorized access." };
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
    });

    if (!admin) {
      return { success: false, error: "Admin not found." };
    }

    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      return { success: false, error: "Incorrect current password." };
    }

    if (newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedNewPassword },
    });

    return { success: true };
  } catch (error) {
    console.warn("⚠️ [Auth] Database connection failed during password change:", error instanceof Error ? error.message : error);
    return { success: false, error: "Failed to change password. Please check your database connection." };
  }
}
