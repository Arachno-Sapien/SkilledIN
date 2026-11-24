// Calls the configured AI model for real, once for extraction (text) and once for grading (image).
// Usage (from backend/): npm run ai:smoke -- [modelId] [path/to/frame.jpg]
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { readFileSync } from "node:fs";
import skills from "../src/data/skills.json" with { type: "json" };
import { aiConfigured, aiProvider, complete } from "../src/lib/ai.js";
import { gradeChallengeVideo } from "../src/lib/assess.js";
import { decide, type ChecklistItem } from "../src/lib/scoring.js";

const [modelArg, imagePath] = process.argv.slice(2);
if (modelArg) process.env.AI_MODEL_ID = modelArg;

console.log(`provider=${aiProvider()} model=${process.env.AI_MODEL_ID} region=${process.env.AI_REGION || process.env.AWS_REGION}`);
if (!aiConfigured()) {
  console.error("AI is not configured: set AI_MODEL_ID and AWS_REGION (or AI_BASE_URL) in .env");
  process.exit(1);
}

// 1. Raw call: proves credentials, model access and region before anything else.
const t0 = Date.now();
const raw = await complete({ system: "Reply with the single word OK.", text: "Health check", maxTokens: 2000 });
console.log(`1 raw call OK in ${Date.now() - t0} ms -> ${JSON.stringify(raw.slice(0, 40))}`);

// 2. Grading path with one frame: proves image input and that the answer passes validation.
if (imagePath) {
  const skill = skills.find((s) => s.id === "electrician.switch_socket")!;
  const checklist = skill.checklist as ChecklistItem[];
  const frame = readFileSync(imagePath).toString("base64");
  const t1 = Date.now();
  const grade = await gradeChallengeVideo([frame], "Code 4 7 1 2. Now I switch off the MCB.", checklist, "4712", "en");
  console.log(`2 grading call in ${Date.now() - t1} ms`);
  if (!grade) {
    console.error("   answer failed validation or the call failed -> would be saved as REVIEW / AI_UNAVAILABLE (see warning above)");
    process.exit(1);
  }
  const d = decide(grade, checklist);
  console.log(`   valid answer: score=${grade.score} confidence=${grade.confidence} replayRisk=${grade.replayRisk} -> ${d.status} (${d.reasonCode})`);
  console.log(`   feedback: ${grade.feedback}`);
}
