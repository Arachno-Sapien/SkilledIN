export const REPLAY_RULE = true;

export type StepStatus = "seen" | "not_seen" | "unclear";
export type GradeStatus = "PASS" | "FAIL" | "REVIEW";
export type ReasonCode =
  | "NO_CODE"
  | "SAFETY_MISSED"
  | "SAFETY_UNCLEAR"
  | "REPLAY_SUSPECTED"
  | "LOW_CONFIDENCE"
  | "PASSED"
  | "LOW_SCORE"
  | "AI_UNAVAILABLE";

export interface ChecklistItem {
  id: string;
  safetyCritical: boolean;
  text: { en: string; hi: string; kn: string };
}

export interface ModelItem {
  id: string;
  status: StepStatus;
  evidence: string;
}

export interface ModelGrade {
  codeSpoken: boolean;
  items: ModelItem[];
  score: number;
  confidence: number;
  replayRisk: "none" | "screen_or_photo" | "unclear";
  feedback: string;
}

const STATUS_SEVERITY: Record<StepStatus, number> = {
  not_seen: 3,
  unclear: 2,
  seen: 1,
};

/**
 * Normalises model-reported checklist items against the canonical checklist definition.
 * - Exactly one entry per checklist id, in canonical checklist order.
 * - Missing id -> status "unclear" with evidence "not reported".
 * - Duplicate ids -> worst status wins (not_seen > unclear > seen).
 * - Extra ids not in the checklist are dropped.
 */
export function normalizeItems(checklist: ChecklistItem[], reportedItems: ModelItem[]): ModelItem[] {
  const itemMap = new Map<string, ModelItem>();

  for (const item of reportedItems) {
    if (!checklist.some((c) => c.id === item.id)) {
      continue;
    }
    const existing = itemMap.get(item.id);
    if (!existing) {
      itemMap.set(item.id, { ...item });
    } else {
      const existingSev = STATUS_SEVERITY[existing.status] || 0;
      const currentSev = STATUS_SEVERITY[item.status] || 0;
      if (currentSev > existingSev) {
        itemMap.set(item.id, { ...item });
      }
    }
  }

  return checklist.map((crit) => {
    const found = itemMap.get(crit.id);
    if (found) {
      return found;
    }
    return {
      id: crit.id,
      status: "unclear" as StepStatus,
      evidence: "not reported",
    };
  });
}

/**
 * 7 ordered badge decision rules:
 * 1 NO_CODE            FAIL    codeSpoken == false
 * 2 SAFETY_MISSED      FAIL    any safetyCritical item == "not_seen"
 * 3 SAFETY_UNCLEAR     REVIEW  any safetyCritical item == "unclear"
 * 4 REPLAY_SUSPECTED   REVIEW  replayRisk == "screen_or_photo" (when REPLAY_RULE = true)
 * 5 LOW_CONFIDENCE     REVIEW  confidence < 0.5
 * 6 PASSED             PASS    score >= 60
 * 7 LOW_SCORE          FAIL    otherwise
 */
export function decide(
  grade: ModelGrade,
  checklist: ChecklistItem[]
): {
  status: GradeStatus;
  reasonCode: ReasonCode;
  score: number;
  confidence: number;
} {
  const score = Math.max(0, Math.min(100, Math.round(grade.score)));
  const confidence = Math.max(0, Math.min(1, Number(grade.confidence.toFixed(2))));

  const normalized = normalizeItems(checklist, grade.items);
  const safetyMap = new Map(checklist.map((c) => [c.id, c.safetyCritical]));

  // 1. NO_CODE
  if (!grade.codeSpoken) {
    return { status: "FAIL", reasonCode: "NO_CODE", score, confidence };
  }

  // 2. SAFETY_MISSED
  const hasSafetyMissed = normalized.some(
    (item) => safetyMap.get(item.id) && item.status === "not_seen"
  );
  if (hasSafetyMissed) {
    return { status: "FAIL", reasonCode: "SAFETY_MISSED", score, confidence };
  }

  // 3. SAFETY_UNCLEAR
  const hasSafetyUnclear = normalized.some(
    (item) => safetyMap.get(item.id) && item.status === "unclear"
  );
  if (hasSafetyUnclear) {
    return { status: "REVIEW", reasonCode: "SAFETY_UNCLEAR", score, confidence };
  }

  // 4. REPLAY_SUSPECTED (gated by REPLAY_RULE)
  if (REPLAY_RULE && grade.replayRisk === "screen_or_photo") {
    return { status: "REVIEW", reasonCode: "REPLAY_SUSPECTED", score, confidence };
  }

  // 5. LOW_CONFIDENCE
  if (confidence < 0.5) {
    return { status: "REVIEW", reasonCode: "LOW_CONFIDENCE", score, confidence };
  }

  // 6. PASSED
  if (score >= 60) {
    return { status: "PASS", reasonCode: "PASSED", score, confidence };
  }

  // 7. LOW_SCORE
  return { status: "FAIL", reasonCode: "LOW_SCORE", score, confidence };
}

/**
 * Computes trust level:
 * Level 0: Registered (no PASS badges)
 * Level 1: Verified (>= 1 PASS badge)
 * Level 2: Experienced (>= 1 PASS badge + >= 3 stamps with avg rating >= 4.0)
 * Level 3: Master (>= 2 PASS badges + >= 10 stamps with avg rating >= 4.5)
 */
export function computeTrustLevel(
  passBadgeCount: number,
  stamps: { rating: number }[]
): number {
  if (passBadgeCount < 1) return 0;

  const avg = computeAvgRating(stamps);
  const count = stamps.length;

  if (passBadgeCount >= 2 && count >= 10 && avg !== null && avg >= 4.5) {
    return 3;
  }
  if (passBadgeCount >= 1 && count >= 3 && avg !== null && avg >= 4.0) {
    return 2;
  }
  return 1;
}

export function computeAvgRating(stamps: { rating: number }[]): number | null {
  if (!stamps || stamps.length === 0) return null;
  const sum = stamps.reduce((acc, s) => acc + s.rating, 0);
  return Number((sum / stamps.length).toFixed(1));
}

export function daysAgo(isoDate: string): number {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Haversine formula for distance in kilometres between two coordinates.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Matching rank score:
 * level × 30 + (avgRating ?? 3.5) × 10 − distanceKm × 2
 */
export function computeRankScore(
  level: number,
  avgRating: number | null,
  distanceKm: number
): number {
  const ratingWeight = avgRating ?? 3.5;
  return level * 30 + ratingWeight * 10 - distanceKm * 2;
}

/**
 * Build spoken/rendered reason per match:
 * e.g. "Wiring check passed 12 days ago, 4.6★ from 3 customers, 2.1 km away"
 * unverified -> "Not verified yet, 1.4 km away"
 */
export function buildMatchReason(worker: {
  latestSkillTitle?: string;
  badgeDaysAgo?: number;
  avgRating: number | null;
  stampCount: number;
  distanceKm: number;
  verified: boolean;
}): string {
  if (!worker.verified) {
    return `Not verified yet, ${worker.distanceKm} km away`;
  }

  const parts: string[] = [];
  if (worker.latestSkillTitle) {
    const age =
      worker.badgeDaysAgo === 0
        ? "today"
        : `${worker.badgeDaysAgo} days ago`;
    parts.push(`${worker.latestSkillTitle} check passed ${age}`);
  } else {
    parts.push("Verified skill check passed");
  }

  if (worker.avgRating !== null && worker.stampCount > 0) {
    parts.push(`${worker.avgRating}★ from ${worker.stampCount} customer${worker.stampCount > 1 ? "s" : ""}`);
  } else {
    parts.push("no customer ratings yet");
  }

  parts.push(`${worker.distanceKm} km away`);
  return parts.join(", ");
}
