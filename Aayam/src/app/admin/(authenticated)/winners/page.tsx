import { prisma } from "@/lib/prisma";
import { WinnersForm } from "./winners-form";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminWinnersPage() {
  const events = await prisma.event.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      registrations: {
        where: {
          OR: [
            { status: "APPROVED" },
            { paymentStatus: "APPROVED" },
          ],
        },
        orderBy: { registrationId: "asc" },
        select: {
          id: true,
          registrationId: true,
          participantName: true,
          teamName: true,
          email: true,
        },
      },
    },
  });

  // Serialize Prisma Decimal and Date objects to plain objects
  const serializedEvents = events.map((event) => ({
    ...event,
    registrationFee: event.registrationFee ? Number(event.registrationFee) : null,
    lastRegistrationDate: event.lastRegistrationDate ? event.lastRegistrationDate.toISOString() : null,
    eventDate: event.eventDate ? event.eventDate.toISOString() : null,
    problemReleaseTime: event.problemReleaseTime ? event.problemReleaseTime.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Trophy className="h-8 w-8 text-indigo-400" />
          <span>Event Winners Management</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Select first, second, and third place winners for each competition from the list of approved participants.
        </p>
      </div>

      <WinnersForm events={serializedEvents} />
    </div>
  );
}
