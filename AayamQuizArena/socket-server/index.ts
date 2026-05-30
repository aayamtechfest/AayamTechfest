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
const httpServer = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});
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
  buzzerOpen?: boolean;
  rapidFireState?: {
    activeTeamId: string | null;
    activeParticipantId: string | null;
    timeLeft: number;
    isRunning: boolean;
    questionIndex: number;
    timerInterval?: NodeJS.Timeout | null;
  };
  passRoundState?: {
    activeTeamId: string | null;
    activeParticipantId: string | null;
    passCount: number;
  };
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
      buzzerOpen: cache?.buzzerOpen || false,
      rapidFireState: cache?.rapidFireState ? {
        activeTeamId: cache.rapidFireState.activeTeamId,
        activeParticipantId: cache.rapidFireState.activeParticipantId,
        timeLeft: cache.rapidFireState.timeLeft,
        isRunning: cache.rapidFireState.isRunning,
        questionIndex: cache.rapidFireState.questionIndex,
      } : null,
      passRoundState: cache?.passRoundState ? {
        activeTeamId: cache.passRoundState.activeTeamId,
        activeParticipantId: cache.passRoundState.activeParticipantId,
        passCount: cache.passRoundState.passCount,
      } : null,
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
          buzzerOpen: false,
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
      if (cache.rapidFireState?.timerInterval) clearInterval(cache.rapidFireState.timerInterval);
    }
    broadcastState(sessionId);
  });

  socket.on("admin:start-round", async ({ sessionId, roundId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache) {
      cache.currentRoundId = roundId;
      cache.activeQuestionId = null;
      cache.buzzerOpen = false;

      // Reset timer
      if (cache.timerInterval) {
        clearInterval(cache.timerInterval);
        cache.timerInterval = null;
      }
      
      const round = await prisma.quizRound.findUnique({ where: { id: roundId } });
      if (round) {
        if (round.type === "RAPID_FIRE") {
          cache.rapidFireState = {
            activeTeamId: null,
            activeParticipantId: null,
            timeLeft: 60,
            isRunning: false,
            questionIndex: 0,
          };
        } else if (round.type === "PASS_ROUND") {
          cache.passRoundState = {
            activeTeamId: null,
            activeParticipantId: null,
            passCount: 0,
          };
        } else {
          cache.rapidFireState = undefined;
          cache.passRoundState = undefined;
        }
      }
    }
    broadcastState(sessionId);
  });

  socket.on("admin:end-round", async ({ sessionId, roundId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache) {
      cache.activeQuestionId = null;
      if (cache.timerInterval) {
        clearInterval(cache.timerInterval);
        cache.timerInterval = null;
      }
      if (cache.rapidFireState?.timerInterval) {
        clearInterval(cache.rapidFireState.timerInterval);
      }
      cache.rapidFireState = undefined;
      cache.passRoundState = undefined;
    }
    broadcastState(sessionId);
  });

  socket.on("admin:push-question", async ({ sessionId, questionId }) => {
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { round: true },
    });

    if (!question) return;

    const cache = activeSessions.get(sessionId);
    if (cache) {
      if (cache.timerInterval) {
        clearInterval(cache.timerInterval);
        cache.timerInterval = null;
      }

      const duration = question.timeLimit || 30;
      const started = new Date();
      const ends = new Date(started.getTime() + duration * 1000);

      cache.activeQuestionId = questionId;
      cache.questionStartedAt = started;
      cache.questionEndsAt = ends;
      
      // Auto-set buzzer round defaults
      cache.buzzerOpen = false;

      // Start tick interval to automatically clear when timer expires (only for MCQ/Simultaneous Answer)
      if (question.round?.type === "MCQ") {
        cache.timerInterval = setTimeout(() => {
          io.to(`session:${sessionId}`).emit("timer-expired", { questionId });
        }, duration * 1000);
      }
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
  socket.on("admin:open-buzzer", ({ sessionId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache) {
      cache.buzzerOpen = true;
      io.to(`session:${sessionId}`).emit("buzzer-reset"); // Reset rank animations
      broadcastState(sessionId);
    }
  });

  socket.on("admin:close-buzzer", ({ sessionId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache) {
      cache.buzzerOpen = false;
      broadcastState(sessionId);
    }
  });

  socket.on("buzzer-pressed", async ({ sessionId, participantId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (!cache || !cache.activeQuestionId || !cache.buzzerOpen) return;

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
      cache.buzzerOpen = false; // Lock buzzers again on reset
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

      // Once resolved, close/lock buzzers
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.buzzerOpen = false;
      }

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

  // ─── RAPID FIRE HANDLERS ──────────────────────────────────────────────────
  socket.on("admin:set-rapid-fire-team", ({ sessionId, teamId, participantId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache) {
      if (cache.rapidFireState?.timerInterval) {
        clearInterval(cache.rapidFireState.timerInterval);
      }
      cache.rapidFireState = {
        activeTeamId: teamId || null,
        activeParticipantId: participantId || null,
        timeLeft: 60,
        isRunning: false,
        questionIndex: 0,
      };
      broadcastState(sessionId);
    }
  });

  socket.on("admin:start-rapid-fire-timer", ({ sessionId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache && cache.rapidFireState && !cache.rapidFireState.isRunning) {
      cache.rapidFireState.isRunning = true;

      const interval = setInterval(() => {
        const rfState = cache.rapidFireState;
        if (rfState && rfState.timeLeft > 0 && rfState.isRunning) {
          rfState.timeLeft--;
          if (rfState.timeLeft <= 0) {
            rfState.isRunning = false;
            clearInterval(interval);
            io.to(`session:${sessionId}`).emit("rapid-fire-expired");
          }
          broadcastState(sessionId);
        } else {
          clearInterval(interval);
        }
      }, 1000);

      cache.rapidFireState.timerInterval = interval;
      broadcastState(sessionId);
    }
  });

  socket.on("admin:evaluate-rapid-fire", async ({ sessionId, questionId, status }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (!cache || !cache.rapidFireState) return;

      const rfState = cache.rapidFireState;
      const participantId = rfState.activeParticipantId;
      const teamId = rfState.activeTeamId;

      if (status === "CORRECT" && (participantId || teamId)) {
        const question = await prisma.quizQuestion.findUnique({
          where: { id: questionId },
        });
        const points = question?.points || 10;

        await prisma.$transaction(async (tx) => {
          if (participantId) {
            await tx.quizScore.create({
              data: {
                sessionId,
                participantId,
                roundId: cache.currentRoundId,
                points,
                note: "Rapid Fire correct answer",
              },
            });

            await tx.quizParticipant.update({
              where: { id: participantId },
              data: { totalScore: { increment: points } },
            });
          }

          if (teamId) {
            await tx.quizTeam.update({
              where: { id: teamId },
              data: { totalScore: { increment: points } },
            });

            if (!participantId) {
              const members = await tx.quizParticipant.findMany({
                where: { sessionId, teamId },
              });
              for (const m of members) {
                await tx.quizScore.create({
                  data: {
                    sessionId,
                    participantId: m.id,
                    roundId: cache.currentRoundId,
                    points,
                    note: "Rapid Fire team correct",
                  },
                });
                await tx.quizParticipant.update({
                  where: { id: m.id },
                  data: { totalScore: { increment: points } },
                });
              }
            }
          }
        });
      }

      rfState.questionIndex++;
      broadcastState(sessionId);
    } catch (err) {
      console.error("Evaluate rapid fire error:", err);
    }
  });

  // ─── PASS ROUND HANDLERS ──────────────────────────────────────────────────
  socket.on("admin:set-pass-round-team", ({ sessionId, teamId, participantId }) => {
    const cache = activeSessions.get(sessionId);
    if (cache) {
      cache.passRoundState = {
        activeTeamId: teamId || null,
        activeParticipantId: participantId || null,
        passCount: 0,
      };
      broadcastState(sessionId);
    }
  });

  socket.on("admin:evaluate-pass-round", async ({ sessionId, questionId, status, nextTeamId, nextParticipantId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (!cache || !cache.passRoundState) return;

      const prState = cache.passRoundState;
      const participantId = prState.activeParticipantId;
      const teamId = prState.activeTeamId;

      const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
      });
      const basePoints = question?.points || 10;
      
      // Calculate correct pass round scores
      let pointsAwarded = 0;
      if (status === "CORRECT") {
        pointsAwarded = prState.passCount > 0 ? Math.floor(basePoints / 2) : basePoints;
      }

      if (status === "CORRECT" && (participantId || teamId)) {
        await prisma.$transaction(async (tx) => {
          if (participantId) {
            await tx.quizScore.create({
              data: {
                sessionId,
                participantId,
                roundId: cache.currentRoundId,
                points: pointsAwarded,
                note: prState.passCount > 0 ? "Correct on pass" : "Correct on direct",
              },
            });

            await tx.quizParticipant.update({
              where: { id: participantId },
              data: { totalScore: { increment: pointsAwarded } },
            });
          }

          if (teamId) {
            await tx.quizTeam.update({
              where: { id: teamId },
              data: { totalScore: { increment: pointsAwarded } },
            });

            if (!participantId) {
              const members = await tx.quizParticipant.findMany({
                where: { sessionId, teamId },
              });
              for (const m of members) {
                await tx.quizScore.create({
                  data: {
                    sessionId,
                    participantId: m.id,
                    roundId: cache.currentRoundId,
                    points: pointsAwarded,
                    note: prState.passCount > 0 ? "Correct on pass" : "Correct on direct",
                  },
                });
                await tx.quizParticipant.update({
                  where: { id: m.id },
                  data: { totalScore: { increment: pointsAwarded } },
                });
              }
            }
          }
        });
      }

      if (status === "PASS") {
        prState.passCount++;
        prState.activeTeamId = nextTeamId || null;
        prState.activeParticipantId = nextParticipantId || null;
      } else {
        // Reset pass count on correct/wrong evaluation and move to next team
        prState.passCount = 0;
        prState.activeTeamId = nextTeamId || null;
        prState.activeParticipantId = nextParticipantId || null;
      }

      broadcastState(sessionId);
    } catch (err) {
      console.error("Evaluate pass round error:", err);
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
