import { Router } from "express";
import { z } from "zod";
import { transcribeAudio, textToSpeech } from "../lib/elevenlabs.js";
import { sendJson, sendError, ah } from "../lib/http.js";

export const voiceRouter = Router();

const transcribeSchema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().default("audio/webm"),
  lang: z.string().optional(),
});

voiceRouter.post("/transcribe", ah(async (req, res) => {
  const parsed = transcribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", "audioBase64 is required");
  }

  try {
    const result = await transcribeAudio(
      parsed.data.audioBase64,
      parsed.data.mimeType,
      parsed.data.lang
    );
    return sendJson(res, 200, result);
  } catch {
    // Upstream failure: the client shows "didn't catch that" and reopens the mic.
    return sendError(res, 502, "AI_FAILED", "Speech-to-text failed");
  }
}));

const ttsSchema = z.object({
  text: z.string().min(1).max(500),
  lang: z.string().default("en"),
});

voiceRouter.post("/tts", ah(async (req, res) => {
  const parsed = ttsSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "BAD_REQUEST", "text (<= 500 chars) is required");
  }

  try {
    const audioBase64 = await textToSpeech(parsed.data.text, parsed.data.lang);
    return sendJson(res, 200, { audioBase64: audioBase64 ?? null });
  } catch (err) {
    return sendError(res, 500, "INTERNAL", (err as Error).message);
  }
}));
