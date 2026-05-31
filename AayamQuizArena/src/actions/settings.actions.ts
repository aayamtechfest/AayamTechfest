"use server";

import { prisma } from "@/lib/prisma";

export async function getSettings(): Promise<any | null> {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) return null;

    const socialLinks = settings.socialLinks as any;
    return {
      ...settings,
      instagramUrl: socialLinks?.instagram || "",
      githubUrl: socialLinks?.github || "",
      twitterUrl: socialLinks?.twitter || "",
      linkedinUrl: socialLinks?.linkedin || "",
      youtubeUrl: socialLinks?.youtube || "",
    };
  } catch (error) {
    console.warn("⚠️ [Prisma] Database is not reachable. Using fallback settings.");
    return null;
  }
}

export async function saveSocketUrlAction(url: string | null) {
  try {
    const existing = await prisma.settings.findFirst();
    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: { socketUrl: url || null },
      });
    } else {
      await prisma.settings.create({
        data: { socketUrl: url || null },
      });
    }
    
    // Import and call revalidatePath dynamically to refresh server rendered pages
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
    revalidatePath("/admin/settings");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to save socket URL:", error);
    return { success: false, error: "Failed to save to database" };
  }
}
