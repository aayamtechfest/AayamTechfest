"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function getExportData(filters: {
  eventId?: string;
  paymentStatus?: string;
}) {
  const where: Prisma.RegistrationWhereInput = {};

  if (filters.eventId) where.eventId = filters.eventId;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus as Prisma.EnumPaymentStatusFilter;

  const registrations = await prisma.registration.findMany({
    where,
    include: { event: true, teamMembers: true },
    orderBy: { createdAt: "desc" },
  });

  return registrations.map((reg) => ({
    "Registration ID": reg.registrationId,
    "Participant Name": reg.participantName,
    "Email": reg.email,
    "Phone": reg.phone,
    "College": reg.collegeName,
    "Department": reg.department || "",
    "Year/Semester": reg.yearOrSemester || "",
    "Event": reg.event.name,
    "Team Name": reg.teamName || "",
    "Team Members": reg.teamMembers.map((m) => m.name).join(", "),
    "Payment Status": reg.paymentStatus,
    "UTR/Reference": reg.paymentReference || "",
    "Payment Amount": reg.paymentAmount ? Number(reg.paymentAmount) : "",
    "Screenshot Link": reg.paymentScreenshot || "",
    "Registration Status": reg.status,
    "Notes": reg.notes || "",
    "Registered At": reg.createdAt.toISOString(),
  }));
}

export async function getDashboardStats() {
  const [
    totalRegistrations,
    pendingPayments,
    approvedPayments,
    rejectedPayments,
    activeEvents,
    totalEvents,
  ] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { paymentStatus: "PENDING" } }),
    prisma.registration.count({ where: { paymentStatus: "APPROVED" } }),
    prisma.registration.count({ where: { paymentStatus: "REJECTED" } }),
    prisma.event.count({ where: { isPublished: true, isRegistrationOpen: true } }),
    prisma.event.count(),
  ]);

  return {
    totalRegistrations,
    pendingPayments,
    approvedPayments,
    rejectedPayments,
    activeEvents,
    totalEvents,
  };
}
