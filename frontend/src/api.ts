import { API_BASE_URL } from "./config";

export interface ApiError {
  code: string;
  message: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    const error: ApiError = data.error || {
      code: "UNKNOWN_ERROR",
      message: `Request failed with status ${response.status}`,
    };
    throw error;
  }

  return data as T;
}

export const api = {
  getHealth: () => request<{ ok: boolean }>("/api/health"),

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

  createChallenge: (workerId: string, skillId: string) =>
    request<{
      challengeId: string;
      code: string;
      expiresAt: string;
      task: string;
      checklist: any[];
      audioBase64: string | null;
      upload: { url: string; fields: Record<string, string>; key: string };
    }>("/api/challenges", {
      method: "POST",
      body: JSON.stringify({ workerId, skillId }),
    }),

  submitChallenge: (
    challengeId: string,
    frames: string[],
    transcript?: string
  ) =>
    request<any>(`/api/challenges/${challengeId}/submit`, {
      method: "POST",
      body: JSON.stringify({ frames, transcript }),
    }),

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
