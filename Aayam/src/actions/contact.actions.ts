"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

export async function submitContactMessage(formData: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<ActionResponse> {
  try {
    if (!formData.name || !formData.email || !formData.message) {
      return { success: false, error: "Name, email, and message are required." };
    }

    await prisma.contactMessage.create({
      data: {
        name: formData.name,
        email: formData.email,
        subject: formData.subject || null,
        message: formData.message,
      },
    });

    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error) {
    console.error("Submit contact message error:", error);
    return { success: false, error: "Failed to send message. Please try again later." };
  }
}

export async function getContactMessages() {
  try {
    return await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Get contact messages error:", error);
    return [];
  }
}

export async function markContactMessageRead(id: string): Promise<ActionResponse> {
  try {
    await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error) {
    console.error("Mark message read error:", error);
    return { success: false, error: "Failed to mark message as read." };
  }
}

export async function toggleContactMessageRead(id: string, isRead: boolean): Promise<ActionResponse> {
  try {
    await prisma.contactMessage.update({
      where: { id },
      data: { isRead },
    });
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error) {
    console.error("Toggle message read error:", error);
    return { success: false, error: "Failed to update message status." };
  }
}

export async function deleteContactMessage(id: string): Promise<ActionResponse> {
  try {
    await prisma.contactMessage.delete({
      where: { id },
    });
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error) {
    console.error("Delete message error:", error);
    return { success: false, error: "Failed to delete message." };
  }
}
