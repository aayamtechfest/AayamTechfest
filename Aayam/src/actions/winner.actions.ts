"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

export async function setEventWinners(
  eventId: string,
  winner1Id: string | null,
  winner2Id: string | null,
  winner3Id: string | null
): Promise<ActionResponse> {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required." };
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        winner1Id: winner1Id || null,
        winner2Id: winner2Id || null,
        winner3Id: winner3Id || null,
      },
    });

    revalidatePath("/admin/winners");
    revalidatePath("/events");
    revalidatePath("/");
    
    // Also revalidate detail pages if they exist
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { slug: true }
    });
    if (event?.slug) {
      revalidatePath(`/events/${event.slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Set winners error:", error);
    return { success: false, error: "Failed to set winners." };
  }
}

export async function getEventsWithWinners() {
  try {
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { winner1Id: { not: null } },
          { winner2Id: { not: null } },
          { winner3Id: { not: null } },
        ],
      },
      include: {
        winner1: true,
        winner2: true,
        winner3: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    const serializeRegistration = (reg: any) => {
      if (!reg) return null;
      return {
        ...reg,
        paymentAmount: reg.paymentAmount ? Number(reg.paymentAmount) : null,
        paymentVerifiedAt: reg.paymentVerifiedAt ? reg.paymentVerifiedAt.toISOString() : null,
        createdAt: reg.createdAt.toISOString(),
        updatedAt: reg.updatedAt.toISOString(),
      };
    };

    return events.map((event) => ({
      ...event,
      registrationFee: event.registrationFee ? Number(event.registrationFee) : null,
      lastRegistrationDate: event.lastRegistrationDate ? event.lastRegistrationDate.toISOString() : null,
      eventDate: event.eventDate ? event.eventDate.toISOString() : null,
      problemReleaseTime: event.problemReleaseTime ? event.problemReleaseTime.toISOString() : null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      winner1: serializeRegistration(event.winner1),
      winner2: serializeRegistration(event.winner2),
      winner3: serializeRegistration(event.winner3),
    }));
  } catch (error) {
    console.warn("⚠️ [Prisma] Database is not reachable. Using fallback winners.");
    return [];
  }
}
