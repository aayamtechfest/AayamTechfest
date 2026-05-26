const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { eventSchema } = require("../src/schemas/event.schema");

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

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const event = await prisma.event.findUnique({
    where: { id: "cmpjqvuqq0002hu60xf3lkwjo" },
  });

  if (!event) {
    console.error("Event not found!");
    return;
  }

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
