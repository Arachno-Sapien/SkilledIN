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
import { sendJson, sendError, ah } from "../lib/http.js";
import { publicProfile, recoverRegistration, withSkillText } from "../lib/passport.js";

export const workersRouter = Router();

const WorkerTradeEnum = z.enum(["electrician", "plumber", "mason", "other"]);

// POST /api/workers/parse
workersRouter.post("/parse", ah(async (req, res) => {
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
}));

// POST /api/workers
workersRouter.post("/", ah(async (req, res) => {
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

  let created: boolean;
  try {
    created = await db.transactWorkerAndPhone(workerProfile, phoneLock);
  } catch (err) {
    // Never answer 201 unless the write landed: the worker would think the passport is saved.
    console.error(JSON.stringify({ level: "error", msg: "worker_save_failed", error: (err as Error).message }));
    return sendError(res, 500, "INTERNAL", "Could not save your passport. Please try again.");
  }

  if (!created) {
    const lock = await db.get(`PHONE#${cleanPhone}`, "PHONE");
    const existing = lock ? await db.get(`WORKER#${lock.workerId}`, "PROFILE") : null;
    const recovered = recoverRegistration(existing, parsed.data.name);
    if (recovered) return sendJson(res, 200, recovered);
    return sendError(res, 409, "CONFLICT", "This phone number is registered with a different name.");
  }

  return sendJson(res, 201, publicProfile(workerProfile));
}));

// GET /api/workers/:id (Public passport)
workersRouter.get("/:id", ah(async (req, res) => {
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
    .map((b) =>
      withSkillText({
        skillId: b.skillId as string,
        score: b.score,
        items: (b.items ?? []) as { id: string; status: string; evidence: string }[],
        createdAt: b.createdAt,
        daysAgo: daysAgo(b.createdAt),
      })
    );

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
}));

// GET /api/workers/:id/offers
workersRouter.get("/:id/offers", ah(async (req, res) => {
  const workerId = req.params.id;
  const items = await db.queryPk(`WORKER#${workerId}`);

  const offers = items.filter((i) => i.SK.startsWith("OFFER#"));
  const populatedOffers = await Promise.all(
    offers.map(async (offer) => {
      const jobItem = await db.get(`JOB#${offer.jobId}`, "META");
      // A missing job is dropped, not shown with made-up area, date and wage.
      if (!jobItem) return null;
      return {
        jobId: offer.jobId,
        status: offer.status,
        createdAt: offer.createdAt,
        trade: jobItem.trade,
        area: jobItem.area,
        date: jobItem.date,
        wage: jobItem.wage,
        // contractorPhone exposed ONLY on accepted offers
        contractorPhone: offer.status === "accepted" ? jobItem.contractorPhone : undefined,
      };
    })
  );

  return sendJson(res, 200, populatedOffers.filter((o) => o !== null));
}));
