"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

export async function getAboutCards() {
  try {
    return await prisma.aboutCard.findMany({
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch about cards:", error);
    return [];
  }
}

export async function createAboutCard(data: {
  iconName: string;
  title: string;
  description: string;
  sortOrder?: number;
}): Promise<ActionResponse> {
  try {
    if (!data.title || !data.description || !data.iconName) {
      return { success: false, error: "Title, description, and icon name are required." };
    }

    await prisma.aboutCard.create({
      data: {
        iconName: data.iconName,
        title: data.title,
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    revalidatePath("/about");
    revalidatePath("/admin/about");
    return { success: true };
  } catch (error) {
    console.error("Failed to create about card:", error);
    return { success: false, error: "Failed to create about card" };
  }
}

export async function updateAboutCard(
  id: string,
  data: {
    iconName?: string;
    title?: string;
    description?: string;
    sortOrder?: number;
  }
): Promise<ActionResponse> {
  try {
    await prisma.aboutCard.update({
      where: { id },
      data,
    });

    revalidatePath("/about");
    revalidatePath("/admin/about");
    return { success: true };
  } catch (error) {
    console.error("Failed to update about card:", error);
    return { success: false, error: "Failed to update about card" };
  }
}

export async function deleteAboutCard(id: string): Promise<ActionResponse> {
  try {
    await prisma.aboutCard.delete({
      where: { id },
    });

    revalidatePath("/about");
    revalidatePath("/admin/about");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete about card:", error);
    return { success: false, error: "Failed to delete about card" };
  }
}
