import { Server } from "socket.io";
import { createServer } from "http";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as os from "os";

dotenv.config();

// Global exception boundaries to prevent socket server crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Fatal Error] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Fatal Error] Uncaught Exception thrown:", error);
});

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
  buzzerCountdownInterval?: NodeJS.Timeout | null;
  questionCompleted?: boolean;
  rapidFireState?: {
    activeTeamId: string | null;
    activeParticipantId: string | null;
    timeLeft: number;
    questionTimeLeft: number;
    isRunning: boolean;
    questionIndex: number;
    timerInterval?: NodeJS.Timeout | null;
    pausedForSelection?: boolean;
    selectedOptionId?: string | null;
    config: {
      totalRoundTime: number;
      questionTimeLimit: number;
      pointsPerQuestion: number;
      negativeMarking: boolean;
    };
    stats: {
      attempted: number;
      correct: number;
      wrong: number;
      score: number;
      history?: {
        questionText: string;
        isCorrect: boolean;
        pointsAwarded: number;
      }[];
    };
  };
  passRoundState?: {
    activeTeamId: string | null;
    activeParticipantId: string | null;
    passCount: number;
    passHistory: string[];
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

    // Fetch buzzer events specifically for this active question to keep rankings clean and distinct
    const buzzerEvents = cache?.activeQuestionId ? await prisma.quizBuzzerEvent.findMany({
      where: { sessionId, questionId: cache.activeQuestionId },
      orderBy: { buzzedAt: "asc" },
      include: {
        participant: {
          select: {
            displayName: true,
            teamId: true,
            team: { select: { name: true } },
          },
        },
      },
    }) : [];

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
      questionCompleted: cache?.questionCompleted || false,
      rapidFireState: cache?.rapidFireState ? {
        activeTeamId: cache.rapidFireState.activeTeamId,
        activeParticipantId: cache.rapidFireState.activeParticipantId,
        timeLeft: cache.rapidFireState.timeLeft,
        questionTimeLeft: cache.rapidFireState.questionTimeLeft,
        isRunning: cache.rapidFireState.isRunning,
        questionIndex: cache.rapidFireState.questionIndex,
        pausedForSelection: cache.rapidFireState.pausedForSelection,
        selectedOptionId: cache.rapidFireState.selectedOptionId,
        config: cache.rapidFireState.config,
        stats: cache.rapidFireState.stats,
      } : null,
      passRoundState: cache?.passRoundState ? {
        activeTeamId: cache.passRoundState.activeTeamId,
        activeParticipantId: cache.passRoundState.activeParticipantId,
        passCount: cache.passRoundState.passCount,
        passHistory: cache.passRoundState.passHistory,
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
      buzzerQueue: buzzerEvents.map((b) => ({
        id: b.id,
        participantId: b.participantId,
        displayName: b.participant.displayName,
        teamName: b.participant.team?.name || null,
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
    try {
      socket.join(`session:${sessionId}`);
      socket.data = { sessionId, participantId, isAdmin: false };
      
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
            questionCompleted: false,
          });
        }
      }

      await broadcastState(sessionId);
    } catch (err) {
      console.error("Error in join-session handler:", err);
    }
  });

  socket.on("admin:join-session", async ({ sessionId }) => {
    try {
      socket.join(`session:${sessionId}`);
      socket.join(`admin:session:${sessionId}`);
      socket.data = { sessionId, isAdmin: true };
      
      if (!activeSessions.has(sessionId)) {
        activeSessions.set(sessionId, {
          sessionId,
          status: "ACTIVE",
          currentRoundId: null,
          activeQuestionId: null,
          questionStartedAt: null,
          questionEndsAt: null,
          timerInterval: null,
          buzzerOpen: false,
          questionCompleted: false,
        });
      }
      await broadcastState(sessionId);
    } catch (err) {
      console.error("Error in admin:join-session handler:", err);
    }
  });

  socket.on("admin:start-session", async ({ sessionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.status = "ACTIVE";
      }
      await broadcastState(sessionId);
    } catch (err) {
      console.error("Error in admin:start-session handler:", err);
    }
  });

  socket.on("admin:pause-session", async ({ sessionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.status = "PAUSED";
        if (cache.timerInterval) {
          clearTimeout(cache.timerInterval);
          cache.timerInterval = null;
        }
        if (cache.rapidFireState?.timerInterval) {
          clearInterval(cache.rapidFireState.timerInterval);
        }
      }
      await broadcastState(sessionId);
    } catch (err) {
      console.error("Error in admin:pause-session handler:", err);
    }
  });

  socket.on("admin:resume-session", async ({ sessionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.status = "ACTIVE";
      }
      await broadcastState(sessionId);
    } catch (err) {
      console.error("Error in admin:resume-session handler:", err);
    }
  });

  socket.on("admin:end-session", async ({ sessionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.status = "COMPLETED";
        cache.activeQuestionId = null;
        if (cache.timerInterval) {
          clearTimeout(cache.timerInterval);
          cache.timerInterval = null;
        }
        if (cache.buzzerCountdownInterval) {
          clearInterval(cache.buzzerCountdownInterval);
        }
        if (cache.rapidFireState?.timerInterval) {
          clearInterval(cache.rapidFireState.timerInterval);
        }
      }
      await broadcastState(sessionId);
    } catch (err) {
      console.error("Error in admin:end-session handler:", err);
    }
  });

  socket.on("admin:start-round", async ({ sessionId, roundId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.currentRoundId = roundId;
        cache.activeQuestionId = null;
        cache.buzzerOpen = false;
        cache.questionCompleted = false;

        // Reset timers
        if (cache.timerInterval) {
          clearTimeout(cache.timerInterval);
          cache.timerInterval = null;
        }
        if (cache.buzzerCountdownInterval) {
          clearInterval(cache.buzzerCountdownInterval);
          cache.buzzerCountdownInterval = null;
        }
        
        const round = await prisma.quizRound.findUnique({ where: { id: roundId } });
        if (round) {
          if (round.type === "RAPID_FIRE") {
            cache.rapidFireState = {
              activeTeamId: null,
              activeParticipantId: null,
              timeLeft: 60,
              questionTimeLeft: 10,
              isRunning: false,
              questionIndex: 0,
              config: {
                totalRoundTime: 60,
                questionTimeLimit: 10,
                pointsPerQuestion: 10,
                negativeMarking: false,
              },
              stats: {
                attempted: 0,
                correct: 0,
                wrong: 0,
                score: 0,
              }
            };
            cache.passRoundState = undefined;
          } else {
            cache.rapidFireState = undefined;
            cache.passRoundState = {
              activeTeamId: null,
              activeParticipantId: null,
              passCount: 0,
              passHistory: [],
            };
          }
        }
      }
      await broadcastState(sessionId);
    } catch (err) {
      console.error("Error in admin:start-round handler:", err);
    }
  });

  socket.on("admin:end-round", async ({ sessionId, roundId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.activeQuestionId = null;
        if (cache.timerInterval) {
          clearTimeout(cache.timerInterval);
          cache.timerInterval = null;
        }
        if (cache.buzzerCountdownInterval) {
          clearInterval(cache.buzzerCountdownInterval);
          cache.buzzerCountdownInterval = null;
        }
        if (cache.rapidFireState?.timerInterval) {
          clearInterval(cache.rapidFireState.timerInterval);
        }
        cache.rapidFireState = undefined;
        cache.passRoundState = undefined;
      }
      await broadcastState(sessionId);
    } catch (err) {
      console.error("Error in admin:end-round handler:", err);
    }
  });

  socket.on("admin:push-question", async ({ sessionId, questionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        if (cache.timerInterval) {
          clearTimeout(cache.timerInterval);
          cache.timerInterval = null;
        }
        if (cache.buzzerCountdownInterval) {
          clearInterval(cache.buzzerCountdownInterval);
          cache.buzzerCountdownInterval = null;
        }

        const question = await prisma.quizQuestion.findUnique({
          where: { id: questionId },
          include: { round: true },
        });

        if (question) {
          const duration = question.timeLimit || question.round?.timeLimit || 30;
          const started = new Date();
          const ends = new Date(started.getTime() + duration * 1000);

          cache.activeQuestionId = questionId;
          cache.questionStartedAt = started;
          cache.questionEndsAt = ends;
          cache.buzzerOpen = false;
          cache.questionCompleted = false;

          // Log question usage
          await prisma.quizQuestionUsage.upsert({
            where: {
              sessionId_questionId: {
                sessionId,
                questionId,
              },
            },
            update: {},
            create: {
              sessionId,
              roundId: question.roundId!,
              questionId,
            },
          });

          // Reset question pass controls
          if (cache.passRoundState) {
            cache.passRoundState.passCount = 0;
            cache.passRoundState.passHistory = [];
          }

          // Auto activation countdown for Buzzer Round (3s countdown -> Buzzer Open)
          if (question.round?.type === "BUZZER") {
            let countdown = 3;
            io.to(`session:${sessionId}`).emit("buzzer-countdown", { count: countdown });

            cache.buzzerCountdownInterval = setInterval(() => {
              try {
                countdown--;
                if (countdown > 0) {
                  io.to(`session:${sessionId}`).emit("buzzer-countdown", { count: countdown });
                } else {
                  if (cache.buzzerCountdownInterval) {
                    clearInterval(cache.buzzerCountdownInterval);
                    cache.buzzerCountdownInterval = null;
                  }
                  cache.buzzerOpen = true;
                  io.to(`session:${sessionId}`).emit("buzzer-countdown", { count: 0 }); // 0 means BUZZ OPEN
                  broadcastState(sessionId);
                }
              } catch (err) {
                console.error("Error in buzzer countdown interval:", err);
              }
            }, 1000);
          } else if (question.round?.type === "MCQ") {
            cache.timerInterval = setTimeout(() => {
              try {
                io.to(`session:${sessionId}`).emit("timer-expired", { questionId });
              } catch (err) {
                console.error("Error in timer-expired setTimeout:", err);
              }
            }, duration * 1000);
          }
        }
      }

      await broadcastState(sessionId);
    } catch (err) {
      console.error("Error in admin:push-question handler:", err);
    }
  });

  socket.on("admin:reveal-answer", async ({ sessionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache && cache.activeQuestionId) {
        const correctOption = await prisma.quizQuestionOption.findFirst({
          where: { questionId: cache.activeQuestionId, isCorrect: true },
        });
        
        // Emit correctOptionId to admins ONLY
        io.to(`admin:session:${sessionId}`).emit("admin:reveal-answer", {
          questionId: cache.activeQuestionId,
          correctOptionId: correctOption?.id || null,
        });

        // Get all answers for this question
        const answers = await prisma.quizAnswer.findMany({
          where: { sessionId, questionId: cache.activeQuestionId },
        });

        // Emit to each player individually telling them if their submission was correct
        const roomSockets = await io.in(`session:${sessionId}`).fetchSockets();
        for (const s of roomSockets) {
          if (s.rooms.has(`admin:session:${sessionId}`)) continue;

          const participantId = s.data?.participantId;
          const playerAns = answers.find((a) => a.participantId === participantId);

          s.emit("reveal-answer", {
            questionId: cache.activeQuestionId,
            isCorrect: playerAns ? playerAns.isCorrect : false,
            hasSubmitted: !!playerAns,
            selectedOptionId: playerAns ? playerAns.selectedOptionId : null,
            correctOptionId: correctOption?.id || null,
          });
        }

        // Projector receives projector:reveal-answer with correctOptionId to highlight correct options
        io.to(`session:${sessionId}`).emit("projector:reveal-answer", {
          questionId: cache.activeQuestionId,
          correctOptionId: correctOption?.id || null,
        });
      }
    } catch (err) {
      console.error("Error in admin:reveal-answer handler:", err);
    }
  });

  socket.on("admin:trigger-score-sync", async ({ sessionId }) => {
    try {
      await broadcastState(sessionId);
    } catch (err) {
      console.error("Error in admin:trigger-score-sync handler:", err);
    }
  });

  // ─── PLAYER CONTROLS ──────────────────────────────────────────────────────
  socket.on("submit-answer", async ({ sessionId, participantId, questionId, selectedOptionId, textAnswer }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (!cache || cache.activeQuestionId !== questionId) return;

      const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
        include: { round: true },
      });

      if (!question) return;

      // Handle RAPID_FIRE round team scoring & automatic progression
      if (question.round?.type === "RAPID_FIRE" && cache.rapidFireState?.isRunning) {
        const rfState = cache.rapidFireState;
        rfState.selectedOptionId = null;
        
        // Verify sender belongs to active team/participant
        const sender = await prisma.quizParticipant.findUnique({
          where: { id: participantId },
          select: { teamId: true },
        });
        if (rfState.activeTeamId) {
          if (sender?.teamId !== rfState.activeTeamId) return;
        } else if (rfState.activeParticipantId) {
          if (participantId !== rfState.activeParticipantId) return;
        } else {
          return;
        }

        let isCorrect = false;
        if (selectedOptionId) {
          const option = await prisma.quizQuestionOption.findUnique({
            where: { id: selectedOptionId },
          });
          isCorrect = option?.isCorrect || false;
        }

        const points = rfState.config.pointsPerQuestion;
        let pointsAwarded = isCorrect ? points : 0;
        if (!isCorrect && rfState.config.negativeMarking) {
          pointsAwarded = -points;
        }

        rfState.stats.attempted++;
        if (isCorrect) rfState.stats.correct++;
        else rfState.stats.wrong++;
        rfState.stats.score += pointsAwarded;

        if (!rfState.stats.history) {
          rfState.stats.history = [];
        }
        rfState.stats.history.push({
          questionText: question.text,
          isCorrect,
          pointsAwarded,
        });

        await prisma.$transaction(async (tx) => {
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

          await tx.quizScore.create({
            data: {
              sessionId,
              participantId,
              roundId: question.roundId,
              points: pointsAwarded,
              note: "Rapid Fire Answer",
            },
          });

          await tx.quizParticipant.update({
            where: { id: participantId },
            data: { totalScore: { increment: pointsAwarded } },
          });

          if (rfState.activeTeamId) {
            await tx.quizTeam.update({
              where: { id: rfState.activeTeamId },
              data: { totalScore: { increment: pointsAwarded } },
            });
          }
        });

        // Automatically advance to the next question in the round question pool
        rfState.questionIndex++;
        const templateRoundId = question.round?.settings && (question.round.settings as any).templateRoundId;
        const selectedSet = rfState.config.selectedSet || "A";
        const roundQuestions = await prisma.quizQuestion.findMany({
          where: templateRoundId 
            ? { templateRoundId, questionSet: selectedSet } 
            : { quizId: cache.sessionId, questionSet: selectedSet },
          orderBy: { sortOrder: "asc" },
        });

        if (rfState.questionIndex < roundQuestions.length) {
          cache.activeQuestionId = roundQuestions[rfState.questionIndex].id;
          rfState.questionTimeLeft = rfState.config.questionTimeLimit;
          rfState.pausedForSelection = true;
          cache.questionStartedAt = new Date(Date.now() + 1500);
          cache.questionEndsAt = new Date(Date.now() + (rfState.config.questionTimeLimit + 1.5) * 1000);
          
          socket.emit("answer-feedback", { success: true, message: "Answer logged" });
          await broadcastState(sessionId);

          setTimeout(async () => {
            const currentCache = activeSessions.get(sessionId);
            if (currentCache && currentCache.rapidFireState && currentCache.rapidFireState.isRunning) {
              currentCache.rapidFireState.pausedForSelection = false;
              currentCache.questionStartedAt = new Date();
              currentCache.questionEndsAt = new Date(Date.now() + currentCache.rapidFireState.config.questionTimeLimit * 1000);
              await broadcastState(sessionId);
            }
          }, 1500);
        } else {
          rfState.isRunning = false;
          if (rfState.timerInterval) clearInterval(rfState.timerInterval);
          io.to(`session:${sessionId}`).emit("rapid-fire-expired");
          socket.emit("answer-feedback", { success: true, message: "Answer logged" });
          await broadcastState(sessionId);
        }
        return;
      }

      // Check if time has expired
      if (cache.questionEndsAt && new Date() > cache.questionEndsAt) {
        socket.emit("answer-feedback", { success: false, error: "Time expired" });
        return;
      }

      // Check if answer already exists to allow modifying selections until timer expires
      const existing = await prisma.quizAnswer.findFirst({
        where: { sessionId, participantId, questionId },
      });

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

      if (existing) {
        // Calculate points difference and apply adjustments in real-time
        const pointsDelta = pointsAwarded - existing.pointsAwarded;

        await prisma.$transaction(async (tx) => {
          await tx.quizAnswer.update({
            where: { id: existing.id },
            data: {
              selectedOptionId,
              textAnswer,
              isCorrect,
              pointsAwarded,
              answeredAt: new Date(),
            },
          });

          if (pointsDelta !== 0) {
            await tx.quizScore.create({
              data: {
                sessionId,
                participantId,
                roundId: question.roundId,
                points: pointsDelta,
                note: "Answer change adjustment",
              },
            });

            const p = await tx.quizParticipant.update({
              where: { id: participantId },
              data: { totalScore: { increment: pointsDelta } },
              select: { teamId: true },
            });

            if (p.teamId) {
              await tx.quizTeam.update({
                where: { id: p.teamId },
                data: { totalScore: { increment: pointsDelta } },
              });
            }
          }
        });

        socket.emit("answer-feedback", { success: true, message: "Answer logged" });
        broadcastState(sessionId);
        return;
      }

      // Save new answer
      await prisma.$transaction(async (tx) => {
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

        if (pointsAwarded > 0) {
          await tx.quizScore.create({
            data: {
              sessionId,
              participantId,
              roundId: question.roundId,
              points: pointsAwarded,
            },
          });

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

      socket.emit("answer-feedback", { success: true, message: "Answer logged" });
      broadcastState(sessionId);
    } catch (err) {
      console.error("Submit answer error:", err);
    }
  });

  // ─── BUZZER EVENT HANDLERS ────────────────────────────────────────────────
  socket.on("admin:open-buzzer", async ({ sessionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.buzzerOpen = true;
        io.to(`session:${sessionId}`).emit("buzzer-reset"); // Reset rank animations
        await broadcastState(sessionId);
      }
    } catch (err) {
      console.error("Error in admin:open-buzzer handler:", err);
    }
  });

  socket.on("admin:close-buzzer", async ({ sessionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.buzzerOpen = false;
        await broadcastState(sessionId);
      }
    } catch (err) {
      console.error("Error in admin:close-buzzer handler:", err);
    }
  });

  socket.on("buzzer-pressed", async ({ sessionId, participantId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (!cache || !cache.activeQuestionId || !cache.buzzerOpen || cache.questionCompleted) return;

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
    try {
      const cache = activeSessions.get(sessionId);
      if (cache && cache.activeQuestionId) {
        cache.buzzerOpen = false;
        await prisma.quizBuzzerEvent.deleteMany({
          where: { sessionId, questionId: cache.activeQuestionId },
        });
        io.to(`session:${sessionId}`).emit("buzzer-reset");
        await broadcastState(sessionId);
      }
    } catch (err) {
      console.error("Error in admin:reset-buzzer handler:", err);
    }
  });

  socket.on("admin:resolve-buzzer", async ({ sessionId, buzzerEventId, status }) => {
    try {
      const buzzerEvent = await prisma.quizBuzzerEvent.update({
        where: { id: buzzerEventId },
        data: { status },
        include: { question: true },
      });

      // Once resolved, close buzzers. If ACCEPTED (correct), move to completed lock
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.buzzerOpen = false;
        if (status === "ACCEPTED") {
          cache.questionCompleted = true;
        }

        // Set the active team so that if it was wrong, passing starts from this team
        const participant = await prisma.quizParticipant.findUnique({
          where: { id: buzzerEvent.participantId },
          select: { teamId: true },
        });

        if (!cache.passRoundState) {
          cache.passRoundState = { activeTeamId: null, activeParticipantId: null, passCount: 0, passHistory: [] };
        }
        cache.passRoundState.activeTeamId = participant?.teamId || null;
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
  socket.on("admin:set-rapid-fire-team", async ({ sessionId, teamId, participantId, config }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        if (cache.rapidFireState?.timerInterval) {
          clearInterval(cache.rapidFireState.timerInterval);
        }

        const totalRoundTime = config?.totalRoundTime || 60;
        const questionTimeLimit = config?.questionTimeLimit || 10;
        const pointsPerQuestion = config?.pointsPerQuestion || 10;
        const negativeMarking = config?.negativeMarking === true;
        const selectedSet = config?.selectedSet || "A";

        cache.rapidFireState = {
          activeTeamId: teamId || null,
          activeParticipantId: participantId || null,
          timeLeft: totalRoundTime,
          questionTimeLeft: questionTimeLimit,
          isRunning: false,
          questionIndex: 0,
          pausedForSelection: false,
          selectedOptionId: null,
          config: {
            totalRoundTime,
            questionTimeLimit,
            pointsPerQuestion,
            negativeMarking,
            selectedSet,
          },
          stats: {
            attempted: 0,
            correct: 0,
            wrong: 0,
            score: 0,
            history: [],
          }
        };

        // Set active question to the first in the round question pool
        const round = await prisma.quizRound.findUnique({
          where: { id: cache.currentRoundId! },
        });
        const templateRoundId = round?.settings && (round.settings as any).templateRoundId;
        const roundQuestions = await prisma.quizQuestion.findMany({
          where: templateRoundId 
            ? { templateRoundId, questionSet: selectedSet } 
            : { quizId: cache.sessionId, questionSet: selectedSet },
          orderBy: { sortOrder: "asc" },
        });

        if (roundQuestions.length > 0) {
          cache.activeQuestionId = roundQuestions[0].id;
          cache.questionStartedAt = new Date();
          cache.questionEndsAt = new Date(Date.now() + questionTimeLimit * 1000);
        }

        await broadcastState(sessionId);
      }
    } catch (err) {
      console.error("Error in admin:set-rapid-fire-team handler:", err);
    }
  });

  socket.on("admin:start-rapid-fire-timer", async ({ sessionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache && cache.rapidFireState && !cache.rapidFireState.isRunning) {
        cache.rapidFireState.isRunning = true;

        const round = await prisma.quizRound.findUnique({
          where: { id: cache.currentRoundId! },
        });
        const templateRoundId = round?.settings && (round.settings as any).templateRoundId;
        const selectedSet = cache.rapidFireState.config.selectedSet || "A";
        const roundQuestions = await prisma.quizQuestion.findMany({
          where: templateRoundId 
            ? { templateRoundId, questionSet: selectedSet } 
            : { quizId: cache.sessionId, questionSet: selectedSet },
          orderBy: { sortOrder: "asc" },
        });

        const interval = setInterval(async () => {
          try {
            const rfState = cache.rapidFireState;
            if (rfState && rfState.isRunning) {
              if (!rfState.pausedForSelection) {
                if (rfState.timeLeft > 0) {
                  rfState.timeLeft--;
                }
                if (rfState.questionTimeLeft > 0) {
                  rfState.questionTimeLeft--;
                }

                // Question Timeout auto progression
                if (rfState.questionTimeLeft <= 0) {
                  rfState.stats.attempted++;
                  rfState.stats.wrong++;

                  const curQ = roundQuestions[rfState.questionIndex];
                  if (curQ) {
                    if (!rfState.stats.history) {
                      rfState.stats.history = [];
                    }
                    rfState.stats.history.push({
                      questionText: curQ.text,
                      isCorrect: false,
                      pointsAwarded: 0,
                    });
                  }
                  
                  rfState.questionIndex++;
                  if (rfState.questionIndex < roundQuestions.length) {
                    cache.activeQuestionId = roundQuestions[rfState.questionIndex].id;
                    rfState.questionTimeLeft = rfState.config.questionTimeLimit;
                    cache.questionStartedAt = new Date();
                    cache.questionEndsAt = new Date(Date.now() + rfState.config.questionTimeLimit * 1000);
                  } else {
                    rfState.isRunning = false;
                    clearInterval(interval);
                    io.to(`session:${sessionId}`).emit("rapid-fire-expired");
                  }
                }

                // Round Timeout
                if (rfState.timeLeft <= 0) {
                  rfState.isRunning = false;
                  clearInterval(interval);
                  io.to(`session:${sessionId}`).emit("rapid-fire-expired");
                }
              }

              await broadcastState(sessionId);
            } else {
              clearInterval(interval);
            }
          } catch (err) {
            console.error("Error in rapid fire interval loop:", err);
          }
        }, 1000);

        cache.rapidFireState.timerInterval = interval;
        await broadcastState(sessionId);
      }
    } catch (err) {
      console.error("Error in admin:start-rapid-fire-timer handler:", err);
    }
  });

  socket.on("admin:stop-rapid-fire", async ({ sessionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache && cache.rapidFireState) {
        cache.rapidFireState.isRunning = false;
        if (cache.rapidFireState.timerInterval) {
          clearInterval(cache.rapidFireState.timerInterval);
          cache.rapidFireState.timerInterval = null;
        }
        cache.rapidFireState.pausedForSelection = false;
        cache.rapidFireState.selectedOptionId = null;
        await broadcastState(sessionId);
      }
    } catch (err) {
      console.error("Error in admin:stop-rapid-fire handler:", err);
    }
  });

  socket.on("rapid-fire:select-option", ({ sessionId, selectedOptionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache && cache.rapidFireState) {
        cache.rapidFireState.pausedForSelection = !!selectedOptionId;
        cache.rapidFireState.selectedOptionId = selectedOptionId;
        broadcastState(sessionId);
      }
    } catch (err) {
      console.error("Error in rapid-fire:select-option handler:", err);
    }
  });

  socket.on("admin:evaluate-rapid-fire", async ({ sessionId, questionId, status }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (!cache || !cache.rapidFireState) return;

      const rfState = cache.rapidFireState;
      rfState.selectedOptionId = null;
      const participantId = rfState.activeParticipantId;
      const teamId = rfState.activeTeamId;
      const points = rfState.config.pointsPerQuestion;

      let pointsAwarded = status === "CORRECT" ? points : 0;
      if (status === "WRONG" && rfState.config.negativeMarking) {
        pointsAwarded = -points;
      }

      rfState.stats.attempted++;
      if (status === "CORRECT") rfState.stats.correct++;
      else if (status === "WRONG") rfState.stats.wrong++;

      rfState.stats.score += pointsAwarded;

      let questionText = "Question";
      try {
        const questionObj = await prisma.quizQuestion.findUnique({
          where: { id: questionId },
          select: { text: true },
        });
        if (questionObj) {
          questionText = questionObj.text;
        }
      } catch (err) {
        console.error("Error fetching question text for history:", err);
      }

      if (!rfState.stats.history) {
        rfState.stats.history = [];
      }
      rfState.stats.history.push({
        questionText,
        isCorrect: status === "CORRECT",
        pointsAwarded,
      });

      await prisma.$transaction(async (tx) => {
        let targetPid = participantId;
        if (!targetPid && teamId) {
          const firstMember = await tx.quizParticipant.findFirst({
            where: { sessionId, teamId },
          });
          targetPid = firstMember?.id || null;
        }

        if (targetPid) {
          await tx.quizAnswer.create({
            data: {
              sessionId,
              roundId: cache.currentRoundId!,
              questionId,
              participantId: targetPid,
              isCorrect: status === "CORRECT",
              pointsAwarded,
            },
          });

          await tx.quizScore.create({
            data: {
              sessionId,
              participantId: targetPid,
              roundId: cache.currentRoundId,
              points: pointsAwarded,
              note: "Rapid Fire verbal resolution",
            },
          });

          await tx.quizParticipant.update({
            where: { id: targetPid },
            data: { totalScore: { increment: pointsAwarded } },
          });
        }

        if (teamId) {
          await tx.quizTeam.update({
            where: { id: teamId },
            data: { totalScore: { increment: pointsAwarded } },
          });
        }
      });

      rfState.questionIndex++;
      const round = await prisma.quizRound.findUnique({
        where: { id: cache.currentRoundId! },
      });
      const templateRoundId = round?.settings && (round.settings as any).templateRoundId;
      const selectedSet = rfState.config.selectedSet || "A";
      const roundQuestions = await prisma.quizQuestion.findMany({
        where: templateRoundId 
          ? { templateRoundId, questionSet: selectedSet } 
          : { quizId: cache.sessionId, questionSet: selectedSet },
        orderBy: { sortOrder: "asc" },
      });

      if (rfState.questionIndex < roundQuestions.length) {
        cache.activeQuestionId = roundQuestions[rfState.questionIndex].id;
        rfState.questionTimeLeft = rfState.config.questionTimeLimit;
        rfState.pausedForSelection = true;
        cache.questionStartedAt = new Date(Date.now() + 1500);
        cache.questionEndsAt = new Date(Date.now() + (rfState.config.questionTimeLimit + 1.5) * 1000);
        
        await broadcastState(sessionId);

        setTimeout(async () => {
          const currentCache = activeSessions.get(sessionId);
          if (currentCache && currentCache.rapidFireState && currentCache.rapidFireState.isRunning) {
            currentCache.rapidFireState.pausedForSelection = false;
            currentCache.questionStartedAt = new Date();
            currentCache.questionEndsAt = new Date(Date.now() + currentCache.rapidFireState.config.questionTimeLimit * 1000);
            await broadcastState(sessionId);
          }
        }, 1500);
      } else {
        rfState.isRunning = false;
        if (rfState.timerInterval) clearInterval(rfState.timerInterval);
        io.to(`session:${sessionId}`).emit("rapid-fire-expired");
        await broadcastState(sessionId);
      }
    } catch (err) {
      console.error("Evaluate rapid fire error:", err);
    }
  });

  // ─── PASS LOGIC HANDLERS ──────────────────────────────────────────────────
  socket.on("admin:set-pass-round-team", async ({ sessionId, teamId, participantId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (cache) {
        cache.passRoundState = {
          activeTeamId: teamId || null,
          activeParticipantId: participantId || null,
          passCount: 0,
          passHistory: teamId ? [teamId] : [],
        };
        await broadcastState(sessionId);
      }
    } catch (err) {
      console.error("Error in admin:set-pass-round-team handler:", err);
    }
  });

  socket.on("admin:pass-question", async ({ sessionId }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (!cache || !cache.activeQuestionId) return;

      if (!cache.passRoundState) {
        cache.passRoundState = {
          activeTeamId: null,
          activeParticipantId: null,
          passCount: 0,
          passHistory: [],
        };
      }

      const prState = cache.passRoundState;
      const currentTeamId = prState.activeTeamId;

      if (currentTeamId && !prState.passHistory.includes(currentTeamId)) {
        prState.passHistory.push(currentTeamId);
      }

      const teams = await prisma.quizTeam.findMany({
        where: { sessionId },
        orderBy: { id: "asc" },
      });

      if (teams.length === 0) return;

      let nextTeamId = null;

      // 1. In BUZZER rounds, try passing to the next team in the buzzer registration queue
      const round = await prisma.quizRound.findUnique({
        where: { id: cache.currentRoundId! },
        select: { type: true },
      });

      if (round?.type === "BUZZER") {
        const buzzerEvents = await prisma.quizBuzzerEvent.findMany({
          where: { sessionId, questionId: cache.activeQuestionId },
          orderBy: { buzzedAt: "asc" },
          include: {
            participant: { select: { teamId: true } },
          },
        });

        const buzzedTeams = buzzerEvents
          .map((e) => e.participant.teamId)
          .filter((tId): tId is string => !!tId);

        nextTeamId = buzzedTeams.find(
          (tId) => tId !== currentTeamId && !prState.passHistory.includes(tId)
        ) || null;
      }

      // 2. If no buzzer queue team is available, pass circular
      if (!nextTeamId) {
        let currentIndex = -1;
        if (currentTeamId) {
          currentIndex = teams.findIndex((t) => t.id === currentTeamId);
        }

        for (let i = 1; i <= teams.length; i++) {
          const idx = (currentIndex + i) % teams.length;
          const candidateTeamId = teams[idx].id;
          if (!prState.passHistory.includes(candidateTeamId)) {
            nextTeamId = candidateTeamId;
            break;
          }
        }
      }

      if (nextTeamId) {
        prState.activeTeamId = nextTeamId;
        prState.activeParticipantId = null;
        prState.passCount++;
        io.to(`session:${sessionId}`).emit("question-passed", {
          activeTeamId: nextTeamId,
          passCount: prState.passCount,
        });
        broadcastState(sessionId);
      } else {
        socket.emit("error", "No more eligible teams to pass to!");
      }
    } catch (err) {
      console.error("Pass question error:", err);
    }
  });

  socket.on("admin:evaluate-pass-round", async ({ sessionId, questionId, status }) => {
    try {
      const cache = activeSessions.get(sessionId);
      if (!cache || !cache.passRoundState) return;

      const prState = cache.passRoundState;
      const teamId = prState.activeTeamId;

      const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
      });
      const basePoints = question?.points || 10;
      
      // Calculate correct pass round scores (regular points)
      let pointsAwarded = 0;
      if (status === "CORRECT") {
        pointsAwarded = basePoints;
      }

      if (status === "CORRECT") {
        cache.questionCompleted = true;
        cache.buzzerOpen = false;
      }

      if (status === "CORRECT" && teamId) {
        await prisma.$transaction(async (tx) => {
          // Log score for team
          await tx.quizTeam.update({
            where: { id: teamId },
            data: { totalScore: { increment: pointsAwarded } },
          });

          // Also log for team members
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
                note: prState.passCount > 0 ? "Correct on Pass" : "Correct on Direct",
              },
            });
            await tx.quizParticipant.update({
              where: { id: m.id },
              data: { totalScore: { increment: pointsAwarded } },
            });
          }
        });
      }

      broadcastState(sessionId);
    } catch (err) {
      console.error("Evaluate pass round error:", err);
    }
  });

  // ─── CLEANUP ON DISCONNECT ────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    try {
      console.log(`Socket disconnected: ${socket.id}`);
      const participantId = socket.data?.participantId;
      if (participantId) {
        // Safe check: Only set isConnected to false if no other socket is active for this participant
        const sockets = await io.fetchSockets();
        const stillConnected = sockets.some(
          (s) => s.data?.participantId === participantId && s.id !== socket.id
        );
        if (!stillConnected) {
          await prisma.quizParticipant.update({
            where: { id: participantId },
            data: { isConnected: false },
          }).catch((e) => console.error("Disconnect status update error:", e));
        }
        
        const sessionId = socket.data?.sessionId;
        if (sessionId) {
          await broadcastState(sessionId);
        }
      }
    } catch (err) {
      console.error("Disconnect handler error:", err);
    }
  });
});

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    const netList = interfaces[name];
    if (netList) {
      for (const net of netList) {
        if ((net.family === "IPv4" || (net.family as any) === 4) && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return "127.0.0.1";
}

httpServer.listen(Number(PORT), "0.0.0.0", () => {
  const localIp = getLocalIpAddress();
  console.log("\n========================================");
  console.log("🟢 Socket Server Started");
  console.log(`\nLocal:\n  http://localhost:${PORT}`);
  if (localIp && localIp !== "127.0.0.1") {
    console.log(`\nNetwork:\n  http://${localIp}:${PORT}`);
  }
  console.log(`\nPort:\n  ${PORT}`);
  console.log("========================================\n");
});
