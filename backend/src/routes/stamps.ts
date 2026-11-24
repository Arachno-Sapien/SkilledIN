import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { db } from "../lib/db.js";
import { transcribeAudio } from "../lib/elevenlabs.js";
import { sendJson, sendError } from "../lib/http.js";

export const stampsRouter = Router();

stampsRouter.post("/", async (req, res) => {
  const schema = z.object({
    workerId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    audioBase64: z.string().optional(),
    mimeType: z.string().default("audio/webm"),
    customerName: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", "workerId and rating (1-5) are required");
  }

  const worker = await db.get(`WORKER#${parsed.data.workerId}`, "PROFILE");
  if (!worker) {
    return sendError(res, 404, "NOT_FOUND", "Worker not found");
  }

  let quote = "Great professional work completed efficiently.";
  if (parsed.data.audioBase64) {
    try {
      const transcription = await transcribeAudio(
        parsed.data.audioBase64,
        parsed.data.mimeType
      );
      if (transcription.text) {
        quote = transcription.text.slice(0, 140);
      }
    } catch {
      // Audio not stored, quote kept clean
    }
  }

  const stampId = `s_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const stampItem = {
    PK: `WORKER#${parsed.data.workerId}`,
    SK: `STAMP#${now}#${stampId}`,
    stampId,
    rating: parsed.data.rating,
    quote,
    customerName: parsed.data.customerName || "Customer",
    createdAt: now,
  };

  await db.put(stampItem);

  return sendJson(res, 201, stampItem);
});
