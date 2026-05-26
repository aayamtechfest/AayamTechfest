import { z } from "zod";

export const settingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  eventTitle: z.string().min(1, "Event title is required"),
  tagline: z.string().optional().or(z.literal("")),
  aboutContent: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  footerText: z.string().optional().or(z.literal("")),
  paymentInstructions: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  headerLogoUrl: z.string().optional().or(z.literal("")),
  footerLogoUrl: z.string().optional().or(z.literal("")),
  faviconUrl: z.string().optional().or(z.literal("")),
  heroBannerUrl: z.string().optional().or(z.literal("")),
  paymentQrCodeUrl: z.string().optional().or(z.literal("")),
  contactAddress: z.string().optional().or(z.literal("")),
  countdownDate: z.string().optional().or(z.literal("")),
  statParticipants: z.string().optional().or(z.literal("")),
  statEvents: z.string().optional().or(z.literal("")),
  statColleges: z.string().optional().or(z.literal("")),
  instagramUrl: z.string().optional().or(z.literal("")),
  githubUrl: z.string().optional().or(z.literal("")),
  twitterUrl: z.string().optional().or(z.literal("")),
  linkedinUrl: z.string().optional().or(z.literal("")),
  youtubeUrl: z.string().optional().or(z.literal("")),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
