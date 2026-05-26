import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const paymentStatus = searchParams.get("paymentStatus");

    // Construct filter query
    const where: any = {};
    if (eventId && eventId !== "ALL") {
      where.eventId = eventId;
    }
    if (paymentStatus && paymentStatus !== "ALL") {
      where.paymentStatus = paymentStatus;
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        event: true,
        teamMembers: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Flatten registrations list into flat Excel rows
    const rows = registrations.map((reg) => ({
      "Registration ID": reg.registrationId,
      "Participant Name": reg.participantName,
      "Email": reg.email,
      "Phone": reg.phone,
      "College Name": reg.collegeName,
      "Department": reg.department || "",
      "Year/Semester": reg.yearOrSemester || "",
      "Event": reg.event.name,
      "Team Name": reg.teamName || "",
      "Team Members": reg.teamMembers.map((m) => m.name).join(", "),
      "Payment Status": reg.paymentStatus,
      "UTR/Reference": reg.paymentReference || "",
      "Screenshot Link": reg.paymentScreenshot || "",
      "Status": reg.status,
      "Registered At": reg.createdAt.toLocaleString("en-IN"),
    }));

    // Create SheetJS workbook
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // Set column widths automatically
    const maxLengths = rows.reduce((acc: any, row: any) => {
      Object.keys(row).forEach((key) => {
        const valStr = String(row[key]);
        acc[key] = Math.max(acc[key] || 10, valStr.length, key.length);
      });
      return acc;
    }, {});
    
    worksheet["!cols"] = Object.keys(maxLengths).map((key) => ({
      wch: maxLengths[key] + 3,
    }));

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="aayam-registrations.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export registrations API error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel download" },
      { status: 500 }
    );
  }
}
