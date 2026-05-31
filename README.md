<p align="center">
  <a href="https://github.com/aayamtechfest/AayamTechfest">
    <img src="https://github.com/aayamtechfest/AayamTechfest/raw/main/Aayam/public/LogoGIF.gif" alt="AAYAM Logo" width="128" height="128" style="border-radius: 50.5rem; border: 1px solid rgba(255,255,255,0.15);" />
  </a>
</p>

<h1 align="center">AAYAM Techfest</h1>

<p align="center">
  <strong>The Premier University Event Management & Real-Time Quiz Arena Platform</strong>
  <br />
  Developed & Maintained by <a href="https://github.com/mdwarishansari"><strong>@mdwarishansari</strong></a> 🧑‍💻
</p>

<p align="center">
  <a href="https://github.com/aayamtechfest/AayamTechfest">
    <img src="https://img.shields.io/github/stars/aayamtechfest/AayamTechfest?style=for-the-badge&logo=github&color=4F46E5" alt="GitHub Stars" />
  </a>
  <a href="https://aayam-techfest.vercel.app/">
    <img src="https://img.shields.io/badge/Main_Site-Live-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Main Site Live" />
  </a>
  <a href="https://aayam-quiz-arena.vercel.app/">
    <img src="https://img.shields.io/badge/Quiz_Arena-Live-4F46E5?style=for-the-badge&logo=vercel&logoColor=white" alt="Quiz Arena Live" />
  </a>
</p>

---

## 🌟 Introduction

This repository contains the complete code for **AAYAM**, a premium event, hackathon, and real-time competition management suite built for university campuses. The repository is organized as a monorepo containing two key platforms:

1. **AAYAM Events Management Portal (`/Aayam`)**: The main registration, scheduling, payment verification, and public website portal.
2. **AAYAM Quiz Arena (`/AayamQuizArena`)**: A real-time, interactive quiz tournament portal with admin lobby controls, live spectator screens, and a Socket.IO microservice.

---

## 📂 Monorepo Structure

```text
AayamTechfest (Repository Root)
├── Aayam/                      # Main Event & Registration Platform (Next.js 16)
│   ├── src/                    # Main portal source code
│   └── README.md               # Main platform-specific documentation
│
└── AayamQuizArena/             # Real-time Competition Suite
    ├── src/                    # Quiz Arena frontend and admin client (Next.js 16)
    ├── socket-server/          # Real-time WebSocket server (Socket.IO & Node.js)
    └── README.md               # Quiz Arena-specific documentation
```

---

## 🚀 Projects Overview

### 1. AAYAM Main Platform (`/Aayam`)
* **Live URL**: [https://aayam-techfest.vercel.app](https://aayam-techfest.vercel.app)
* **Description**: A comprehensive university event portal with automated payments, registrations, dynamic banners, and full admin tools for event coordinators to review payment screenshots and manage user queries.
* **Tech Stack**: Next.js 16 (App Router, Server Actions), Tailwind CSS v4, Prisma ORM, Supabase PostgreSQL, Cloudinary.

### 2. AAYAM Quiz Arena (`/AayamQuizArena`)
* **Live Frontend URL**: [https://aayam-quiz-arena.vercel.app](https://aayam-quiz-arena.vercel.app)
* **Live Socket Server**: [https://aayamquizarena-server.onrender.com](https://aayamquizarena-server.onrender.com)
* **Description**: A real-time quiz game engine featuring 3 standardized round types (Buzzer, Pass-to-next-team, MCQ/Simultaneous Answer) designed for university auditoriums. It features millisecond-accurate buzzer ranking queues, full session controllers for hosts, projector screen outputs, and participant game views.
* **Tech Stack**: Next.js 16 App Router, Socket.IO Client, Tailwind CSS v4, Node.js Socket.IO server, Prisma, Docker.

---

## 📦 Local Development Quick Start

To run the complete monorepo setup locally:

### 1. Database Configuration
Both platforms utilize Supabase PostgreSQL. Populate a PostgreSQL database, run migrations, and seed if necessary inside each respective project directory:
```bash
# Push database schemas
npx prisma db push
```

### 2. Run the Main Platform
```bash
cd Aayam
npm install
npm run dev
```
Accessible at `http://localhost:3000`.

### 3. Run the Quiz Arena (Next.js + Socket Server)
First, spin up the Socket.IO server:
```bash
cd AayamQuizArena/socket-server
npm install
npm start
```
Socket server starts on `http://localhost:3001`.

Then, launch the Quiz Arena Next.js client:
```bash
cd AayamQuizArena
npm install
npm run dev
```
Client starts on `http://localhost:3002`.

---

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
