"use server";

import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/schemas/settings.schema";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";
import { getPublicIdFromUrl } from "@/lib/utils";
import { deleteFromCloudinary } from "@/lib/cloudinary";

// Fields that hold Cloudinary image URLs in Settings
const IMAGE_FIELDS = [
  "logoUrl",
  "headerLogoUrl",
  "footerLogoUrl",
  "faviconUrl",
  "heroBannerUrl",
  "paymentQrCodeUrl",
] as const;

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

export async function updateSettings(data: Record<string, unknown>): Promise<ActionResponse> {
  try {
    const parsed = settingsSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const existing = await prisma.settings.findFirst();

    const { instagramUrl, githubUrl, twitterUrl, linkedinUrl, youtubeUrl, countdownDate, ...rest } = parsed.data as any;

    const socialLinks = {
      instagram: instagramUrl || "",
      github: githubUrl || "",
      twitter: twitterUrl || "",
      linkedin: linkedinUrl || "",
      youtube: youtubeUrl || "",
    };

    const updateData = {
      ...rest,
      socialLinks,
      countdownDate: countdownDate ? new Date(countdownDate) : null,
    };

    // ─── Cloudinary Replacement Cleanup ───────────────────────────────────────
    // Delete old images if URLs have changed to a new Cloudinary asset
    if (existing) {
      for (const field of IMAGE_FIELDS) {
        const oldUrl = (existing as any)[field] as string | null | undefined;
        const newUrl = (rest as any)[field] as string | null | undefined;

        if (
          oldUrl &&
          newUrl &&
          oldUrl !== newUrl &&
          oldUrl.includes("res.cloudinary.com")
        ) {
          const publicId = getPublicIdFromUrl(oldUrl);
          if (publicId) {
            try {
              await deleteFromCloudinary(publicId);
              console.log(`[Cloudinary] Deleted old ${field}: ${publicId}`);
            } catch (err) {
              console.error(`[Cloudinary] Failed to delete old ${field}:`, err);
            }
          }
        }
      }
    }

    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      await prisma.settings.create({
        data: updateData,
      });
    }

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Update settings error:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

export async function updateSettingsField(
  field: string,
  value: string
): Promise<ActionResponse> {
  try {
    const existing = await prisma.settings.findFirst();

    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: { [field]: value },
      });
    }

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Update settings field error:", error);
    return { success: false, error: "Failed to update" };
  }
}

export async function resetCountdownDate(): Promise<ActionResponse> {
  try {
    const existing = await prisma.settings.findFirst();
    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: { countdownDate: null },
      });
    }
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Reset countdown error:", error);
    return { success: false, error: "Failed to reset countdown" };
  }
}
