# SkilledIN

**Voice-first skill passports for India's blue-collar workers.** A worker proves a skill with a 60-second live video challenge checked by AI, each finished job can add a customer stamp (stars + a voice note), and contractors hire nearby verified workers just by speaking.

> **"The job is the exam."**

Built by **Team Adversity** for **wHACKiest 2026** , **Track 4: UnlockED** (sub-problems #1 Skill Verification + #3 Hyper-Local Job Matching).
Powered by **ElevenLabs** (Scribe STT, multilingual TTS, Conversational Agent) and **AWS** (Lambda, DynamoDB, S3, Bedrock with Claude, Location Service, Amplify).

---

## Documentation

| Doc | What's in it |
|---|---|
| [Problem.md](Problem.md) | The problem, who it hurts, data, existing solutions and their gaps |
| [solution.md](solution.md) | The solution: features, user flows, anti-fake design, scoring, novelty, impact, business model |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical spec: repo layout, data model, API, AI prompts, infra, security |
| [docs/SETUP.md](docs/SETUP.md) | Install, configure and run on the dev laptop (Windows 11) |
| [docs/TASKS.md](docs/TASKS.md) | Build plan, owners, status, submission checklist |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decision log (what we chose and why) |
| [docs/DEMO.md](docs/DEMO.md) | Demo video script, live pitch outline, Q&A prep |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Similar projects on GitHub, how we differ, recommended features |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents (and humans) working on this repo |

## Quick start (after first-time setup in [docs/SETUP.md](docs/SETUP.md))

```powershell
npm install
npm run dev              # Starts BOTH backend (:3001) & frontend (:5173) concurrently
```

Or run each service individually:
```powershell
npm run dev:backend      # http://localhost:3001
npm run dev:frontend     # http://localhost:5173
```

## Team

| Name | Role |
|---|---|
| Syed Raiyan (Lead) | AWS backend & infra |
| Syed Junaid Khalander | Frontend & ElevenLabs voice |
| Shreyas S Kiragi | PPT, architecture diagram, demo video, README |

## Status

Hackathon MVP in progress. See [docs/TASKS.md](docs/TASKS.md).
