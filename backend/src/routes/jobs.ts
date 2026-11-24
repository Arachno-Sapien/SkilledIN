import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { db } from "../lib/db.js";
import { normalisePhone } from "../lib/phone.js";
import { geocode } from "../lib/geo.js";
import {
  computeTrustLevel,
  computeAvgRating,
  haversineDistanceKm,
  computeRankScore,
  buildMatchReason,
  daysAgo,
} from "../lib/scoring.js";
import skillsData from "../data/skills.json" with { type: "json" };
import { sendJson, sendError, ah } from "../lib/http.js";

export const jobsRouter = Router();

const JobTradeEnum = z.enum(["electrician", "plumber", "mason"]);

// POST /api/jobs
jobsRouter.post("/", ah(async (req, res) => {
  const schema = z.object({
    trade: JobTradeEnum,
    count: z.number().int().min(1).default(1),
    area: z.string().trim().min(1),
    date: z.string().default("Tomorrow"),
    wage: z.number().int().min(100).default(800),
    contractorPhone: z.string().min(1),
    contractorName: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", parsed.error.issues[0]?.message || "Invalid input");
  }

  let cleanPhone: string;
  try {
    cleanPhone = normalisePhone(parsed.data.contractorPhone);
  } catch (err) {
    return sendError(res, 400, "BAD_REQUEST", (err as Error).message);
  }

  const geo = await geocode(parsed.data.area);
  if (!geo) {
    return sendError(res, 400, "AREA_NOT_FOUND", `Locality not found: ${parsed.data.area}`);
  }

  // Find candidate workers with matching trade
  const candidates = await db.scanWorkersByTrade(parsed.data.trade);

  // Filter <= 10km and rank
  const candidateScores = await Promise.all(
    candidates.map(async (w) => {
      const distanceKm = haversineDistanceKm(geo.lat, geo.lng, w.lat, w.lng);
      if (distanceKm > 10) return null;

      const items = await db.queryPk(`WORKER#${w.id}`);
      const passBadges = items
        .filter((i) => i.SK.startsWith("BADGE#") && i.status === "PASS")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const stamps = items
        .filter((i) => i.SK.startsWith("STAMP#"))
        .map((s) => ({ rating: Number(s.rating) || 5 }));

      const level = computeTrustLevel(passBadges.length, stamps);
      const avgRating = computeAvgRating(stamps);
      const rank = computeRankScore(level, avgRating, distanceKm);

      let latestSkillTitle: string | undefined;
      let badgeDaysAgo: number | undefined;
      if (passBadges[0]) {
        const sk = skillsData.find((s: any) => s.id === passBadges[0].skillId);
        latestSkillTitle = sk?.title?.en || "Verified";
        badgeDaysAgo = daysAgo(passBadges[0].createdAt);
      }

      const verified = level >= 1;
      const reason = buildMatchReason({
        latestSkillTitle,
        badgeDaysAgo,
        avgRating,
        stampCount: stamps.length,
        distanceKm,
        verified,
      });

      return {
        workerId: w.id,
        name: w.name,
        trade: w.trade,
        area: w.area,
        distanceKm,
        level,
        avgRating,
        verified,
        rank,
        reason,
        passportUrl: `/p/${w.id}`,
      };
    })
  );

  const validCandidates = candidateScores.filter((c): c is NonNullable<typeof c> => c !== null);

  const verifiedWorkers = validCandidates
    .filter((w) => w.verified)
    .sort((a, b) => b.rank - a.rank);

  let selectedMatches = verifiedWorkers.slice(0, parsed.data.count * 3);

  // If fewer than count verified workers found, append unverified
  if (selectedMatches.length < parsed.data.count) {
    const unverifiedWorkers = validCandidates
      .filter((w) => !w.verified)
      .sort((a, b) => b.rank - a.rank);
    const needed = parsed.data.count - selectedMatches.length;
    selectedMatches = selectedMatches.concat(unverifiedWorkers.slice(0, needed));
  }

  const jobId = `j_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const jobMeta = {
    PK: `JOB#${jobId}`,
    SK: "META",
    type: "job",
    id: jobId,
    trade: parsed.data.trade,
    count: parsed.data.count,
    area: geo.displayName || parsed.data.area,
    lat: geo.lat,
    lng: geo.lng,
    date: parsed.data.date,
    wage: parsed.data.wage,
    contractorPhone: cleanPhone,
    contractorName: parsed.data.contractorName,
    matchedWorkerIds: selectedMatches.map((m) => m.workerId),
    acceptedWorkerIds: [] as string[],
    createdAt: now,
  };

  await db.put(jobMeta);

  // Create OFFER items for each matched worker
  await Promise.all(
    selectedMatches.map((m) =>
      db.put({
        PK: `WORKER#${m.workerId}`,
        SK: `OFFER#${jobId}`,
        jobId,
        status: "pending",
        createdAt: now,
      })
    )
  );

  // Return job (without contractorPhone) and matches
  const { contractorPhone, ...publicJob } = jobMeta;
  return sendJson(res, 201, {
    job: publicJob,
    matches: selectedMatches,
  });
}));

// GET /api/jobs/:id
jobsRouter.get("/:id", ah(async (req, res) => {
  const jobId = req.params.id;
  const job = await db.get(`JOB#${jobId}`, "META");

  if (!job) {
    return sendError(res, 404, "NOT_FOUND", "Job not found");
  }

  const acceptedWorkers: any[] = [];
  if (Array.isArray(job.acceptedWorkerIds)) {
    for (const wId of job.acceptedWorkerIds) {
      const profile = await db.get(`WORKER#${wId}`, "PROFILE");
      if (profile) {
        acceptedWorkers.push({
          workerId: profile.id,
          name: profile.name,
          trade: profile.trade,
          area: profile.area,
          passportUrl: `/p/${profile.id}`,
        });
      }
    }
  }

  const { contractorPhone, ...safeJob } = job;
  return sendJson(res, 200, {
    job: safeJob,
    acceptedWorkers,
  });
}));

// POST /api/jobs/:id/accept
jobsRouter.post("/:id/accept", ah(async (req, res) => {
  const jobId = req.params.id;
  const schema = z.object({
    workerId: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", "workerId is required");
  }

  const offer = await db.get(`WORKER#${parsed.data.workerId}`, `OFFER#${jobId}`);
  if (!offer) {
    return sendError(res, 404, "NOT_FOUND", "No pending offer found for this worker");
  }

  const { job } = await db.updateJobAcceptance(jobId, parsed.data.workerId);

  if (job) {
    const { contractorPhone, ...safeJob } = job;
    return sendJson(res, 200, safeJob);
  }

  return sendJson(res, 200, { ok: true, status: "accepted" });
}));
