# AAYAM Quiz Arena — Production Deployment Guide

This guide describes how to deploy the frontend (Next.js 16) to Vercel and the realtime server (Socket.IO) to Render.

---

## 1. Database Setup (Supabase PostgreSQL)

Both applications connect to the same Supabase database instance.

### Build & Setup Steps
1. Before deploying, ensure the schema changes are pushed to your database instance:
   ```bash
   npx prisma db push
   ```
2. Generate the Prisma Client to ensure local types are up-to-date:
   ```bash
   npx prisma generate
   ```

---

## 2. Realtime Server Deployment (Render - Docker Service)

The Socket.IO server is deployed to Render using a Docker container.

### Render Configuration
* **Git Repository URL**: `https://github.com/aayamtechfest/AayamTechfest.git`
* **Service Type**: Web Service
* **Runtime**: `Docker`
* **Root Directory**: `AayamQuizArena` (This is critical because the Next.js app and socket server are in a subdirectory. Setting this ensures the Docker build context is set to `AayamQuizArena` which contains the database schema and packages)
* **Dockerfile Path**: `socket-server/Dockerfile`
* **Instance Type**: Any container tier (e.g. Free or Starter)
* **Auto-Deploy**: Enabled (Optional)

### Environment Variables
Set the following environment variables in the Render Service Settings:

| Environment Variable | Description | Example / Default |
|----------------------|-------------|-------------------|
| `DATABASE_URL` | The PostgreSQL connection string to your Supabase instance. | `postgresql://postgres:[password]@db.supabase.co:5432/postgres` |
| `PORT` | The port on which the HTTP and Socket.IO server listens. Render sets this dynamically, but defaults to `3001` if unset. | `3001` |

### Health Check
Render will perform a HTTP check to verify the health of the container:
* **Health Check Path**: `/health` or `/`
* **Response**: `200 OK` JSON containing `{"status":"ok", "timestamp": "..."}`

---

## 3. Frontend Deployment (Vercel)

The Next.js 16 application is deployed directly to Vercel.

### Vercel Configuration
* **Git Repository URL**: `https://github.com/aayamtechfest/AayamTechfest.git`
* **Framework Preset**: `Next.js`
* **Root Directory**: `AayamQuizArena` (This is critical because the Next.js frontend is located in the `AayamQuizArena` subdirectory)
* **Build Command**: `next build` (Vercel will run `prisma generate` automatically via the `postinstall` script in `package.json`)
* **Output Directory**: `.next`

### Environment Variables
Set the following environment variables in the Vercel Project Settings:

| Environment Variable | Description | Required / Optional | Example Value |
|----------------------|-------------|---------------------|---------------|
| `DATABASE_URL` | Connection string to the Supabase PostgreSQL database. | **Required** | `postgresql://postgres:[password]@db.supabase.co:5432/postgres` |
| `NEXT_PUBLIC_SOCKET_URL` | The public WebSocket server URL running on Render. | **Required** | `https://aayam-quiz-socket.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | The canonical domain of the Next.js site (used on projector displays). | **Optional** | `https://aayam-quiz-arena.vercel.app` (Defaults to `http://localhost:3002` if empty) |
| `SESSION_SECRET` | A secure, 32-character random string used by `iron-session` to sign cookies. | **Required** | `a-long-random-string-at-least-32-chars-long` |

---

## 4. Troubleshooting & Production Verification

Once deployed, verify the setup by running these manual validation steps:

1. **Health Check**: Open `<your-render-url>/health` in a browser. It should return a JSON response with status "ok".
2. **Lobby Connection**: Launch a Live Lobby from the admin portal, open the projector screen, and ensure teams can successfully join and that their connections show up in real-time.
3. **Session Cookies**: Verify that administrative pages load correctly and keep you logged in. If you are redirected immediately to the login page, check your `SESSION_SECRET`.
