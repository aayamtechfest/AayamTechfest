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
  // Set release time to 2 hours in the future
  const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  console.log("Setting problemReleaseTime to future:", futureTime);

  await prisma.event.update({
    where: { id: "cmpjqvuqq0002hu60xf3lkwjo" },
    data: {
      problemReleaseTime: futureTime,
      problemStatement: "This is a secret challenge statement!",
    },
  });

  const event = await prisma.event.findUnique({
    where: { id: "cmpjqvuqq0002hu60xf3lkwjo" },
  });

  const serialized = serializePrisma(event);
  const now = new Date();

  console.log("\nComparison check on Server:");
  console.log("now:", now);
  console.log("problemReleaseTime (raw):", event.problemReleaseTime);
  console.log("problemReleaseTime (serialized):", serialized.problemReleaseTime);
  console.log("now >= releaseTime?", now >= new Date(serialized.problemReleaseTime));
  console.log("now < releaseTime?", now < new Date(serialized.problemReleaseTime));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
