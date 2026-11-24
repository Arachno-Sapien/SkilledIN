import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import { skillsRouter } from "./routes/skills.js";
import { workersRouter } from "./routes/workers.js";
import { challengesRouter } from "./routes/challenges.js";
import { jobsRouter } from "./routes/jobs.js";
import { stampsRouter } from "./routes/stamps.js";
import { voiceRouter } from "./routes/voice.js";
import { storeMode } from "./lib/db.js";
import { errorHandler } from "./lib/http.js";

export const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(null, true); // Allow dev origins gracefully
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "6mb" }));

// Health check
app.get("/api/health", (req, res) => {
  // store shows whether registrations reach DynamoDB or only this process's memory.
  res.json({ ok: true, name: "SkilledIN API", store: storeMode(), timestamp: new Date().toISOString() });
});

// Mock upload for local development testing
app.post("/api/mock-upload", (req, res) => {
  res.status(204).send();
});

// API Routes
app.use("/api/skills", skillsRouter);
app.use("/api/workers", workersRouter);
app.use("/api/challenges", challengesRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/stamps", stampsRouter);
app.use("/api/voice", voiceRouter);

// Registered last so it catches errors from every route above.
app.use(errorHandler);

// Lambda Function URL entry point: serverless-http turns the URL event into an Express request.
export const handler = serverless(app);
