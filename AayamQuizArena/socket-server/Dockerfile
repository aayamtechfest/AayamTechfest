# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files to install build tools (TypeScript, Prisma CLI)
COPY package*.json ./
RUN npm ci

# Copy prisma schema and generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Copy socket-server files
COPY socket-server ./socket-server

# Build socket-server (compiles TypeScript to JS in socket-server/dist)
WORKDIR /app/socket-server
RUN npm install
RUN npx tsc

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy socket-server package files
COPY socket-server/package*.json ./

# Install production dependencies (dotenv, socket.io, pg, @prisma/client)
RUN npm install --omit=dev

# Copy built server files from builder
COPY --from=builder /app/socket-server/dist ./dist

# Copy generated Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose default Socket.IO port
EXPOSE 3001

# Start the server
CMD ["node", "dist/index.js"]
