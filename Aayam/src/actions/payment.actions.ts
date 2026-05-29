"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail, getPaymentApprovedEmail, getPaymentRejectedEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

export async function verifyPayment(
  registrationId: string,
  status: "APPROVED" | "REJECTED",
  notes?: string
): Promise<ActionResponse> {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      return { success: false, error: "Registration not found" };
    }

    if (status === "REJECTED" && (!notes || notes.trim() === "")) {
      return { success: false, error: "Rejection notes are required to reject payment." };
    }

    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: status,
        paymentNotes: notes || null,
        paymentVerifiedAt: new Date(),
        status: status === "APPROVED" ? "APPROVED" : "REJECTED",
      },
    });

    // Send email notification (non-blocking)
    try {
      if (status === "APPROVED") {
        const emailContent = await getPaymentApprovedEmail({
          participantName: registration.participantName,
          eventName: registration.event.name,
          registrationId: registration.registrationId,
        });
        await sendEmail({
          to: registration.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      } else {
        const emailContent = await getPaymentRejectedEmail({
          participantName: registration.participantName,
          eventName: registration.event.name,
          registrationId: registration.registrationId,
          reason: notes,
        });
        await sendEmail({
          to: registration.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    } catch (emailError) {
      console.error("Failed to send payment email:", emailError);
    }

    revalidatePath("/admin/payments");
    revalidatePath("/admin/registrations");
    return { success: true };
  } catch (error) {
    console.error("Verify payment error:", error);
    return { success: false, error: "Failed to verify payment" };
  }
}

export async function getPendingPayments() {
  try {
    return await prisma.registration.findMany({
      where: { paymentStatus: "PENDING" },
      include: { event: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.warn("⚠️ [Prisma] Database is not reachable. Using fallback pending payments.");
    return [];
  }
}

export async function getPaymentStats() {
  try {
    const [pending, approved, rejected] = await Promise.all([
      prisma.registration.count({ where: { paymentStatus: "PENDING" } }),
      prisma.registration.count({ where: { paymentStatus: "APPROVED" } }),
      prisma.registration.count({ where: { paymentStatus: "REJECTED" } }),
    ]);

    return { pending, approved, rejected, total: pending + approved + rejected };
  } catch (error) {
    console.warn("⚠️ [Prisma] Database is not reachable. Using fallback payment stats.");
    return { pending: 0, approved: 0, rejected: 0, total: 0 };
  }
}
