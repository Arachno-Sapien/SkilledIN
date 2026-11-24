import { db } from "../src/lib/db.js";
import { geocode } from "../src/lib/geo.js";
import { normalisePhone } from "../src/lib/phone.js";

interface SeedWorker {
  id: string;
  name: string;
  phone: string;
  trade: "electrician" | "plumber" | "mason";
  area: string;
  lang: "en" | "hi" | "kn";
  badges: Array<{
    skillId: string;
    daysAgo: number;
    score: number;
  }>;
  stamps: Array<{
    rating: number;
    quote: string;
    customerName: string;
    daysAgo: number;
  }>;
}

const SEED_WORKERS: SeedWorker[] = [
  {
    id: "w_ravi_elec",
    name: "Ravi Kumar",
    phone: "9845012301",
    trade: "electrician",
    area: "Jayanagar",
    lang: "kn",
    badges: [
      { skillId: "electrician.switch_socket", daysAgo: 5, score: 92 },
    ],
    stamps: [
      { rating: 5, quote: "Excellent wiring work, very clean and neat finish.", customerName: "Anand M", daysAgo: 3 },
      { rating: 5, quote: "Switched MCB panel and fixed living room sockets on time.", customerName: "Priya Rao", daysAgo: 1 },
      { rating: 4, quote: "Professional electrician with complete safety tools.", customerName: "Venkatesh K", daysAgo: 2 }
    ],
  },
  {
    id: "w_manjunath_elec",
    name: "Manjunath S",
    phone: "9845012302",
    trade: "electrician",
    area: "BTM Layout",
    lang: "kn",
    badges: [
      { skillId: "electrician.switch_socket", daysAgo: 2, score: 88 },
    ],
    stamps: [], // Cold-start case: verified worker with 0 customer ratings
  },
  {
    id: "w_ramesh_plumb",
    name: "Ramesh Naik",
    phone: "9845012303",
    trade: "plumber",
    area: "Koramangala",
    lang: "kn",
    badges: [
      { skillId: "plumber.tap_washer", daysAgo: 12, score: 90 },
    ],
    stamps: [
      { rating: 5, quote: "Fixed bathroom pipe leakage with PTFE tape perfectly.", customerName: "Deepak S", daysAgo: 10 },
      { rating: 5, quote: "Quick response and very reasonable charges.", customerName: "Sunita G", daysAgo: 6 }
    ],
  },
  {
    id: "w_mohammed_plumb",
    name: "Mohammed Farooq",
    phone: "9845012304",
    trade: "plumber",
    area: "Indiranagar",
    lang: "hi",
    badges: [
      { skillId: "plumber.tap_washer", daysAgo: 1, score: 95 },
    ],
    stamps: [
      { rating: 5, quote: "Kitchen tap washer replaced in 15 minutes, zero leak.", customerName: "Rajeev N", daysAgo: 1 },
      { rating: 4, quote: "Good work done cleanly.", customerName: "Sanjay B", daysAgo: 1 }
    ],
  },
  {
    id: "w_shankar_mason",
    name: "Shankarappa G",
    phone: "9845012305",
    trade: "mason",
    area: "Rajajinagar",
    lang: "kn",
    badges: [
      { skillId: "mason.brick_course", daysAgo: 25, score: 85 },
    ],
    stamps: [
      { rating: 5, quote: "Straight wall alignment with perfect spirit level accuracy.", customerName: "Mahesh P", daysAgo: 20 },
      { rating: 5, quote: "Very experienced mestri, works fast with solid mortar joints.", customerName: "Kishore R", daysAgo: 15 }
    ],
  },
  {
    id: "w_suresh_mason",
    name: "Suresh Mistri",
    phone: "9845012306",
    trade: "mason",
    area: "Yeshwanthpur",
    lang: "hi",
    badges: [
      { skillId: "mason.brick_course", daysAgo: 95, score: 80 }, // Freshness test: > 90 days ago
    ],
    stamps: [
      { rating: 4, quote: "Built compound brick wall steadily.", customerName: "Naveen T", daysAgo: 90 }
    ],
  },
  {
    id: "w_anil_unverified",
    name: "Anil Yadav",
    phone: "9845012307",
    trade: "electrician",
    area: "Jayanagar",
    lang: "hi",
    badges: [], // Unverified worker profile
    stamps: [],
  },
  {
    id: "w_govind_unverified",
    name: "Govind Raju",
    phone: "9845012308",
    trade: "plumber",
    area: "Basavanagudi",
    lang: "kn",
    badges: [], // Unverified worker profile
    stamps: [],
  }
];

async function seed() {
  console.log("Seeding SkilledIN fictional workers and verification data...");

  for (const worker of SEED_WORKERS) {
    const geo = await geocode(worker.area);
    const lat = geo?.lat || 12.9308;
    const lng = geo?.lng || 77.5838;
    const cleanPhone = normalisePhone(worker.phone);

    const now = new Date();
    const createdAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const profile = {
      PK: `WORKER#${worker.id}`,
      SK: "PROFILE",
      type: "worker",
      id: worker.id,
      name: worker.name,
      phone: cleanPhone,
      trade: worker.trade,
      area: worker.area,
      lat,
      lng,
      lang: worker.lang,
      createdAt,
    };

    const phoneLock = {
      PK: `PHONE#${cleanPhone}`,
      SK: "PHONE",
      workerId: worker.id,
      createdAt,
    };

    await db.transactWorkerAndPhone(profile, phoneLock);

    // Seed Badges
    for (const badge of worker.badges) {
      const badgeTime = new Date(now.getTime() - badge.daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const badgeSk = `BADGE#${badgeTime}#c_seed_${badge.skillId.replace(".", "_")}`;

      await db.put({
        PK: `WORKER#${worker.id}`,
        SK: badgeSk,
        skillId: badge.skillId,
        status: "PASS",
        reasonCode: "PASSED",
        score: badge.score,
        confidence: 0.95,
        codeSpoken: true,
        replayRisk: "none",
        items: [
          { id: "step1", status: "seen", evidence: "Demonstrated accurately" },
          { id: "step2", status: "seen", evidence: "Safety check confirmed" }
        ],
        feedback: "Task demonstrated safely with all required safety standards.",
        tip: null,
        videoKey: `videos/seed_${worker.id}`,
        createdAt: badgeTime,
      });
    }

    // Seed Stamps
    for (let i = 0; i < worker.stamps.length; i++) {
      const s = worker.stamps[i];
      const stampTime = new Date(now.getTime() - s.daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const stampId = `s_seed_${worker.id}_${i}`;

      await db.put({
        PK: `WORKER#${worker.id}`,
        SK: `STAMP#${stampTime}#${stampId}`,
        stampId,
        rating: s.rating,
        quote: s.quote,
        customerName: s.customerName,
        createdAt: stampTime,
      });
    }
  }

  console.log("Seeded 8 workers across trades (electrician, plumber, mason) and localities.");
  console.log("SEED_SUCCESS");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
