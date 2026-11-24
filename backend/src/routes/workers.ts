import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { db } from "../lib/db.js";
import { normalisePhone } from "../lib/phone.js";
import { geocode } from "../lib/geo.js";
import { parseWorkerSpeech } from "../lib/assess.js";
import { textToSpeech } from "../lib/elevenlabs.js";
import {
  computeTrustLevel,
  computeAvgRating,
  daysAgo,
} from "../lib/scoring.js";
import { sendJson, sendError } from "../lib/http.js";

export const workersRouter = Router();

const WorkerTradeEnum = z.enum(["electrician", "plumber", "mason", "other"]);

// POST /api/workers/parse
workersRouter.post("/parse", async (req, res) => {
  const schema = z.object({
    transcript: z.string(),
    lang: z.string().default("en"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", "transcript is required");
  }

  try {
    const result = await parseWorkerSpeech(parsed.data.transcript, parsed.data.lang);
    let audioBase64: string | null = null;
    if (result.name && result.area) {
      audioBase64 = await textToSpeech(result.readBack, parsed.data.lang);
    }
    return sendJson(res, 200, { ...result, audioBase64 });
  } catch (err) {
    return sendError(res, 500, "INTERNAL", (err as Error).message);
  }
});

// POST /api/workers
workersRouter.post("/", async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(1),
    phone: z.string().min(1),
    trade: WorkerTradeEnum,
    area: z.string().trim().min(1),
    lang: z.enum(["en", "hi", "kn"]).default("en"),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", parsed.error.issues[0]?.message || "Invalid input");
  }

  let cleanPhone: string;
  try {
    cleanPhone = normalisePhone(parsed.data.phone);
  } catch (err) {
    return sendError(res, 400, "BAD_REQUEST", (err as Error).message);
  }

  // Geocode first so a miss never leaves a phone lock
  const geo = await geocode(parsed.data.area);
  if (!geo) {
    return sendError(res, 400, "AREA_NOT_FOUND", `Could not locate area: ${parsed.data.area}`);
  }

  const workerId = `w_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const workerProfile = {
    PK: `WORKER#${workerId}`,
    SK: "PROFILE",
    type: "worker",
    id: workerId,
    name: parsed.data.name,
    phone: cleanPhone,
    trade: parsed.data.trade,
    area: geo.displayName || parsed.data.area,
    lat: geo.lat,
    lng: geo.lng,
    lang: parsed.data.lang,
    createdAt: now,
  };

  const phoneLock = {
    PK: `PHONE#${cleanPhone}`,
    SK: "PHONE",
    workerId,
    createdAt: now,
  };

  const success = await db.transactWorkerAndPhone(workerProfile, phoneLock);
  if (!success) {
    return sendError(
      res,
      409,
      "CONFLICT",
      "This phone number is already registered. Please sign in or use a different number."
    );
  }

  return sendJson(res, 201, workerProfile);
});

// GET /api/workers/:id (Public passport)
workersRouter.get("/:id", async (req, res) => {
  const workerId = req.params.id;
  const items = await db.queryPk(`WORKER#${workerId}`);

  const profile = items.find((i) => i.SK === "PROFILE");
  if (!profile) {
    return sendError(res, 404, "NOT_FOUND", "Worker passport not found");
  }

  // Filter: PASS badges only, sorted newest first
  const passBadges = items
    .filter((i) => i.SK.startsWith("BADGE#") && i.status === "PASS")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((b) => ({
      skillId: b.skillId,
      score: b.score,
      items: b.items,
      createdAt: b.createdAt,
      daysAgo: daysAgo(b.createdAt),
    }));

  const stamps = items
    .filter((i) => i.SK.startsWith("STAMP#"))
    .map((s) => ({
      rating: s.rating,
      quote: s.quote,
      customerName: s.customerName,
      createdAt: s.createdAt,
    }));

  const level = computeTrustLevel(passBadges.length, stamps);
  const avgRating = computeAvgRating(stamps);

  // Secure public passport output: omits phone, videoKey, transcript, offers, FAIL badges
  return sendJson(res, 200, {
    id: profile.id,
    name: profile.name,
    trade: profile.trade,
    area: profile.area,
    lang: profile.lang,
    level,
    avgRating,
    stampCount: stamps.length,
    badges: passBadges,
    stamps,
    createdAt: profile.createdAt,
  });
});

// GET /api/workers/:id/offers
workersRouter.get("/:id/offers", async (req, res) => {
  const workerId = req.params.id;
  const items = await db.queryPk(`WORKER#${workerId}`);

  const offers = items.filter((i) => i.SK.startsWith("OFFER#"));
  const populatedOffers = await Promise.all(
    offers.map(async (offer) => {
      const jobItem = await db.get(`JOB#${offer.jobId}`, "META");
      return {
        jobId: offer.jobId,
        status: offer.status,
        createdAt: offer.createdAt,
        trade: jobItem?.trade || "general",
        area: jobItem?.area || "Bengaluru",
        date: jobItem?.date || "Tomorrow",
        wage: jobItem?.wage || 800,
        // contractorPhone exposed ONLY on accepted offers
        contractorPhone: offer.status === "accepted" ? jobItem?.contractorPhone : undefined,
      };
    })
  );

  return sendJson(res, 200, populatedOffers);
});
