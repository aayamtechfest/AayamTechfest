"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail, getBroadcastEmailHtml } from "@/lib/email";
import type { ActionResponse } from "@/types";

export interface BroadcastRecipient {
  id: string;
  participantName: string;
  email: string;
  eventName: string;
  registrationId: string;
}

export async function getBroadcastRecipients(): Promise<BroadcastRecipient[]> {
  try {
    const registrations = await prisma.registration.findMany({
      select: {
        id: true,
        participantName: true,
        email: true,
        registrationId: true,
        event: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return registrations.map((r) => ({
      id: r.id,
      participantName: r.participantName,
      email: r.email,
      eventName: r.event.name,
      registrationId: r.registrationId,
    }));
  } catch (error) {
    console.error("Failed to fetch broadcast recipients:", error);
    return [];
  }
}

export async function sendBroadcastEmail(
  recipientIds: string[],
  subject: string,
  body: string
): Promise<ActionResponse<{ sent: number; failed: number }>> {
  if (!subject.trim()) {
    return { success: false, error: "Subject is required." };
  }
  if (!body.trim()) {
    return { success: false, error: "Email body is required." };
  }
  if (recipientIds.length === 0) {
    return { success: false, error: "Please select at least one recipient." };
  }

  // Fetch selected recipients
  let registrations: { email: string; participantName: string }[] = [];
  try {
    registrations = await prisma.registration.findMany({
      where: { id: { in: recipientIds } },
      select: { email: true, participantName: true },
    });
  } catch (error) {
    console.error("Failed to fetch recipients for broadcast:", error);
    return { success: false, error: "Failed to fetch recipients." };
  }

  // Generate the styled HTML once
  const html = await getBroadcastEmailHtml(subject, body);

  let sent = 0;
  let failed = 0;

  // Send emails in batches of 5 to respect rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < registrations.length; i += BATCH_SIZE) {
    const batch = registrations.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (r) => {
        try {
          await sendEmail({
            to: r.email,
            subject,
            html,
          });
          sent++;
        } catch (err) {
          console.error(`[Broadcast] Failed to send to ${r.email}:`, err);
          failed++;
        }
      })
    );
  }

  console.log(`[Broadcast] Completed: ${sent} sent, ${failed} failed`);

  return {
    success: true,
    data: { sent, failed },
  };
}
