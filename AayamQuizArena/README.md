# AAYAM Quiz Arena

**Real-Time Quiz Tournament Engine & Live Lobby Management**
<br />
Developed by <a href="https://github.com/mdwarishansari"><strong>@mdwarishansari</strong></a> 🧑‍💻

* **Live Frontend**: [https://aayam-quiz-arena.vercel.app](https://aayam-quiz-arena.vercel.app)
* **Live Socket Server**: [https://aayamquizarena-server.onrender.com](https://aayamquizarena-server.onrender.com)

---

## 🌟 Introduction

**AAYAM Quiz Arena** is a real-time event competition manager built specifically for live auditorium tournaments. Designed to prevent coordinates chaos and keep audiences engaged, it provides hosts with absolute lobby control, supports real-time score calculation, and integrates millisecond-level buzzer synchronization.

---

## 🚀 Key Features

### 🎮 Three Standardized Competition Rounds
1. **Buzzer Round:** Lock and unlock buzzers. Displays a real-time queue of players who buzzed with millisecond precision to find the fastest responder.
2. **Simultaneous Answer Round:** Hosts open a 20-second timer. All participants submit responses simultaneously, and the host reveals correct answers and scores.
3. **Pass Round:** Questions are directed to specific teams. Correct responses score points; incorrect ones allow passing to the next team in line.

### 🛡️ Live Sessions & Control Panel
- Spawn new live lobbies from published templates.
- Complete session management: push questions, trigger timers, accept/reject buzzers, pass questions, and evaluate scores live.
- Central **Projector Display** layout displaying active questions, connection instructions, live scores, and visual alerts for buzzer hits.
- Dynamic question importer supporting CSV/JSON bulk formats.

---

## 🛠️ Tech Stack

- **Frontend Client:** Next.js 16 (App Router, Server Actions)
- **Realtime Server:** Node.js Socket.IO server (compiles TypeScript to JS)
- **Database Access:** Prisma ORM with pg Pool adapter
- **Database Engine:** Supabase PostgreSQL
- **Realtime Transport:** WebSockets (Socket.IO client & server)

---

## 📦 Getting Started

### 1. Project Directory Structure
```text
AayamQuizArena/
├── socket-server/          # Real-time WebSocket server
│   ├── Dockerfile          # Production Docker runner config
│   ├── index.ts            # Server entry point and Socket handlers
│   └── tsconfig.json
├── prisma/                 # Database schema definitions
├── src/                    # Next.js 16 frontend and admin portal
└── DEPLOYMENT.md           # Production deployment checklist
```

### 2. Environment Variables
Create a `.env` file inside the `AayamQuizArena` root folder:
```env
DATABASE_URL="postgresql://postgres:[password]@db.supabase.co:5432/postgres"
SESSION_SECRET="your-32-char-session-secret"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3002"
```

### 3. Running the App Locally
First, start the Socket.IO server:
```bash
cd socket-server
npm install
npm start
```
Starts on `http://localhost:3001`.

Then, launch the Next.js frontend in the root directory:
```bash
cd ..
npm install
npm run dev
```
Starts on `http://localhost:3002`.

---

## 🐳 Production Deployment (Render Docker)

The Socket.IO server is fully containerized. To build and run using Docker:
```bash
docker build -f socket-server/Dockerfile -t aayam-quiz-socket .
docker run -p 3001:3001 --env-file .env aayam-quiz-socket
```

For complete production deploy setups on **Vercel** and **Render**, check out the [DEPLOYMENT.md](DEPLOYMENT.md) guide.
