"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail, getSubmissionConfirmationEmail } from "@/lib/email";
import type { ActionResponse } from "@/types";

export async function submitProjectSubmission(data: {
  registrationId: string;
  participantName: string;
  email: string;
  projectLink: string;
  eventId: string;
}): Promise<ActionResponse> {
  try {
    const { registrationId, participantName, email, projectLink, eventId } = data;

    if (!registrationId || !participantName || !email || !projectLink || !eventId) {
      return { success: false, error: "All fields are required." };
    }

    // Validate link format
    if (!projectLink.startsWith("http://") && !projectLink.startsWith("https://")) {
      return { success: false, error: "Please enter a valid URL starting with http:// or https://" };
    }

    // Find the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { success: false, error: "Competition not found." };
    }

    if (!event.isSubmissionOpen) {
      return { success: false, error: "Submissions are closed for this competition." };
    }

    // Find the registration
    const registration = await prisma.registration.findUnique({
      where: { registrationId },
      include: { event: true },
    });

    if (!registration || registration.eventId !== eventId) {
      return { success: false, error: "Invalid Registration ID for this competition." };
    }

    // Check email (case-insensitive)
    if (registration.email.toLowerCase() !== email.toLowerCase()) {
      return { success: false, error: "The provided email address does not match our registration records." };
    }

    // Check name (case-insensitive)
    if (registration.participantName.toLowerCase() !== participantName.toLowerCase()) {
      return { success: false, error: "The participant/leader name does not match our registration records." };
    }

    // Upsert submission
    await prisma.submission.upsert({
      where: { registrationId: registration.id },
      create: {
        registrationId: registration.id,
        participantName: registration.participantName,
        email: registration.email,
        projectLink,
      },
      update: {
        projectLink,
      },
    });

    // Send confirmation email (non-blocking)
    try {
      const emailContent = await getSubmissionConfirmationEmail({
        participantName: registration.participantName,
        eventName: registration.event.name,
        registrationId,
        projectLink,
      });

      await sendEmail({
        to: registration.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailError) {
      console.error("Failed to send submission email:", emailError);
    }

    revalidatePath(`/events/${event.slug}`);
    revalidatePath(`/admin/registrations/${registration.id}`);
    return { success: true };
  } catch (error) {
    console.error("Project submission error:", error);
    return { success: false, error: "Failed to submit project. Please try again." };
  }
}
