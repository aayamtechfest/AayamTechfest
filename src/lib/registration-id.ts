import { prisma } from "@/lib/prisma";
import { EVENT_CODE_MAP } from "@/lib/constants";

/**
 * Generate a unique registration ID like AAYAM-HACK-001
 * Uses the event slug to look up the event code, then counts existing registrations
 */
export async function generateRegistrationId(eventSlug: string): Promise<string> {
  // Get the event code from the slug, or create one from the first 4 chars
  const eventCode =
    EVENT_CODE_MAP[eventSlug] ||
    eventSlug
      .replace(/-/g, "")
      .substring(0, 4)
      .toUpperCase();

  // Count existing registrations for this event
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: { id: true },
  });

  if (!event) {
    throw new Error(`Event not found: ${eventSlug}`);
  }

  const count = await prisma.registration.count({
    where: { eventId: event.id },
  });

  // Format: AAYAM-CODE-001
  const sequenceNumber = String(count + 1).padStart(3, "0");
  return `AAYAM-${eventCode}-${sequenceNumber}`;
}
