import { z } from "zod";

const teamMemberSchema = z.object({
  name: z.string().min(2, "Team member name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  collegeName: z.string().optional(),
  department: z.string().optional(),
  yearOrSemester: z.string().optional(),
  role: z.string().optional(),
});

export const registrationSchema = z.object({
  participantName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  collegeName: z.string().min(2, "College/University name is required"),
  department: z.string().optional(),
  yearOrSemester: z.string().optional(),
  teamName: z.string().optional(),
  teamMembers: z.array(teamMemberSchema).optional(),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
