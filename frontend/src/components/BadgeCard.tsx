import React from "react";
import { CheckCircle2, XCircle, HelpCircle, Award, ShieldAlert } from "lucide-react";
import { useLanguage } from "../i18n";
import { SpeakButton } from "./SpeakButton";

interface ChecklistItemReport {
  id: string;
  status: "seen" | "not_seen" | "unclear";
  evidence?: string;
  text?: { en: string; hi: string; kn: string } | string;
}

interface BadgeCardProps {
  badge: {
    skillId: string;
    score: number;
    createdAt: string;
    daysAgo?: number;
    items?: ChecklistItemReport[];
  };
  skillDetails?: {
    title: { en: string; hi: string; kn: string };
  };
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, skillDetails }) => {
  const { lang, t } = useLanguage();

  const title =
    skillDetails?.title?.[lang] ||
    skillDetails?.title?.en ||
    badge.skillId.replace(/^[a-z]+\./, "").replace(/_/g, " ");

  const daysAgo = badge.daysAgo ?? 0;
  const isOld = daysAgo > 90;

  const formattedDate = new Date(badge.createdAt).toLocaleDateString(
    lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : "en-IN",
    { day: "numeric", month: "short", year: "numeric" }
  );

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-slate-900 leading-tight capitalize">
              {title}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  isOld
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isOld
                  ? t("recheckRecommended")
                  : daysAgo === 0
                  ? t("verifiedToday")
                  : t("verifiedDaysAgo", { days: daysAgo })}
              </span>
              <span className="text-xs font-bold text-slate-400">
                Score: {badge.score}/100
              </span>
            </div>
          </div>
        </div>
        <SpeakButton text={`${title}. Verified practical skill test.`} size="sm" />
      </div>

      {/* Checklist items breakdown */}
      {badge.items && badge.items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Checklist Evidence
          </div>
          {badge.items.map((item, idx) => {
            const label =
              typeof item.text === "object"
                ? item.text[lang] || item.text.en
                : item.evidence || item.id;

            return (
              <div
                key={idx}
                className="flex items-start space-x-2.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-xl"
              >
                {item.status === "seen" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : item.status === "unclear" ? (
                  <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Honest "Proves / Does not prove" disclaimer line per ARCHITECTURE §4 */}
      <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 p-4 text-[11px] leading-relaxed text-slate-500">
        <p className="font-semibold text-slate-700">
          ✔ {t("badgeProves", { date: formattedDate })}
        </p>
        <p className="text-slate-400 mt-0.5">
          ℹ {t("badgeDoesNotProve")}
        </p>
      </div>
    </div>
  );
};
