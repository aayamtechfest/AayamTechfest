"use server";

import { prisma } from "@/lib/prisma";
import { eventSchema, type EventFormData } from "@/schemas/event.schema";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";
import type { Event } from "@prisma/client";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { getPublicIdFromUrl, serializePrisma } from "@/lib/utils";

export async function createEvent(data: EventFormData): Promise<ActionResponse<Event>> {
  try {
    const parsed = eventSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const existing = await prisma.event.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existing) {
      return { success: false, error: "An event with this slug already exists" };
    }

    const event = await prisma.event.create({
      data: {
        ...parsed.data,
        registrationFee: parsed.data.registrationFee ?? undefined,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true, data: serializePrisma(event) };
  } catch (error) {
    console.error("Create event error:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(id: string, data: EventFormData): Promise<ActionResponse<Event>> {
  try {
    const parsed = eventSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const existing = await prisma.event.findFirst({
      where: { slug: parsed.data.slug, NOT: { id } },
    });

    if (existing) {
      return { success: false, error: "An event with this slug already exists" };
    }

    // ─── Cloudinary Banner Cleanup ─────────────────────────────────────────
    const currentEvent = await prisma.event.findUnique({
      where: { id },
      select: { bannerUrl: true },
    });
    if (
      currentEvent?.bannerUrl &&
      parsed.data.bannerUrl &&
      currentEvent.bannerUrl !== parsed.data.bannerUrl &&
      currentEvent.bannerUrl.includes("res.cloudinary.com")
    ) {
      const publicId = getPublicIdFromUrl(currentEvent.bannerUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
          console.log(`[Cloudinary] Deleted old event banner: ${publicId}`);
        } catch (err) {
          console.error(`[Cloudinary] Failed to delete old banner:`, err);
        }
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...parsed.data,
        registrationFee: parsed.data.registrationFee ?? undefined,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath(`/events/${event.slug}`);
    return { success: true, data: serializePrisma(event) };
  } catch (error) {
    console.error("Update event error:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(id: string): Promise<ActionResponse> {
  try {
    const registrationCount = await prisma.registration.count({
      where: { eventId: id },
    });

    if (registrationCount > 0) {
      return {
        success: false,
        error: `Cannot delete event because it has ${registrationCount} active registrations. Please delete all registrations for this event first.`,
      };
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { bannerUrl: true },
    });

    if (event?.bannerUrl) {
      const publicId = getPublicIdFromUrl(event.bannerUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (cloudinaryError) {
          console.error(`Failed to delete Cloudinary banner for event ${id}:`, cloudinaryError);
        }
      }
    }

    await prisma.event.delete({ where: { id } });
    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Delete event error:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

export async function toggleEventPublish(id: string): Promise<ActionResponse> {
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return { success: false, error: "Event not found" };

    await prisma.event.update({
      where: { id },
      data: { isPublished: !event.isPublished },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Toggle publish error:", error);
    return { success: false, error: "Failed to toggle publish status" };
  }
}

export async function toggleEventRegistration(id: string): Promise<ActionResponse> {
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return { success: false, error: "Event not found" };

    await prisma.event.update({
      where: { id },
      data: { isRegistrationOpen: !event.isRegistrationOpen },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Toggle registration error:", error);
    return { success: false, error: "Failed to toggle registration status" };
  }
}

export async function getEvents() {
  try {
    return await prisma.event.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { registrations: true } },
      },
    });
  } catch (error) {
    console.warn("⚠️ [Prisma] Database is not reachable. Using fallback events.");
    return [];
  }
}

export async function getPublishedEvents() {
  try {
    return await prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.warn("⚠️ [Prisma] Database is not reachable. Using fallback events.");
    return [];
  }
}

export async function getEventBySlug(slug: string) {
  try {
    return await prisma.event.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.warn(`⚠️ [Prisma] Database is not reachable. Failed to fetch event by slug: ${slug}`);
    return null;
  }
}

export async function getEventById(id: string) {
  try {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { registrations: true } },
      },
    });
  } catch (error) {
    console.warn(`⚠️ [Prisma] Database is not reachable. Failed to fetch event by id: ${id}`);
    return null;
  }
}
