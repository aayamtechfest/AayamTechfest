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
