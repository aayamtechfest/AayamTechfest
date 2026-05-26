import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  shortDescription: z.string().optional().nullable(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  rules: z.string().optional().nullable(),
  eligibility: z.string().optional().nullable(),
  format: z.string().optional().nullable(),
  participationType: z.enum(["SOLO", "TEAM", "BOTH"]).default("SOLO"),
  minTeamSize: z.coerce.number().min(1).default(1),
  maxTeamSize: z.coerce.number().min(1).default(1),
  prizeDetails: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  registrationFee: z.coerce.number().min(0).optional().nullable(),
  lastRegistrationDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === "string" && val.trim() === "") return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }),
  eventDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === "string" && val.trim() === "") return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }),
  problemSummary: z.string().optional().nullable(),
  problemStatement: z.string().optional().nullable(),
  problemReleaseTime: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === "string" && val.trim() === "") return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }),
  isPublished: z.boolean().default(false),
  isRegistrationOpen: z.boolean().default(true),
  isSubmissionOpen: z.boolean().default(false),
  sortOrder: z.coerce.number().default(0),
});

export type EventFormData = z.infer<typeof eventSchema>;
