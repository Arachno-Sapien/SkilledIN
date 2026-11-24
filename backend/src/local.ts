import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// Dynamic import: static imports are evaluated before dotenv.config() runs, so module-level env reads would miss .env.
const { app } = await import("./handler.js");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[SkilledIN API] Backend server listening at http://localhost:${PORT}`);
  console.log(`[SkilledIN API] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[SkilledIN API] Skills catalog: http://localhost:${PORT}/api/skills`);
});
