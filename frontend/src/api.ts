import { API_BASE_URL } from "./config";

export interface ApiError {
  code: string;
  message: string;
}

export type Localized = { en: string; hi: string; kn: string };

export interface ChecklistStep {
  id: string;
  safetyCritical?: boolean;
  text: Localized;
}

export interface ChallengeInfo {
  challengeId: string;
  code: string;
  expiresAt: string;
  task: string;
  checklist: ChecklistStep[];
  audioBase64: string | null;
  upload: { url: string; fields: Record<string, string>; key: string };
}

export interface ChallengeItemResult {
  id: string;
  status: "seen" | "not_seen" | "unclear";
  evidence?: string;
  text?: Localized;
}

export interface ChallengeResult {
  status: "PASS" | "FAIL" | "REVIEW";
  reasonCode?: string;
  skillId: string;
  score: number;
  items: ChallengeItemResult[];
  feedback: string;
  tip: string | null;
  title?: Localized;
  createdAt?: string;
  audioBase64?: string | null;
}

// AbortSignal.timeout() is missing on older Android WebViews; a controller + timer works everywhere.
export function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// Long enough for Bedrock/ElevenLabs calls, short enough that a dead connection reaches the retry UI.
const DEFAULT_TIMEOUT_MS = 60_000;

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal ?? timeoutSignal(timeoutMs),
    });
  } catch {
    // fetch only rejects when no answer arrived (offline, DNS, CORS, timeout): pages show "check your internet".
    const error: ApiError = { code: "NETWORK", message: "Network request failed" };
    throw error;
  }

  // A proxy error page or an empty 502 is not JSON; keep a code the pages can map instead of a SyntaxError.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error: ApiError =
      data?.error?.code
        ? data.error
        : { code: "UNKNOWN_ERROR", message: `Request failed with status ${response.status}` };
    throw error;
  }
  if (data === null) {
    const error: ApiError = { code: "UNKNOWN_ERROR", message: "Response was not JSON" };
    throw error;
  }

  return data as T;
}

export const api = {
  getHealth: () => request<{ ok: boolean; store?: "dynamodb" | "memory" }>("/api/health"),

  getSkills: (trade?: string) =>
    request<any[]>(`/api/skills${trade ? `?trade=${encodeURIComponent(trade)}` : ""}`),

  transcribeVoice: (audioBase64: string, mimeType?: string, lang?: string) =>
    request<{ text: string; languageCode?: string }>("/api/voice/transcribe", {
      method: "POST",
      body: JSON.stringify({ audioBase64, mimeType, lang }),
    }),

  getTts: (text: string, lang: string) =>
    request<{ audioBase64: string }>("/api/voice/tts", {
      method: "POST",
      body: JSON.stringify({ text, lang }),
    }),

  parseWorkerSpeech: (transcript: string, lang: string) =>
    request<{
      name: string | null;
      trade: "electrician" | "plumber" | "mason" | "other";
      area: string | null;
      confidence: number;
      readBack: string;
      audioBase64: string | null;
    }>("/api/workers/parse", {
      method: "POST",
      body: JSON.stringify({ transcript, lang }),
    }),

  createWorker: (data: {
    name: string;
    phone: string;
    trade: string;
    area: string;
    lang: string;
  }) =>
    request<any>("/api/workers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getWorkerPassport: (id: string) => request<any>(`/api/workers/${id}`),

  getWorkerOffers: (id: string) => request<any[]>(`/api/workers/${id}/offers`),

  // lang is the language on screen now; it overrides the language stored at registration.
  createChallenge: (workerId: string, skillId: string, lang: string) =>
    request<ChallengeInfo>("/api/challenges", {
      method: "POST",
      body: JSON.stringify({ workerId, skillId, lang }),
    }),

  // The server transcribes `audio` itself (client transcripts are not trusted for the code check).
  // 130 s: longer than the 120 s Lambda timeout plus AI retries. Safe to retry: submit is idempotent.
  submitChallenge: (
    challengeId: string,
    frames: string[],
    audio?: { audioBase64: string; mimeType: string }
  ) =>
    request<ChallengeResult>(
      `/api/challenges/${challengeId}/submit`,
      {
        method: "POST",
        body: JSON.stringify({
          frames,
          audioBase64: audio?.audioBase64,
          mimeType: audio?.mimeType,
        }),
      },
      130_000
    ),

  createJob: (data: {
    trade: string;
    count: number;
    area: string;
    date: string;
    wage: number;
    contractorPhone: string;
    contractorName?: string;
  }) =>
    request<{ job: any; matches: any[] }>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getJob: (jobId: string) =>
    request<{ job: any; acceptedWorkers: any[] }>(`/api/jobs/${jobId}`),

  acceptJob: (jobId: string, workerId: string) =>
    request<any>(`/api/jobs/${jobId}/accept`, {
      method: "POST",
      body: JSON.stringify({ workerId }),
    }),

  createStamp: (data: {
    workerId: string;
    rating: number;
    audioBase64?: string;
    mimeType?: string;
    customerName?: string;
  }) =>
    request<any>("/api/stamps", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
