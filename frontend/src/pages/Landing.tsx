import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, UserPlus, Briefcase, Sparkles, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../i18n";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";

const WORKER_ID_KEY = "skilledin_worker_id";
// Matches the challenge length in backend/src/data/skills.json (durationSec: 90).
const CHALLENGE_SECONDS = 90;

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  // ponytail: identity is only this localStorage id (AGENTS §10, no auth) — real login would replace it.
  const [savedWorkerId] = useState(() => localStorage.getItem(WORKER_ID_KEY));

  useEffect(() => {
    document.title = `SkilledIN · ${t("skillPassport")}`;
  }, [lang]); // t() only changes when lang does

  // Shared phones: the next worker must be able to start fresh without the old passport opening.
  const registerDifferent = () => {
    localStorage.removeItem(WORKER_ID_KEY);
    navigate("/w/start");
  };

  const howItWorks = [
    { title: t("landingHowVideoTitle"), body: t("landingHowVideo", { seconds: CHALLENGE_SECONDS }) },
    { title: t("landingHowStampTitle"), body: t("landingHowStamp") },
    { title: t("landingHowHireTitle"), body: t("landingHowHire") },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between max-w-md mx-auto p-4 py-6">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-sm font-bold">
          <Sparkles aria-hidden="true" className="w-4 h-4 text-brand-600" />
          <span>{t("landingHeroBadge")}</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {t("landingHeroLine1")}
          <br />
          <span className="text-brand-600">{t("landingHeroLine2")}</span>
        </h1>

        <p className="text-base font-medium text-slate-700 leading-relaxed max-w-xs mx-auto">{t("tagline")}</p>

        <div className="flex justify-center pt-1">
          <SpeakButton
            text={`${t("landingHeroLine1")} ${t("landingHeroLine2")} ${t("tagline")}. ${t("chooseRole")}`}
            size="md"
          />
        </div>
      </div>

      <div className="space-y-4 my-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 text-center">{t("chooseRole")}</h2>

        {savedWorkerId ? (
          <>
            <BigButton
              variant="primary"
              icon={<User className="w-7 h-7 text-brand-100" />}
              subtitle={t("landingContinueSub")}
              onClick={() => navigate(`/w/${savedWorkerId}`)}
            >
              {t("landingContinue")}
            </BigButton>
            <BigButton
              variant="outline"
              icon={<UserPlus className="w-6 h-6 text-brand-700" />}
              onClick={registerDifferent}
            >
              {t("landingRegisterDifferent")}
            </BigButton>
          </>
        ) : (
          <BigButton
            variant="primary"
            icon={<User className="w-7 h-7 text-brand-100" />}
            subtitle={t("imWorkerSub")}
            onClick={() => navigate("/w/start")}
          >
            {t("imWorker")}
          </BigButton>
        )}

        <BigButton
          variant="outline"
          icon={<Briefcase className="w-7 h-7 text-brand-700" />}
          subtitle={t("imContractorSub")}
          onClick={() => navigate("/hire")}
        >
          {t("imContractor")}
        </BigButton>
      </div>

      <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-600">{t("landingHowItWorks")}</h2>
        <ul className="grid grid-cols-1 gap-2.5 text-sm text-slate-700">
          {howItWorks.map(({ title, body }) => (
            <li key={title} className="flex items-start gap-2.5">
              <CheckCircle2 aria-hidden="true" className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <span>
                <strong>{title}</strong> {body}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-center text-sm text-slate-600 mt-6">{t("landingFooter")}</footer>
    </div>
  );
};
