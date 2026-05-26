"use server";

import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/schemas/registration.schema";
import { generateRegistrationId } from "@/lib/registration-id";
import { sendEmail, getRegistrationConfirmationEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { ActionResponse, RegistrationFilters } from "@/types";
import { formatDate, getPublicIdFromUrl } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import type { Prisma } from "@prisma/client";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function submitRegistration(
  eventSlug: string,
  formData: Record<string, unknown>,
  paymentScreenshotUrl?: string
): Promise<ActionResponse<{ registrationId: string }>> {
  try {
    const parsed = registrationSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const event = await prisma.event.findUnique({
      where: { slug: eventSlug },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const isTeamRegistration = event.participationType === "TEAM" ||
      (event.participationType === "BOTH" && parsed.data.teamMembers && parsed.data.teamMembers.length > 0);

    if (isTeamRegistration && (!parsed.data.teamName || parsed.data.teamName.trim() === "")) {
      return { success: false, error: "Team name is required for team registration." };
    }

    if (!event.isRegistrationOpen) {
      return { success: false, error: "Registration is closed for this event" };
    }

    if (event.lastRegistrationDate && new Date() > event.lastRegistrationDate) {
      return { success: false, error: "Registration deadline has passed" };
    }

    // Check for duplicate registration
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        email: parsed.data.email,
        eventId: event.id,
      },
    });

    if (existingRegistration) {
      return { success: false, error: "You have already registered for this event" };
    }

    const registrationId = await generateRegistrationId(eventSlug);

    const registration = await prisma.registration.create({
      data: {
        registrationId,
        eventId: event.id,
        participantName: parsed.data.participantName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        collegeName: parsed.data.collegeName,
        department: parsed.data.department || null,
        yearOrSemester: parsed.data.yearOrSemester || null,
        teamName: parsed.data.teamName || null,
        paymentReference: parsed.data.paymentReference || null,
        paymentScreenshot: paymentScreenshotUrl || null,
        paymentAmount: event.registrationFee || null,
        notes: parsed.data.notes || null,
        status: "SUBMITTED",
        paymentStatus: event.registrationFee ? "PENDING" : "APPROVED",
        teamMembers: parsed.data.teamMembers?.length
          ? {
              create: parsed.data.teamMembers.map((member) => ({
                name: member.name,
                email: member.email || null,
                phone: member.phone || null,
                collegeName: member.collegeName || null,
                department: member.department || null,
                yearOrSemester: member.yearOrSemester || null,
                role: member.role || "Member",
              })),
            }
          : undefined,
      },
    });

    // Send confirmation email (non-blocking)
    try {
      const emailContent = await getRegistrationConfirmationEmail({
        participantName: parsed.data.participantName,
        eventName: event.name,
        registrationId,
        paymentStatus: event.registrationFee ? "PENDING" : "APPROVED",
        eventDate: event.eventDate ? formatDate(event.eventDate) : undefined,
      });

      await sendEmail({
        to: parsed.data.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the registration if email fails
    }

    revalidatePath("/admin/registrations");
    revalidatePath("/admin/payments");
    return { success: true, data: { registrationId: registration.registrationId } };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to submit registration. Please try again." };
  }
}

export async function getRegistrations(filters: RegistrationFilters = {}) {
  try {
    const { eventId, paymentStatus, status, search, page = 1, pageSize = ITEMS_PER_PAGE } = filters;

    const where: Prisma.RegistrationWhereInput = {};

    if (eventId) where.eventId = eventId;
    if (paymentStatus) where.paymentStatus = paymentStatus as Prisma.EnumPaymentStatusFilter;
    if (status) where.status = status as Prisma.EnumRegistrationStatusFilter;
    if (search) {
      where.OR = [
        { participantName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { registrationId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: { event: true, teamMembers: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.registration.count({ where }),
    ]);

    return {
      registrations,
      total,
      pages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.warn("⚠️ [Prisma] Database is not reachable. Using fallback registrations.");
    return {
      registrations: [],
      total: 0,
      pages: 0,
      currentPage: filters.page || 1,
    };
  }
}

export async function getRegistrationById(id: string) {
  try {
    return await prisma.registration.findUnique({
      where: { id },
      include: { event: true, teamMembers: true },
    });
  } catch (error) {
    console.warn(`⚠️ [Prisma] Database is not reachable. Failed to fetch registration by id: ${id}`);
    return null;
  }
}

export async function updateRegistrationStatus(
  id: string,
  status: string
): Promise<ActionResponse> {
  try {
    await prisma.registration.update({
      where: { id },
      data: { status: status as never },
    });

    revalidatePath("/admin/registrations");
    return { success: true };
  } catch (error) {
    console.error("Update registration status error:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function deleteRegistration(id: string): Promise<ActionResponse> {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id },
      select: { paymentScreenshot: true },
    });

    if (!registration) {
      return { success: false, error: "Registration not found" };
    }

    if (registration.paymentScreenshot) {
      const publicId = getPublicIdFromUrl(registration.paymentScreenshot);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (cloudinaryError) {
          console.error(`Failed to delete Cloudinary receipt for registration ${id}:`, cloudinaryError);
        }
      }
    }

    await prisma.registration.delete({ where: { id } });

    revalidatePath("/admin/registrations");
    revalidatePath("/admin/payments");
    return { success: true };
  } catch (error) {
    console.error("Delete registration error:", error);
    return { success: false, error: "Failed to delete registration" };
  }
}
