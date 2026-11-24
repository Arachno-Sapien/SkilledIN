import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { db } from "../lib/db.js";
import { createVideoUploadPolicy } from "../lib/s3.js";
import { gradeChallengeVideo } from "../lib/assess.js";
import { textToSpeech } from "../lib/elevenlabs.js";
import { decide, normalizeItems, type ChecklistItem } from "../lib/scoring.js";
import skillsData from "../data/skills.json" with { type: "json" };
import tipsData from "../data/tips.json" with { type: "json" };
import { sendJson, sendError } from "../lib/http.js";

export const challengesRouter = Router();

// POST /api/challenges
challengesRouter.post("/", async (req, res) => {
  const schema = z.object({
    workerId: z.string().min(1),
    skillId: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", "workerId and skillId are required");
  }

  const skill = skillsData.find((s: any) => s.id === parsed.data.skillId);
  if (!skill) {
    return sendError(res, 404, "NOT_FOUND", "Skill not found in catalog");
  }

  const worker = await db.get(`WORKER#${parsed.data.workerId}`, "PROFILE");
  const lang = (worker?.lang as "en" | "hi" | "kn") || "en";

  const challengeId = `c_${crypto.randomUUID().slice(0, 8)}`;
  // Random 3 digits
  const code = String(crypto.randomInt(100, 1000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const upload = await createVideoUploadPolicy(challengeId);

  const challengeItem = {
    PK: `CHALLENGE#${challengeId}`,
    SK: "META",
    workerId: parsed.data.workerId,
    skillId: parsed.data.skillId,
    code,
    videoKey: upload.key,
    expiresAt,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  await db.put(challengeItem);

  // Spaced and spoken twice so it is easy to catch
  const spacedCode = code.split("").join("… ");
  let spokenCodeText = `Your code is ${spacedCode}. Again: ${spacedCode}.`;
  if (lang === "hi") {
    spokenCodeText = `आपका कोड है ${spacedCode}। दोबारा: ${spacedCode}।`;
  } else if (lang === "kn") {
    spokenCodeText = `ನಿಮ್ಮ ಕೋಡ್ ${spacedCode}. ಮತ್ತೊಮ್ಮೆ: ${spacedCode}.`;
  }

  const audioBase64 = await textToSpeech(spokenCodeText, lang);

  return sendJson(res, 201, {
    challengeId,
    code,
    expiresAt,
    task: (skill.task as any)[lang] || skill.task.en,
    checklist: skill.checklist,
    audioBase64,
    upload,
  });
});

// POST /api/challenges/:id/submit
challengesRouter.post("/:id/submit", async (req, res) => {
  const challengeId = req.params.id;
  const challenge = await db.get(`CHALLENGE#${challengeId}`, "META");

  if (!challenge) {
    return sendError(res, 404, "NOT_FOUND", "Challenge not found");
  }

  if (new Date() > new Date(challenge.expiresAt)) {
    return sendError(res, 400, "EXPIRED", "Challenge time window expired");
  }

  // Idempotency: if already submitted, return saved badge
  if (challenge.status === "submitted" && challenge.badgeSk) {
    const existingBadge = await db.get(`WORKER#${challenge.workerId}`, challenge.badgeSk);
    if (existingBadge) {
      return sendJson(res, 200, existingBadge);
    }
  }

  const schema = z.object({
    frames: z.array(z.string()).min(1).max(6),
    transcript: z.string().optional().default(""),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", "frames array (1-6 base64 images) is required");
  }

  const skill = skillsData.find((s: any) => s.id === challenge.skillId);
  if (!skill) {
    return sendError(res, 500, "INTERNAL", "Associated skill catalog item missing");
  }

  const worker = await db.get(`WORKER#${challenge.workerId}`, "PROFILE");
  const lang = (worker?.lang as "en" | "hi" | "kn") || "en";

  // AI Grade via Claude Bedrock
  const modelGrade = await gradeChallengeVideo(
    parsed.data.frames,
    parsed.data.transcript,
    skill.checklist as ChecklistItem[],
    challenge.code,
    lang
  );

  // AI failed: skip decide() and hold for review, never crash or auto-pass.
  const grade = modelGrade ?? {
    codeSpoken: false, items: [], score: 0, confidence: 0, replayRisk: "unclear" as const, feedback: "",
  };
  const normalizedItems = modelGrade ? normalizeItems(skill.checklist as ChecklistItem[], modelGrade.items) : [];
  const decision = modelGrade
    ? decide({ ...modelGrade, items: normalizedItems }, skill.checklist as ChecklistItem[])
    : { status: "REVIEW" as const, reasonCode: "AI_UNAVAILABLE" as const, score: 0, confidence: 0 };

  // Tip lookup from tips.json with {step} replacement
  let tip: string | null = null;
  if (decision.reasonCode !== "PASSED") {
    const rawTip = (tipsData as any)[decision.reasonCode]?.[lang] || (tipsData as any)[decision.reasonCode]?.en;
    if (rawTip) {
      const firstSafety = skill.checklist.find((c: any) => c.safetyCritical);
      const stepText = (firstSafety?.text as any)?.[lang] || firstSafety?.text?.en || "safety step";
      tip = rawTip.replace("{step}", stepText);
    }
  }

  const now = new Date().toISOString();
  const badgeSk = `BADGE#${now}#${challengeId}`;

  const badgeRecord = {
    PK: `WORKER#${challenge.workerId}`,
    SK: badgeSk,
    skillId: challenge.skillId,
    status: decision.status,
    reasonCode: decision.reasonCode,
    score: decision.score,
    confidence: decision.confidence,
    codeSpoken: grade.codeSpoken,
    replayRisk: grade.replayRisk,
    items: normalizedItems,
    feedback: grade.feedback,
    tip,
    videoKey: challenge.videoKey,
    createdAt: now,
  };

  await db.put(badgeRecord);

  // Update challenge status
  challenge.status = "submitted";
  challenge.badgeSk = badgeSk;
  await db.put(challenge);

  // Spoken feedback + tip
  const spokenText = `${grade.feedback} ${tip || ""}`.trim();
  const audioBase64 = await textToSpeech(spokenText, lang);

  return sendJson(res, 200, {
    ...badgeRecord,
    audioBase64,
  });
});
