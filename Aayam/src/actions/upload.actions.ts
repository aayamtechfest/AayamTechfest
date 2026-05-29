"use server";

import { uploadToCloudinary, deleteFromCloudinary, type CloudinaryFolder } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import type { ActionResponse } from "@/types";

export async function uploadFile(
  formData: FormData,
  folder: CloudinaryFolder
): Promise<ActionResponse<{ url: string; publicId: string }>> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File size must be less than 5MB" };
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Only JPEG, PNG, and WebP images are allowed" };
    }

    const result = await uploadToCloudinary(file, folder);

    // Store in database
    await prisma.uploadedMedia.create({
      data: {
        name: file.name,
        url: result.url,
        publicId: result.publicId,
        type: "image",
        category: folder.split("/").pop() || "general",
        size: file.size,
      },
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

export async function deleteFile(publicId: string): Promise<ActionResponse> {
  try {
    await deleteFromCloudinary(publicId);
    await prisma.uploadedMedia.deleteMany({
      where: { publicId },
    });
    return { success: true };
  } catch (error) {
    console.error("Delete file error:", error);
    return { success: false, error: "Failed to delete file" };
  }
}
