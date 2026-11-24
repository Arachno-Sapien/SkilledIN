import React from "react";
import { CheckCircle2, XCircle, HelpCircle, Award } from "lucide-react";
import { useLanguage } from "../i18n";
import { speechLocale } from "../lib/speech";
import { SpeakButton } from "./SpeakButton";

type Localized = { en: string; hi: string; kn: string };

interface ChecklistItemReport {
  id: string;
  status: "seen" | "not_seen" | "unclear";
  evidence?: string;
  // The backend adds the skills.json checklist wording here (not stored in the DB).
  text?: Localized | string;
}

interface BadgeCardProps {
  badge: {
    skillId: string;
    score: number;
    createdAt: string;
    daysAgo?: number;
    // Localized skill title from skills.json, sent with every badge by the backend.
    title?: Localized;
    items?: ChecklistItemReport[];
  };
  skillDetails?: {
    title: Localized;
  };
}

// "electrician.switch_socket" -> "Switch socket": readable when the backend sent no title.
const readable = (slug: string) => {
  const s = slug.replace(/^[a-z]+\./, "").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Status is shown as a word as well as an icon/colour, so it does not rely on colour alone.
const STATUS = {
  seen: { key: "badgeCardSeen", Icon: CheckCircle2, color: "text-emerald-700" },
  unclear: { key: "badgeCardUnclear", Icon: HelpCircle, color: "text-amber-700" },
  not_seen: { key: "badgeCardNotSeen", Icon: XCircle, color: "text-rose-700" },
} as const;

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, skillDetails }) => {
  const { lang, t } = useLanguage();

  const title =
    badge.title?.[lang] ||
    skillDetails?.title?.[lang] ||
    badge.title?.en ||
    skillDetails?.title?.en ||
    readable(badge.skillId);

  const daysAgo = badge.daysAgo ?? 0;
  const isOld = daysAgo > 90;
  const freshness = isOld
    ? t("recheckRecommended")
    : daysAgo === 0
    ? t("verifiedToday")
    : t("verifiedDaysAgo", { days: daysAgo });

  const formattedDate = new Date(badge.createdAt).toLocaleDateString(speechLocale(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Award aria-hidden="true" className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-extrabold text-slate-900 leading-tight">{title}</h4>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                  isOld ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {freshness}
              </span>
              <span className="text-sm font-bold text-slate-600">
                {t("badgeCardScore", { score: badge.score })}
              </span>
            </div>
          </div>
        </div>
        <SpeakButton text={`${t("badgeCardSpeech", { title })} ${freshness}.`} size="sm" />
      </div>

      {badge.items && badge.items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h5 className="text-sm font-bold text-slate-700 mb-2">{t("badgeCardChecklist")}</h5>
          <ul className="space-y-2">
            {badge.items.map((item) => {
              const label =
                typeof item.text === "object"
                  ? item.text[lang] || item.text.en
                  : item.text || item.evidence || readable(item.id);
              const { key, Icon, color } = STATUS[item.status] ?? STATUS.unclear;

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50 p-2 rounded-xl"
                >
                  <Icon aria-hidden="true" className={`w-5 h-5 flex-shrink-0 mt-0.5 ${color}`} />
                  <span className="leading-snug">
                    <span className={`font-bold ${color}`}>{t(key)}:</span> {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Honest "Proves / Does not prove" disclaimer line */}
      <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 p-4 text-sm leading-relaxed text-slate-700">
        <p className="font-semibold">
          <span aria-hidden="true">✔ </span>
          {t("badgeProves", { date: formattedDate })}
        </p>
        <p className="text-slate-600 mt-0.5">
          <span aria-hidden="true">ℹ </span>
          {t("badgeDoesNotProve")}
        </p>
      </div>
    </div>
  );
};
