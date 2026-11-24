import { test } from "node:test";
import assert from "node:assert/strict";
import { aiConfigured, aiProvider } from "../src/lib/ai.js";
import { parseGrade } from "../src/lib/assess.js";

test("AI provider defaults to Claude on Bedrock and rejects unknown names", () => {
  assert.equal(aiProvider({}), "claude-bedrock");
  assert.equal(aiProvider({ AI_PROVIDER: "bedrock-converse" }), "bedrock-converse");
  assert.throws(() => aiProvider({ AI_PROVIDER: "gpt" }), /Unknown AI_PROVIDER/);
});

test("AI is configured only when the chosen provider has its settings", () => {
  assert.equal(aiConfigured({}), false);
  assert.equal(aiConfigured({ AI_MODEL_ID: "anthropic.claude-haiku-5-5", AWS_REGION: "ap-south-1" }), true);
  assert.equal(aiConfigured({ AI_PROVIDER: "openai-compatible", AI_MODEL_ID: "qwen2.5vl", AWS_REGION: "ap-south-1" }), false);
  assert.equal(aiConfigured({ AI_PROVIDER: "openai-compatible", AI_MODEL_ID: "qwen2.5vl", AI_BASE_URL: "http://localhost:11434/v1" }), true);
});

const good = {
  codeSpoken: true,
  items: [{ id: "isolate", status: "seen", evidence: "MCB switched off" }],
  score: 80,
  confidence: 0.8,
  replayRisk: "none",
  feedback: "Good",
};

test("parseGrade accepts a full answer wrapped in extra text", () => {
  const grade = parseGrade(`Here you go:\n${JSON.stringify(good)}\nDone.`);
  assert.equal(grade?.score, 80);
});

test("parseGrade rejects answers that would otherwise be filled with passing defaults", () => {
  const { score, ...noScore } = good;
  assert.equal(parseGrade(JSON.stringify(noScore)), null);
  assert.equal(parseGrade(JSON.stringify({ ...good, confidence: 7 })), null);
  assert.equal(parseGrade(JSON.stringify({ ...good, items: [{ id: "isolate", status: "maybe" }] })), null);
  assert.equal(parseGrade("not json"), null);
});
