import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  Users,
  Clock,
  CheckCircle,
  Calendar,
  ArrowRight,
  TrendingUp,
  Eye,
  Download,
} from "lucide-react";

async function getDashboardData() {
  try {
    const [
      totalRegistrations,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      activeEvents,
      totalEvents,
      recentRegistrations,
    ] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { paymentStatus: "PENDING" } }),
      prisma.registration.count({ where: { paymentStatus: "APPROVED" } }),
      prisma.registration.count({ where: { paymentStatus: "REJECTED" } }),
      prisma.event.count({ where: { isPublished: true, isRegistrationOpen: true } }),
      prisma.event.count(),
      prisma.registration.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { event: { select: { name: true } } },
      }),
    ]);

    return {
      totalRegistrations,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      activeEvents,
      totalEvents,
      recentRegistrations,
    };
  } catch (error) {
    console.warn("⚠️ [Prisma] Database is not reachable. Using fallback dashboard data.");
    return {
      totalRegistrations: 0,
      pendingPayments: 0,
      approvedPayments: 0,
      rejectedPayments: 0,
      activeEvents: 0,
      totalEvents: 0,
      recentRegistrations: [],
    };
  }
}

const paymentStatusStyles: Record<string, string> = {
  PENDING:
    "bg-amber-500/10 text-amber-400 border-amber-500/30",
  APPROVED:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  REJECTED:
    "bg-red-500/10 text-red-400 border-red-500/30",
};

const registrationStatusStyles: Record<string, string> = {
  SUBMITTED:
    "bg-blue-500/10 text-blue-400 border-blue-500/30",
  PENDING_VERIFICATION:
    "bg-amber-500/10 text-amber-400 border-amber-500/30",
  APPROVED:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  REJECTED:
    "bg-red-500/10 text-red-400 border-red-500/30",
  CLOSED:
    "bg-gray-500/10 text-gray-400 border-gray-500/30",
  EXPIRED:
    "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const statCards = [
    {
      title: "Total Registrations",
      value: data.totalRegistrations,
      icon: Users,
      gradient: "from-indigo-600 to-indigo-800",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-300",
    },
    {
      title: "Pending Payments",
      value: data.pendingPayments,
      icon: Clock,
      gradient: "from-amber-600 to-amber-800",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-300",
    },
    {
      title: "Approved",
      value: data.approvedPayments,
      icon: CheckCircle,
      gradient: "from-emerald-600 to-emerald-800",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-300",
    },
    {
      title: "Active Events",
      value: data.activeEvents,
      icon: Calendar,
      gradient: "from-purple-600 to-purple-800",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-300",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-gray-400">
          Welcome back! Here&apos;s what&apos;s happening with your events.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg`}
          >
            {/* Decorative circle */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5" />
            <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-white/5" />

            <div className="relative">
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <p className="text-sm font-medium text-white/70">{card.title}</p>
              <p className="mt-1 text-3xl font-bold text-white">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <p className="text-sm text-gray-400">Total Events</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {data.totalEvents}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <p className="text-sm text-gray-400">Rejected Payments</p>
          <p className="mt-1 text-2xl font-bold text-red-400">
            {data.rejectedPayments}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <p className="text-sm text-gray-400">Total Registrations</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {data.totalRegistrations}
          </p>
        </div>
      </div>

      {/* Recent registrations */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Recent Registrations
            </h2>
            <p className="text-sm text-gray-400">
              Last 5 registrations across all events
            </p>
          </div>
          <Link
            href="/admin/registrations"
            className="flex items-center gap-1 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {data.recentRegistrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 h-10 w-10 text-gray-600" />
            <p className="text-gray-400">No registrations yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Registrations will appear here once participants sign up.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3 font-medium">Participant</th>
                  <th className="px-6 py-3 font-medium">Event</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentRegistrations.map((reg) => (
                  <tr
                    key={reg.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {reg.participantName}
                        </p>
                        <p className="text-xs text-gray-500">{reg.email}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm text-gray-300">
                        {reg.event.name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          paymentStatusStyles[reg.paymentStatus] ??
                          "bg-gray-500/10 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {reg.paymentStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          registrationStatusStyles[reg.status] ??
                          "bg-gray-500/10 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {reg.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-300">
                          {formatDate(reg.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(reg.createdAt)}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/events"
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-indigo-500/30 hover:bg-indigo-500/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 transition-colors group-hover:bg-indigo-500/20">
              <Calendar className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Manage Events</p>
              <p className="text-xs text-gray-500">Create or edit events</p>
            </div>
          </Link>

          <Link
            href="/admin/registrations"
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-purple-500/30 hover:bg-purple-500/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
              <Eye className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                View Registrations
              </p>
              <p className="text-xs text-gray-500">Review submissions</p>
            </div>
          </Link>

          <Link
            href="/admin/payments"
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-amber-500/30 hover:bg-amber-500/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Verify Payments
              </p>
              <p className="text-xs text-gray-500">Approve or reject</p>
            </div>
          </Link>

          <Link
            href="/admin/export"
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
              <Download className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Export Data</p>
              <p className="text-xs text-gray-500">Download as CSV/Excel</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
