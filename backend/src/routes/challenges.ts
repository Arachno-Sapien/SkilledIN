import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { db } from "../lib/db.js";
import { confirmVideoExists, createVideoUploadPolicy } from "../lib/s3.js";
import { gradeChallengeVideo } from "../lib/assess.js";
import { textToSpeech, transcribeAudio } from "../lib/elevenlabs.js";
import { decide, normalizeItems, type ChecklistItem } from "../lib/scoring.js";
import { withSkillText } from "../lib/passport.js";
import skillsData from "../data/skills.json" with { type: "json" };
import tipsData from "../data/tips.json" with { type: "json" };
import { sendJson, sendError, ah } from "../lib/http.js";

export const challengesRouter = Router();

const LangEnum = z.enum(["en", "hi", "kn"]);
type Lang = z.infer<typeof LangEnum>;
const toLang = (v: unknown): Lang => LangEnum.safeParse(v).data ?? "en";

// POST /api/challenges
// Every call is a new challenge (new code, upload policy and expiry), which is what makes a retake work.
challengesRouter.post("/", ah(async (req, res) => {
  const schema = z.object({
    workerId: z.string().min(1),
    skillId: z.string().min(1),
    lang: LangEnum.optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", "workerId and skillId are required");
  }

  const skill = skillsData.find((s) => s.id === parsed.data.skillId);
  if (!skill) {
    return sendError(res, 404, "NOT_FOUND", "Skill not found in catalog");
  }

  const worker = await db.get(`WORKER#${parsed.data.workerId}`, "PROFILE");
  // A badge for a worker that was never stored would be invisible; tell the client to register again.
  if (!worker) {
    return sendError(res, 404, "NOT_FOUND", "Worker not found");
  }
  // The language on screen now wins over the one saved at registration; it stays fixed for this challenge.
  const lang = parsed.data.lang ?? toLang(worker.lang);

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
    lang,
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
    task: skill.task[lang] || skill.task.en,
    checklist: skill.checklist,
    audioBase64,
    upload,
  });
}));

// POST /api/challenges/:id/submit
challengesRouter.post("/:id/submit", ah(async (req, res) => {
  const challengeId = req.params.id;
  const challenge = await db.get(`CHALLENGE#${challengeId}`, "META");

  if (!challenge) {
    return sendError(res, 404, "NOT_FOUND", "Challenge not found");
  }

  // Idempotency before the expiry check: a client retry after a slow grade gets the saved result, not EXPIRED.
  if (challenge.status === "submitted" && challenge.badgeSk) {
    const existingBadge = await db.get(`WORKER#${challenge.workerId}`, challenge.badgeSk);
    if (existingBadge) {
      return sendJson(res, 200, withSkillText(existingBadge));
    }
  }

  if (new Date() > new Date(challenge.expiresAt)) {
    return sendError(res, 400, "EXPIRED", "Challenge time window expired");
  }

  // Any client "transcript" field is ignored (zod strips it): it could simply claim the code was said.
  const schema = z.object({
    frames: z.array(z.string()).min(1).max(6),
    audioBase64: z.string().min(1).optional(),
    mimeType: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", "frames array (1-6 base64 images) is required");
  }

  const skill = skillsData.find((s) => s.id === challenge.skillId);
  if (!skill) {
    return sendError(res, 500, "INTERNAL", "Associated skill catalog item missing");
  }

  // A badge must point at evidence that exists; no-op without BUCKET_NAME (local dev).
  if (!(await confirmVideoExists(challenge.videoKey))) {
    return sendError(res, 400, "VIDEO_MISSING", "The video has not been uploaded yet");
  }

  const worker = await db.get(`WORKER#${challenge.workerId}`, "PROFILE");
  const lang = toLang(challenge.lang ?? worker?.lang);

  // The server transcribes the worker's own audio, so the "code spoken" check rests on what was really said.
  let transcript = "";
  let sttFailed = false;
  if (parsed.data.audioBase64) {
    try {
      console.log(JSON.stringify({ level: "info", msg: "transcribe_audio_received", challengeId }));
      transcript = (await transcribeAudio(parsed.data.audioBase64, parsed.data.mimeType || "audio/webm", lang)).text;
    } catch (err) {
      sttFailed = true;
      console.warn(JSON.stringify({ level: "warn", msg: "challenge_stt_failed", challengeId, error: (err as Error).message }));
    }
  }

  const checklist = skill.checklist as ChecklistItem[];
  // An STT outage must not turn into NO_CODE FAIL: skip grading and hold for review like any AI outage.
  const modelGrade = sttFailed
    ? null
    : await gradeChallengeVideo(parsed.data.frames, transcript, checklist, challenge.code, lang);

  // AI failed: skip decide() and hold for review, never crash or auto-pass.
  const grade = modelGrade ?? {
    codeSpoken: false, items: [], score: 0, confidence: 0, replayRisk: "unclear" as const, feedback: "",
  };
  const normalizedItems = modelGrade ? normalizeItems(checklist, modelGrade.items) : [];
  const decision = modelGrade
    ? decide({ ...modelGrade, items: normalizedItems }, checklist)
    : { status: "REVIEW" as const, reasonCode: "AI_UNAVAILABLE" as const, score: 0, confidence: 0 };

  // Tip lookup from tips.json with {step} replacement
  let tip: string | null = null;
  if (decision.reasonCode !== "PASSED") {
    const tips = tipsData as Record<string, Record<Lang, string> | undefined>;
    const rawTip = tips[decision.reasonCode]?.[lang] || tips[decision.reasonCode]?.en;
    if (rawTip) {
      const firstSafety = checklist.find((c) => c.safetyCritical);
      const stepText = firstSafety?.text[lang] || firstSafety?.text.en || "safety step";
      tip = rawTip.replace("{step}", stepText);
    }
  }

  const now = new Date().toISOString();
  const badgeSk = `BADGE#${now}#${challengeId}`;

  const badgeRecord = {
    PK: `WORKER#${challenge.workerId}`,
    SK: badgeSk,
    skillId: challenge.skillId as string,
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
  const audioBase64 = spokenText ? await textToSpeech(spokenText, lang) : null;

  return sendJson(res, 200, {
    ...withSkillText(badgeRecord),
    audioBase64,
  });
}));
