const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { serializePrisma } = require("../src/lib/utils");

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

  console.log("Before Serialization:");
  console.log("registrationFee type:", typeof event.registrationFee);
  console.log("registrationFee constructor name:", event.registrationFee?.constructor?.name);
  console.log("is Decimal?", event.registrationFee && typeof event.registrationFee === "object" && "toNumber" in event.registrationFee);

  const serialized = serializePrisma(event);
  console.log("\nAfter Serialization:");
  console.log("registrationFee type:", typeof serialized.registrationFee);
  console.log("registrationFee value:", serialized.registrationFee);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
