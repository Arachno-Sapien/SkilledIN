import skillsData from "../data/skills.json" with { type: "json" };

// DB items are loosely typed single-table records.
type Item = Record<string, any>;

/** What any caller may see about a worker: never the phone number or storage keys. */
export function publicProfile(p: Item) {
  return { id: p.id, name: p.name, trade: p.trade, area: p.area, lang: p.lang, createdAt: p.createdAt };
}

const normName = (s: string) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();

/**
 * A worker who lost their phone or cleared the browser re-registers with the same phone; if the name
 * also matches, give them their existing passport back instead of a dead-end CONFLICT.
 * ponytail: phone + name is not authentication (anyone knowing both can open this passport's owner view) — add OTP before a real launch (AGENTS §10).
 */
export function recoverRegistration(existing: Item | null, submittedName: string) {
  if (!existing || typeof existing.name !== "string" || !normName(submittedName)) return null;
  return normName(existing.name) === normName(submittedName) ? { ...publicProfile(existing), existing: true as const } : null;
}

/**
 * Adds the skill title and each checklist step's text (en/hi/kn) from skills.json so the client can show
 * the badge in the chosen language. Looked up per response, not stored, so catalog edits show everywhere.
 */
export function withSkillText<T extends Item>(badge: T) {
  const skill = skillsData.find((s) => s.id === badge.skillId);
  const items: Item[] = badge.items ?? [];
  return {
    ...badge,
    title: skill?.title,
    items: items.map((item) => ({
      ...item,
      text: skill?.checklist.find((c) => c.id === item.id)?.text,
    })),
  };
}
