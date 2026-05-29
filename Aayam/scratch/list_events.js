const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

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
  const events = await prisma.event.findMany();
  console.log("All Events:");
  events.forEach((e) => {
    console.log(`- ${e.name} (${e.slug}):`);
    console.log(`  problemReleaseTime: ${e.problemReleaseTime}`);
    console.log(`  problemStatement length: ${e.problemStatement ? e.problemStatement.length : 0}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
