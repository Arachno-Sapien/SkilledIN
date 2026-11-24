import { Router } from "express";
import skillsData from "../data/skills.json" with { type: "json" };
import { sendJson } from "../lib/http.js";

export const skillsRouter = Router();

skillsRouter.get("/", (req, res) => {
  const trade = req.query.trade as string | undefined;

  if (trade === "other") {
    return sendJson(res, 200, []);
  }

  if (trade) {
    const filtered = skillsData.filter((s: any) => s.trade === trade);
    return sendJson(res, 200, filtered);
  }

  return sendJson(res, 200, skillsData);
});
