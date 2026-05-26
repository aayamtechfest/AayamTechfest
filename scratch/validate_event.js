const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { z } = require("zod");

// Read .env manually
const envPath = "/home/md-warish-ansari/Desktop/Aayam/.env";
const envContent = fs.readFileSync(envPath, "utf8");
const dbUrlMatch = envContent.match(/^DATABASE_URL=["']?([^"'\n]+)["']?/m);
if (!dbUrlMatch) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}
const connectionString = dbUrlMatch[1];
process.env.DATABASE_URL = connectionString;

// Copy Schema definition from event.schema.ts
const eventSchema = z.object({
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
  sortOrder: z.coerce.number().default(0),
});

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const event = await prisma.event.findUnique({
    where: { id: "cmpjqvuqq0002hu60xf3lkwjo" },
  });

  if (!event) {
    console.error("Event not found in database!");
    return;
  }

  console.log("Raw Database Event:", event);

  // Map database types like Decimal to numbers for validation
  const serialized = {
    ...event,
    registrationFee: event.registrationFee ? Number(event.registrationFee) : 0,
  };

  const result = eventSchema.safeParse(serialized);
  if (result.success) {
    console.log("Validation Succeeded!");
  } else {
    console.log("Validation Failed! Errors:");
    console.log(JSON.stringify(result.error.format(), null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
