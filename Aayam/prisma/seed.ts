import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL must be set in .env");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  // ─── 1. Seed Admin ───
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✅ Admin already exists: ${adminEmail}`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "AAYAM Admin",
      },
    });
    console.log(`✅ Admin created: ${adminEmail}`);
  }

  // ─── 2. Seed Default Settings ───
  const existingSettings = await prisma.settings.findFirst();

  if (existingSettings) {
    await prisma.settings.update({
      where: { id: existingSettings.id },
      data: {
        contactEmail: process.env.SMTP_EMAIL || "aayamhackathon@gmail.com",
      },
    });
    console.log("✅ Settings updated with latest config");
  } else {
    await prisma.settings.create({
      data: {
        siteName: "AAYAM",
        eventTitle: "AAYAM - University Event & Hackathon Platform",
        tagline: "Innovate. Compete. Excel.",
        aboutContent: `<p>AAYAM is a premier university-level event and hackathon platform that brings together the brightest minds to compete in fast coding, quiz, UI/UX design, and problem-solving challenges.</p>
<p>Our mission is to foster innovation, collaboration, and technical excellence among students. Whether you're a beginner or an experienced developer, AAYAM offers competitions for every skill level.</p>
<p>Join us to showcase your talent, learn from peers, win prizes, and build lasting connections in the tech community.</p>`,
        contactEmail: process.env.SMTP_EMAIL || "aayamhackathon@gmail.com",
        contactPhone: "+91 8888888888",
        footerText: "© 2026 AAYAM. All rights reserved.",
        paymentInstructions: "Scan the QR code below to make the payment. After payment, enter the UTR/Reference number and upload a screenshot of the payment confirmation.",
        themeColors: {
          primary: "#4F46E5",
          accent: "#F59E0B",
          background: "#0f0f23",
        },
        socialLinks: {
          instagram: "https://instagram.com/aayam",
          github: "https://github.com/mdwarishansari/Aayam",
          youtube: "https://www.youtube.com/@AayamTechFest",
        },
      },
    });
    console.log("✅ Default settings created");
  }

  // ─── 3. Seed Sample Events ───
  const eventCount = await prisma.event.count();

  if (eventCount > 0) {
    console.log(`✅ Events already exist (${eventCount} found)`);
  } else {
    const events = [
      {
        slug: "fast-coding",
        name: "Fast Coding Challenge",
        shortDescription: "Race against time to solve coding problems",
        description: "Put your coding skills to the test in this high-speed programming competition. Solve algorithmic challenges under time pressure and compete for the top spot on the leaderboard.",
        rules: "• Individual participation only\n• 3 coding problems in 90 minutes\n• Languages allowed: C, C++, Java, Python\n• No external resources or AI tools\n• Plagiarism leads to disqualification",
        eligibility: "Open to all undergraduate and postgraduate students",
        format: "Offline",
        participationType: "SOLO" as const,
        minTeamSize: 1,
        maxTeamSize: 1,
        prizeDetails: "🥇 1st Place: ₹5,000\n🥈 2nd Place: ₹3,000\n🥉 3rd Place: ₹2,000",
        venue: "Computer Lab, Block A",
        registrationFee: 100,
        isPublished: true,
        isRegistrationOpen: true,
        sortOrder: 1,
      },
      {
        slug: "quiz",
        name: "Tech Quiz Championship",
        shortDescription: "Test your knowledge across tech domains",
        description: "A thrilling quiz competition covering programming, computer science fundamentals, current tech trends, and general knowledge. Teams compete in multiple rounds with increasing difficulty.",
        rules: "• Teams of 2 members\n• 3 rounds: MCQ, Rapid Fire, Buzzer Round\n• No mobile phones during the quiz\n• Judges' decision is final",
        eligibility: "Open to all undergraduate and postgraduate students",
        format: "Offline",
        participationType: "TEAM" as const,
        minTeamSize: 2,
        maxTeamSize: 2,
        prizeDetails: "🥇 1st Place: ₹4,000\n🥈 2nd Place: ₹2,500\n🥉 3rd Place: ₹1,500",
        venue: "Seminar Hall, Block B",
        registrationFee: 80,
        isPublished: true,
        isRegistrationOpen: true,
        sortOrder: 2,
      },
      {
        slug: "ui-ux",
        name: "UI/UX Design Sprint",
        shortDescription: "Design stunning user interfaces and experiences",
        description: "Showcase your design thinking skills in this creative competition. You'll receive a problem statement and have to design a complete UI/UX solution using any design tool of your choice.",
        rules: "• Individual or team (max 2)\n• Design tools: Figma, Adobe XD, or Sketch\n• Problem statement revealed at the start\n• 4 hours to complete the design\n• Present your design to the judges",
        eligibility: "Open to all students with basic design knowledge",
        format: "Hybrid",
        participationType: "BOTH" as const,
        minTeamSize: 1,
        maxTeamSize: 2,
        prizeDetails: "🥇 1st Place: ₹5,000\n🥈 2nd Place: ₹3,000\n🥉 3rd Place: ₹2,000",
        venue: "Design Lab, Block C",
        registrationFee: 150,
        isPublished: true,
        isRegistrationOpen: true,
        sortOrder: 3,
      },
      {
        slug: "hackathon",
        name: "24-Hour Hackathon",
        shortDescription: "Build innovative solutions in 24 hours",
        description: "The flagship event of AAYAM! Form a team, pick a problem statement, and build a working prototype in 24 hours. This is where ideas become reality. Food and refreshments provided.",
        rules: "• Teams of 3-5 members\n• Problem statements released 30 min after start\n• Any tech stack allowed\n• Must have a working demo at the end\n• Code must be original (no pre-built projects)\n• Participants must stay in the venue",
        eligibility: "Open to all undergraduate and postgraduate students",
        format: "Offline",
        participationType: "TEAM" as const,
        minTeamSize: 3,
        maxTeamSize: 5,
        prizeDetails: "🥇 1st Place: ₹15,000\n🥈 2nd Place: ₹10,000\n🥉 3rd Place: ₹5,000\n⭐ Best Innovation: ₹3,000",
        venue: "Innovation Center, Main Building",
        registrationFee: 250,
        isPublished: true,
        isRegistrationOpen: true,
        sortOrder: 4,
        problemSummary: "Build solutions for real-world problems in Education, Healthcare, or Sustainability domains.",
      },
    ];

    for (const event of events) {
      await prisma.event.create({ data: event });
    }
    console.log(`✅ ${events.length} sample events created`);
  }

  // ─── 4. Seed Email Templates ───
  const templateCount = await prisma.emailTemplate.count();

  if (templateCount > 0) {
    console.log(`✅ Email templates already exist (${templateCount} found)`);
  } else {
    await prisma.emailTemplate.createMany({
      data: [
        {
          name: "registration_success",
          subject: "Registration Confirmed - {{eventName}} | AAYAM",
          body: "Your registration for {{eventName}} has been submitted successfully. Registration ID: {{registrationId}}",
        },
        {
          name: "payment_approved",
          subject: "Payment Approved - {{eventName}} | AAYAM",
          body: "Your payment for {{eventName}} has been verified and approved. Registration ID: {{registrationId}}",
        },
        {
          name: "payment_rejected",
          subject: "Payment Issue - {{eventName}} | AAYAM",
          body: "Your payment for {{eventName}} could not be verified. Registration ID: {{registrationId}}. Please contact the organizers.",
        },
      ],
    });
    console.log("✅ Email templates created");
  }

  // ─── 5. Seed About Cards ───
  const aboutCardCount = await prisma.aboutCard.count();
  if (aboutCardCount > 0) {
    console.log(`✅ About cards already exist (${aboutCardCount} found)`);
  } else {
    await prisma.aboutCard.createMany({
      data: [
        {
          iconName: "Target",
          title: "Our Mission",
          description: "To foster technical innovation, creative thinking, and competitive spirit among students through hands-on challenges and live events.",
          sortOrder: 1,
        },
        {
          iconName: "Compass",
          title: "Our Vision",
          description: "To build a vibrant and collaborative tech community where learning meets excitement and technical skills translate to real-world achievements.",
          sortOrder: 2,
        },
        {
          iconName: "Award",
          title: "Core Values",
          description: "Technical excellence, fair competition, student empowerment, and building real-time event technologies that push the boundaries of fun.",
          sortOrder: 3,
        },
      ],
    });
    console.log("✅ Default about cards seeded");
  }

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
