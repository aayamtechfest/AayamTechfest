<p align="center">
  <a href="https://github.com/aayamtechfest/aayam-techfest-platform">
    <img src="https://github.com/aayamtechfest/aayam-techfest-platform/raw/main/public/LogoGIF.gif" alt="AAYAM Logo" width="128" height="128" style="border-radius: 50.5rem; border: 1px solid rgba(255,255,255,0.15);" />
  </a>
</p>

<h1 align="center">AAYAM</h1>

<p align="center">
  <strong>The Premier University Event &amp; Hackathon Management Platform</strong>
  <br />
  <a href="https://aayam-techfest.vercel.app/"><strong>Live Site 🚀</strong></a>
</p>

<p align="center">
  <a href="https://github.com/aayamtechfest/aayam-techfest-platform">
    <img src="https://img.shields.io/github/stars/aayamtechfest/aayam-techfest-platform?style=for-the-badge&logo=github&color=4F46E5" alt="GitHub Stars" />
  </a>
  <a href="https://aayam-techfest.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs&color=000" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&color=2D3748" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwindcss&color=38B2AC" alt="Tailwind CSS" />
</p>

---

## 🌟 Introduction

**AAYAM** is a state-of-the-art event and hackathon management platform tailored for university campuses. Designed with rich aesthetics, smooth animations, glassmorphism elements, and robust backend systems, AAYAM makes organizing and participating in university events effortless, engaging, and modern.

---

## 🚀 Key Features

### 💻 Public-Facing Site
- **Dynamic Splash Loading Screen:** A polished introductory experience featuring the circular brand logo.
- **Live Database Statistics:** Real-time metrics tracking total participants, active events, and represented colleges dynamically calculated from database records.
- **Events & Registration Portal:** Responsive listings with customized loading shimmer states, support for both Solo and Team registrations, and validation enforcing team name submissions for group categories.
- **IST Standardized Challenge Statement Banners:** Dynamic countdown and release banners utilizing Indian Standard Time (IST) indicating challenge/problem statement releases.
- **SEO Optimized:** Fully configured SEO headers, OpenGraph profiles, robots.ts crawler instructions, dynamic sitemap.ts generating sitemaps, and custom meta icon assets.

### 🛡️ Admin Dashboard
- **Live Overview Panel:** Real-time stats panel reflecting registrations, payments, and events.
- **Robust Event Management:** Create, read, update, and delete events. Safeguards prevent deleting events that already have active registrations.
- **Interactive Registration & Payment Verification:** Review submissions, verify payment receipts, reject invalid entries with required note explanations, and delete registrations with full Supabase and Cloudinary receipt/image cleanup.
- **Unified Message Inbox:** Receive contact form queries with options to toggle read/unread status and delete.
- **Global Settings Form:** Dynamically manage platform meta settings and social presence links (including GitHub and Instagram).
- **Reset & Seed System:** Easily reset database states and seed standard templates/events for demonstration.
- **Security Control Panel**: Modify administrative passwords securely from the settings interface.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Server Actions, React 19)
- **Database ORM:** Prisma ORM
- **Database Engine:** PostgreSQL (Supabase / local PG instance)
- **File & Media Storage:** Cloudinary SDK (for event banners and payment screenshot uploads)
- **Styling:** Tailwind CSS v4 & Custom Glassmorphic CSS variables
- **Icons:** Lucide React Icons

---

## 📦 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
- Node.js (v18.x or later)
- PostgreSQL database
- Cloudinary Account (for hosting receipts and event banner images)

### 2. Installation
Clone the repository:
```bash
git clone https://github.com/mdwarishansari/Aayam.git
cd Aayam
```

Install the dependencies:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and populate the variables:
```env
# ─── Database (Supabase PostgreSQL Connection Pooling) ───
# Transaction pooler string pointing to port 6543 (used by Prisma at runtime)
DATABASE_URL="postgresql://postgres.[username]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session mode connection string pointing directly to port 5432 (used by Prisma for migrations)
DIRECT_URL="postgresql://postgres.[username]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# ─── Cloudinary SDK (Media Storage) ───
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# ─── Email Configuration (Nodemailer + Gmail SMTP) ───
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_EMAIL="aayamhackathon@gmail.com"
SMTP_PASSWORD="your_google_app_password_here"
SMTP_FROM_NAME="AAYAM Hackathon Team"

# ─── Admin Seed Account Default Credentials ───
ADMIN_EMAIL="admin@aayam.tech"
ADMIN_PASSWORD="your-strong-admin-password"

# ─── Session Configuration (iron-session) ───
# Must be a 32-character string
SESSION_SECRET="replace-with-a-32-character-session-secret"

# ─── Canonical Site URLs ───
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 4. Database Setup & Seeding (Local Development)
Deploy database migrations:
```bash
npx prisma db push
```

Seed the default admin account, email templates, and sample events:
```bash
npm run seed
```

### 5. Running the Application
Run the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🔺 Production Deployment (Vercel + Supabase Serverless)

The project is fully optimized for Vercel serverless deployment using a pooled database connection architecture with Prisma and Supabase.

### Quick Setup Steps
1. **GitHub Repository**: Push your project repository to GitHub.
2. **Import to Vercel**: Connect your GitHub repository to Vercel.
3. **Environment Variables**: Configure the environment variables (such as `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, etc.) in Vercel project settings based on the `.env.example` template.
4. **Build & Development Settings**:
   - Framework Preset: `Next.js`
   - Build Command: `npm run vercel-build`
5. **Deploy**: Click Deploy. Vercel will automatically compile the codebase, run migrations, and serve the application.

For detailed, step-by-step guidance on setting up connection poolers, Resend verified domains, and Cloudinary storage, please refer to the complete [Vercel Production Deployment Guide](file:///home/md-warish-ansari/.gemini/antigravity/brain/6fa9ab1f-f42d-44c3-8a4a-7920e4edf12d/vercel_deployment_guide.md).

---

## 🐳 Production Deployment (Docker Compose Fallback)

If containerized local or self-hosted deployment is preferred, a production-ready `Dockerfile` and `docker-compose.yml` are also provided.

### Prerequisites
- Docker and Docker Compose installed.
- A fully populated `.env` file in the project root.

### Deploying the Stack
Simply run the following command in the root directory:
```bash
docker compose up -d --build
```

### What Happens Automatically?
1. Docker Compose builds the Next.js image using the production `Dockerfile`.
2. The PostgreSQL database service is launched. A container health check ensures it is accepting connections.
3. Once the database is online, the application container:
   - Synchronizes database schemas (`prisma db push`).
   - Runs database seeds (`prisma db seed`) to populate email templates, admin credentials, and default settings.
   - Starts the optimized production Next.js server on port `3000`.

To stop the deployment stack:
```bash
docker compose down
```

---

## 🔒 Security & Validations
- Backend validation ensures that payment registration rejections are accompanied by a descriptive message.
- Multi-step registration forms enforce appropriate team name requirements dynamically based on event configuration.
- Cascading deletion rules keep the database cleanly synchronized with remote media assets.

---

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
