import { app } from "../src/handler.js";

const server = app.listen(3015, async () => {
  try {
    const health = await fetch("http://localhost:3015/api/health").then((r) => r.json());
    console.log("HEALTH_OK:", health.ok);

    const skills = await fetch("http://localhost:3015/api/skills").then((r) => r.json());
    console.log("SKILLS_COUNT:", skills.length);

    const electricianSkills = await fetch("http://localhost:3015/api/skills?trade=electrician").then((r) => r.json());
    console.log("ELECTRICIAN_SKILLS:", electricianSkills[0]?.id);

    const otherSkills = await fetch("http://localhost:3015/api/skills?trade=other").then((r) => r.json());
    console.log("OTHER_TRADE_SKILLS_EMPTY:", otherSkills.length === 0);

    console.log("ALL_ENDPOINTS_VERIFIED");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
});
