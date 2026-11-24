import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Briefcase, Sparkles, Volume2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../i18n";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();

  const handleWorkerClick = () => {
    const savedWorkerId = localStorage.getItem("skilledin_worker_id");
    if (savedWorkerId) {
      navigate(`/w/${savedWorkerId}`);
    } else {
      navigate("/w/start");
    }
  };

  const handleHireClick = () => {
    navigate("/hire");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between max-w-md mx-auto p-4 py-6">
      {/* Hero Header */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>India’s Voice-First Blue-Collar Platform</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Prove your skill.
          <br />
          <span className="text-brand-600">Get hired by voice.</span>
        </h1>

        <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-xs mx-auto">
          {t("tagline")}
        </p>

        <div className="flex justify-center pt-1">
          <SpeakButton
            text={`${t("appName")}. ${t("tagline")}. ${t("chooseRole")}`}
            size="md"
          />
        </div>
      </div>

      {/* Role Selection Buttons (Voice-first >= 56px touch targets) */}
      <div className="space-y-4 my-8">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
          {t("chooseRole")}
        </div>

        {/* Worker Button */}
        <BigButton
          variant="primary"
          icon={<User className="w-7 h-7 text-brand-200" />}
          subtitle={t("imWorkerSub")}
          onClick={handleWorkerClick}
        >
          {t("imWorker")}
        </BigButton>

        {/* Contractor Button */}
        <BigButton
          variant="outline"
          icon={<Briefcase className="w-7 h-7 text-brand-600" />}
          subtitle={t("imContractorSub")}
          onClick={handleHireClick}
        >
          {t("imContractor")}
        </BigButton>
      </div>

      {/* Trust & Verification Pillar Highlights */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          How SkilledIN works
        </div>
        <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-700">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Live Video Exam:</strong> 60s practical challenge checked by AI</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Voice Stamp:</strong> Customer reviews + star ratings on your QR</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Speak to Hire:</strong> Contractors hire nearby workers naturally</span>
          </div>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-400 mt-6">
        Built by Team Adversity for wHACKiest 2026 • Track 4 UnlockED
      </footer>
    </div>
  );
};
