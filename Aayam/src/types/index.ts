import { Prisma } from "@prisma/client";

// Event with registration count
export type EventWithCount = Prisma.EventGetPayload<{
  include: { _count: { select: { registrations: true } } };
}>;

// Registration with event and team members
export type RegistrationWithDetails = Prisma.RegistrationGetPayload<{
  include: { event: true; teamMembers: true };
}>;

// Settings type
export type SiteSettings = Prisma.SettingsGetPayload<object>;

// Registration form data
export interface RegistrationFormData {
  participantName: string;
  email: string;
  phone: string;
  collegeName: string;
  department?: string;
  yearOrSemester?: string;
  teamName?: string;
  teamMembers?: {
    name: string;
    email?: string;
    phone?: string;
    collegeName?: string;
    department?: string;
    yearOrSemester?: string;
    role?: string;
  }[];
  paymentReference?: string;
  notes?: string;
  customFields?: Record<string, string>;
}

// Dashboard stats
export interface DashboardStats {
  totalRegistrations: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  activeEvents: number;
  totalEvents: number;
}

// Filter types for admin
export interface RegistrationFilters {
  eventId?: string;
  paymentStatus?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// Action response
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
