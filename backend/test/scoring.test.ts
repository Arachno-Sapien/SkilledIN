import test from "node:test";
import assert from "node:assert/strict";
import {
  decide,
  normalizeItems,
  computeTrustLevel,
  computeAvgRating,
  computeRankScore,
  buildMatchReason,
  haversineDistanceKm,
  REPLAY_RULE,
  type ChecklistItem,
  type ModelGrade,
} from "../src/lib/scoring.js";
import { normalisePhone } from "../src/lib/phone.js";

const sampleChecklist: ChecklistItem[] = [
  {
    id: "power_off",
    safetyCritical: true,
    text: { en: "Power off", hi: "पावर बंद", kn: "ಪವರ್ ಆಫ್" },
  },
  {
    id: "tester",
    safetyCritical: true,
    text: { en: "Tester used", hi: "टेस्टर उपयोग", kn: "ಟೆಸ್ಟರ್ ಬಳಕೆ" },
  },
  {
    id: "terminals",
    safetyCritical: false,
    text: { en: "Terminals tight", hi: "टर्मिनल कसे", kn: "ಟರ್ಮಿನಲ್ ಬಿಗಿಗೊಳಿಸಲಾಗಿದೆ" },
  },
];

test("Rule 1: NO_CODE fails when codeSpoken is false", () => {
  const grade: ModelGrade = {
    codeSpoken: false,
    items: [
      { id: "power_off", status: "seen", evidence: "yes" },
      { id: "tester", status: "seen", evidence: "yes" },
      { id: "terminals", status: "seen", evidence: "yes" },
    ],
    score: 95,
    confidence: 0.95,
    replayRisk: "none",
    feedback: "All steps visible",
  };
  const result = decide(grade, sampleChecklist);
  assert.equal(result.status, "FAIL");
  assert.equal(result.reasonCode, "NO_CODE");
});

test("Rule 2: SAFETY_MISSED fails when a safety critical item is not_seen", () => {
  const grade: ModelGrade = {
    codeSpoken: true,
    items: [
      { id: "power_off", status: "not_seen", evidence: "skipped" },
      { id: "tester", status: "seen", evidence: "yes" },
      { id: "terminals", status: "seen", evidence: "yes" },
    ],
    score: 80,
    confidence: 0.9,
    replayRisk: "none",
    feedback: "Missed power off",
  };
  const result = decide(grade, sampleChecklist);
  assert.equal(result.status, "FAIL");
  assert.equal(result.reasonCode, "SAFETY_MISSED");
});

test("Rule 3: SAFETY_UNCLEAR gives REVIEW when safety item is unclear (beats high score)", () => {
  const grade: ModelGrade = {
    codeSpoken: true,
    items: [
      { id: "power_off", status: "unclear", evidence: "shadowed" },
      { id: "tester", status: "seen", evidence: "yes" },
      { id: "terminals", status: "seen", evidence: "yes" },
    ],
    score: 92,
    confidence: 0.9,
    replayRisk: "none",
    feedback: "Power off unclear",
  };
  const result = decide(grade, sampleChecklist);
  assert.equal(result.status, "REVIEW");
  assert.equal(result.reasonCode, "SAFETY_UNCLEAR");
});

test("Normalisation: Missing safety item in model output becomes unclear -> REVIEW", () => {
  const grade: ModelGrade = {
    codeSpoken: true,
    items: [
      // "power_off" omitted by model
      { id: "tester", status: "seen", evidence: "yes" },
      { id: "terminals", status: "seen", evidence: "yes" },
    ],
    score: 85,
    confidence: 0.9,
    replayRisk: "none",
    feedback: "Evaluated",
  };
  const normalized = normalizeItems(sampleChecklist, grade.items);
  assert.equal(normalized.find((i) => i.id === "power_off")?.status, "unclear");

  const result = decide(grade, sampleChecklist);
  assert.equal(result.status, "REVIEW");
  assert.equal(result.reasonCode, "SAFETY_UNCLEAR");
});

test("Rule 4: REPLAY_SUSPECTED gives REVIEW when replayRisk is screen_or_photo (beats high score)", () => {
  if (!REPLAY_RULE) return;
  const grade: ModelGrade = {
    codeSpoken: true,
    items: [
      { id: "power_off", status: "seen", evidence: "yes" },
      { id: "tester", status: "seen", evidence: "yes" },
      { id: "terminals", status: "seen", evidence: "yes" },
    ],
    score: 95,
    confidence: 0.9,
    replayRisk: "screen_or_photo",
    feedback: "High score but looks like laptop screen",
  };
  const result = decide(grade, sampleChecklist);
  assert.equal(result.status, "REVIEW");
  assert.equal(result.reasonCode, "REPLAY_SUSPECTED");
});

test("Rule 5: LOW_CONFIDENCE gives REVIEW when confidence < 0.5", () => {
  const grade: ModelGrade = {
    codeSpoken: true,
    items: [
      { id: "power_off", status: "seen", evidence: "yes" },
      { id: "tester", status: "seen", evidence: "yes" },
      { id: "terminals", status: "seen", evidence: "yes" },
    ],
    score: 80,
    confidence: 0.42,
    replayRisk: "none",
    feedback: "Dark lighting",
  };
  const result = decide(grade, sampleChecklist);
  assert.equal(result.status, "REVIEW");
  assert.equal(result.reasonCode, "LOW_CONFIDENCE");
});

test("Rule 6: PASSED succeeds when score >= 60 and all criteria met", () => {
  const grade: ModelGrade = {
    codeSpoken: true,
    items: [
      { id: "power_off", status: "seen", evidence: "yes" },
      { id: "tester", status: "seen", evidence: "yes" },
      { id: "terminals", status: "seen", evidence: "yes" },
    ],
    score: 75,
    confidence: 0.85,
    replayRisk: "none",
    feedback: "Good wiring",
  };
  const result = decide(grade, sampleChecklist);
  assert.equal(result.status, "PASS");
  assert.equal(result.reasonCode, "PASSED");
});

test("Rule 7: LOW_SCORE fails when score < 60", () => {
  const grade: ModelGrade = {
    codeSpoken: true,
    items: [
      { id: "power_off", status: "seen", evidence: "yes" },
      { id: "tester", status: "seen", evidence: "yes" },
      { id: "terminals", status: "not_seen", evidence: "no" },
    ],
    score: 52,
    confidence: 0.85,
    replayRisk: "none",
    feedback: "Incomplete",
  };
  const result = decide(grade, sampleChecklist);
  assert.equal(result.status, "FAIL");
  assert.equal(result.reasonCode, "LOW_SCORE");
});

test("Matching rank: worker with 0 stamps uses neutral 3.5 rating (no NaN) and ranks above a 2★ worker", () => {
  const level = 1;
  const distanceKm = 2.0;

  const scoreZeroStamps = computeRankScore(level, null, distanceKm); // 1*30 + 3.5*10 - 2*2 = 30 + 35 - 4 = 61
  const scoreLowStamps = computeRankScore(level, 2.0, distanceKm);   // 1*30 + 2.0*10 - 2*2 = 30 + 20 - 4 = 46

  assert.equal(Number.isNaN(scoreZeroStamps), false);
  assert.ok(scoreZeroStamps > scoreLowStamps, "Worker with no stamps should rank higher than worker with 2★ rating");
});

test("Trust level computation", () => {
  assert.equal(computeTrustLevel(0, []), 0);
  assert.equal(computeTrustLevel(1, []), 1);
  assert.equal(computeTrustLevel(1, [{ rating: 5 }, { rating: 4 }, { rating: 4 }]), 2);
  assert.equal(computeTrustLevel(1, [{ rating: 2 }, { rating: 3 }]), 1); // < 3 stamps or avg < 4.0
  const tenStamps = Array(10).fill({ rating: 5 });
  assert.equal(computeTrustLevel(2, tenStamps), 3);
});

test("Average rating computation", () => {
  assert.equal(computeAvgRating([]), null);
  assert.equal(computeAvgRating([{ rating: 4 }, { rating: 5 }]), 4.5);
});

test("Haversine distance calculation", () => {
  // Jayanagar to Koramangala (~5 km)
  const d = haversineDistanceKm(12.9308, 77.5838, 12.9352, 77.6245);
  assert.ok(d > 4 && d < 6, `Distance should be ~4.5 km, got ${d}`);
});

test("Match reason formatting", () => {
  const reason = buildMatchReason({
    latestSkillTitle: "Switch wiring",
    badgeDaysAgo: 5,
    avgRating: 4.8,
    stampCount: 4,
    distanceKm: 1.5,
    verified: true,
  });
  assert.equal(reason, "Switch wiring check passed 5 days ago, 4.8★ from 4 customers, 1.5 km away");

  const unverifiedReason = buildMatchReason({
    avgRating: null,
    stampCount: 0,
    distanceKm: 2.1,
    verified: false,
  });
  assert.equal(unverifiedReason, "Not verified yet, 2.1 km away");
});

test("Phone normalisation tests", () => {
  assert.equal(normalisePhone("+91 9876543210"), "9876543210");
  assert.equal(normalisePhone("+91-98765-43210"), "9876543210");
  assert.equal(normalisePhone("919876543210"), "9876543210");
  assert.equal(normalisePhone("09876543210"), "9876543210");
  assert.equal(normalisePhone("9876543210"), "9876543210");
  assert.equal(normalisePhone(" 8123456789 "), "8123456789");

  // Invalid cases
  assert.throws(() => normalisePhone("98765432101"), /Phone must be a valid 10-digit/); // 11 digits without 0
  assert.throws(() => normalisePhone("5876543210"), /starting with 6-9/); // starts with 5
  assert.throws(() => normalisePhone("+1 9876543210"), /Invalid country code/); // not +91
});
