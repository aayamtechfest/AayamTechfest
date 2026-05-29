import { Server } from "socket.io";
import { createServer } from "http";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for dev simplicity
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// In-memory cache for active quiz session states to avoid heavy DB reads on ticks
interface RealtimeQuizStateCache {
  sessionId: string;
  status: "WAITING" | "ACTIVE" | "PAUSED" | "COMPLETED";
  currentRoundId: string | null;
  activeQuestionId: string | null;
  questionStartedAt: Date | null;
  questionEndsAt: Date | null;
  timerInterval: NodeJS.Timeout | null;
}

const activeSessions = new Map<string, RealtimeQuizStateCache>();

// Helper to compile and broadcast state to all participants in a room
async function broadcastState(sessionId: string) {
  try {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: { select: { name: true, mode: true } },
        rounds: {
          orderBy: { roundNumber: "asc" },
        },
        participants: {
          orderBy: { totalScore: "desc" },
          include: {
            registration: {
              select: { registrationId: true },
            },
          },
        },
        teams: {
          orderBy: { totalScore: "desc" },
        },
        buzzerEvents: {
          orderBy: { buzzedAt: "asc" },
          include: {
            participant: { select: { displayName: true } },
          },
        },
      },
    });

    if (!session) return;

    // Get current round type and details
    let activeQuestionDetails = null;
    const cache = activeSessions.get(sessionId);

    if (cache?.activeQuestionId) {
      const question = await prisma.quizQuestion.findUnique({
        where: { id: cache.activeQuestionId },
        include: {
          options: {
            select: { id: true, text: true }, // Hide isCorrect from standard participants
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (question) {
        activeQuestionDetails = {
          id: question.id,
          text: question.text,
          mediaUrl: question.mediaUrl,
          type: question.type,
          timeLimit: question.timeLimit || 30,
          points: question.points || 10,
          options: question.options,
        };
      }
    }

    const currentRound = session.rounds.find((r) => r.id === session.currentRoundId);

    const compiledState = {
      sessionId: session.id,
      sessionName: session.name,
      quizId: session.quizId,
      quizName: session.quiz.name,
      quizMode: session.quiz.mode,
      status: session.status,
      currentRoundId: session.currentRoundId,
      currentRoundNumber: currentRound?.roundNumber || null,
      currentRoundTitle: currentRound?.title || null,
      currentRoundType: currentRound?.type || null,
      activeQuestion: activeQuestionDetails,
      questionStartedAt: cache?.questionStartedAt?.toISOString() || null,
      questionEndsAt: cache?.questionEndsAt?.toISOString() || null,
      participants: session.participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        registrationId: p.registrationId,
        registrationNumber: p.registration.registrationId,
        teamId: p.teamId,
        teamName: null,
        isConnected: p.isConnected,
        score: p.totalScore,
      })),
      teams: session.teams.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        score: t.totalScore,
        members: session.participants.filter((p) => p.teamId === t.id).map((p) => p.id),
      })),
      buzzerQueue: session.buzzerEvents.map((b) => ({
        id: b.id,
        participantId: b.participantId,
        displayName: b.participant.displayName,
        buzzedAt: b.buzzedAt.toISOString(),
        rank: b.rank,
        status: b.status,
      })),
    };

    io.to(`session:${sessionId}`).emit("state-sync", compiledState);
  } catch (error) {
    console.error(`Error broadcasting state for session ${sessionId}:`, error);
  }
}

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // ─── LOBBY JOINING ─────────────────────────────────────────────────────────
  socket.on("join-session", async ({ sessionId, participantId }) => {
    socket.join(`session:${sessionId}`);
    
    if (participantId) {
      // Set connection status to active in DB
      await prisma.quizParticipant.update({
        where: { id: participantId },
        data: { isConnected: true },
      });
    }

    if (!activeSessions.has(sessionId)) {
      const session = await prisma.quizSession.findUnique({ where: { id: sessionId } });
      if (session) {
        activeSessions.set(sessionId, {
          sessionId,
          status: session.status,
          currentRoundId: session.currentRoundId,
          activeQuestionId: null,
          questionStartedAt: null,
          questionEndsAt: null,
          timerInterval: null,
        });
      }
    }

    broadcastState(sessionId);
  });

  socket.on("admin:join-session", ({ sessionId }) => {
    socket.join(`session:${sessionId}`);
    broadcastState(sessionId);
  });

  // ─── ADMIN FLOW CONTROLS ──────────────────────────────────────────────────
  socket.on("admin:start-session", async ({ sessionId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache) cache.status = "ACTIVE";
    broadcastState(sessionId);
  });

  socket.on("admin:pause-session", async ({ sessionId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache) cache.status = "PAUSED";
    broadcastState(sessionId);
  });

  socket.on("admin:resume-session", async ({ sessionId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache) cache.status = "ACTIVE";
    broadcastState(sessionId);
  });

  socket.on("admin:end-session", async ({ sessionId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache) {
      cache.status = "COMPLETED";
      if (cache.timerInterval) clearInterval(cache.timerInterval);
    }
    broadcastState(sessionId);
  });

  socket.on("admin:push-question", async ({ sessionId, questionId }) => {
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) return;

    const cache = activeSessions.get(sessionId);
    if (cache) {
      if (cache.timerInterval) clearInterval(cache.timerInterval);

      const duration = question.timeLimit || 30;
      const started = new Date();
      const ends = new Date(started.getTime() + duration * 1000);

      cache.activeQuestionId = questionId;
      cache.questionStartedAt = started;
      cache.questionEndsAt = ends;

      // Start tick interval to automatically clear when timer expires
      cache.timerInterval = setTimeout(() => {
        io.to(`session:${sessionId}`).emit("timer-expired", { questionId });
      }, duration * 1000);
    }

    broadcastState(sessionId);
  });

  socket.on("admin:reveal-answer", async ({ sessionId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache && cache.activeQuestionId) {
      const correctOption = await prisma.quizQuestionOption.findFirst({
        where: { questionId: cache.activeQuestionId, isCorrect: true },
      });
      
      io.to(`session:${sessionId}`).emit("reveal-answer", {
        questionId: cache.activeQuestionId,
        correctOptionId: correctOption?.id || null,
      });
    }
  });

  socket.on("admin:trigger-score-sync", ({ sessionId }) => {
    broadcastState(sessionId);
  });

  // ─── PLAYER CONTROLS ──────────────────────────────────────────────────────
  socket.on("submit-answer", async ({ sessionId, participantId, questionId, selectedOptionId, textAnswer }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (!cache || cache.activeQuestionId !== questionId) return;

      // Check if time has expired
      if (cache.questionEndsAt && new Date() > cache.questionEndsAt) {
        socket.emit("answer-feedback", { success: false, error: "Time expired" });
        return;
      }

      // Check if answer already exists
      const existing = await prisma.quizAnswer.findFirst({
        where: { sessionId, participantId, questionId },
      });

      if (existing) {
        socket.emit("answer-feedback", { success: false, error: "Answer already submitted" });
        return;
      }

      const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
        include: { round: true },
      });

      if (!question) return;

      let isCorrect = false;
      let pointsAwarded = 0;
      const basePoints = question.points || question.round?.pointsPerQuestion || 10;

      if (selectedOptionId) {
        const option = await prisma.quizQuestionOption.findUnique({
          where: { id: selectedOptionId },
        });
        isCorrect = option?.isCorrect || false;
      } else if (textAnswer) {
        const correctOpt = await prisma.quizQuestionOption.findFirst({
          where: { questionId, isCorrect: true },
        });
        isCorrect = correctOpt?.text.trim().toLowerCase() === textAnswer.trim().toLowerCase();
      }

      if (isCorrect) {
        pointsAwarded = basePoints;
      }

      await prisma.$transaction(async (tx) => {
        // Save answer
        await tx.quizAnswer.create({
          data: {
            sessionId,
            roundId: question.roundId!,
            questionId,
            participantId,
            selectedOptionId,
            textAnswer,
            isCorrect,
            pointsAwarded,
          },
        });

        // Add points logs
        if (pointsAwarded > 0) {
          await tx.quizScore.create({
            data: {
              sessionId,
              participantId,
              roundId: question.roundId,
              points: pointsAwarded,
            },
          });

          // Aggregate points
          const p = await tx.quizParticipant.update({
            where: { id: participantId },
            data: { totalScore: { increment: pointsAwarded } },
            select: { teamId: true },
          });

          if (p.teamId) {
            await tx.quizTeam.update({
              where: { id: p.teamId },
              data: { totalScore: { increment: pointsAwarded } },
            });
          }
        }
      });

      socket.emit("answer-feedback", { success: true, isCorrect });
      broadcastState(sessionId);
    } catch (err) {
      console.error("Submit answer error:", err);
    }
  });

  // ─── BUZZER EVENT HANDLERS ────────────────────────────────────────────────
  socket.on("buzzer-pressed", async ({ sessionId, participantId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (!cache || !cache.activeQuestionId) return;

      const count = await prisma.quizBuzzerEvent.count({
        where: { sessionId, questionId: cache.activeQuestionId },
      });

      // Save buzzer press with rank (server arrival timestamp)
      const buzzerEvent = await prisma.quizBuzzerEvent.create({
        data: {
          sessionId,
          roundId: cache.currentRoundId!,
          questionId: cache.activeQuestionId,
          participantId,
          rank: count + 1,
          status: "PENDING",
        },
        include: {
          participant: { select: { displayName: true } },
        },
      });

      // Notify room about buzzer hit
      io.to(`session:${sessionId}`).emit("buzzer-hit", {
        participantId,
        displayName: buzzerEvent.participant.displayName,
        rank: buzzerEvent.rank,
      });

      broadcastState(sessionId);
    } catch (err) {
      console.error("Buzzer hit error:", err);
    }
  });

  socket.on("admin:reset-buzzer", async ({ sessionId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache && cache.activeQuestionId) {
      await prisma.quizBuzzerEvent.deleteMany({
        where: { sessionId, questionId: cache.activeQuestionId },
      });
      io.to(`session:${sessionId}`).emit("buzzer-reset");
      broadcastState(sessionId);
    }
  });

  socket.on("admin:resolve-buzzer", async ({ sessionId, buzzerEventId, status }) => {
    try {
      const buzzerEvent = await prisma.quizBuzzerEvent.update({
        where: { id: buzzerEventId },
        data: { status },
        include: { question: true },
      });

      if (status === "ACCEPTED") {
        const points = buzzerEvent.question.points || 10;
        
        await prisma.$transaction(async (tx) => {
          await tx.quizScore.create({
            data: {
              sessionId,
              participantId: buzzerEvent.participantId,
              roundId: buzzerEvent.roundId,
              points,
            },
          });

          const p = await tx.quizParticipant.update({
            where: { id: buzzerEvent.participantId },
            data: { totalScore: { increment: points } },
            select: { teamId: true },
          });

          if (p.teamId) {
            await tx.quizTeam.update({
              where: { id: p.teamId },
              data: { totalScore: { increment: points } },
            });
          }
        });
      }

      broadcastState(sessionId);
    } catch (err) {
      console.error("Resolve buzzer error:", err);
    }
  });

  // ─── CLEANUP ON DISCONNECT ────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO Server running on port ${PORT}`);
});
