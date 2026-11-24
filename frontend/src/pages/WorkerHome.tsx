import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Video, Star, BellRing, LogOut, UserPlus, RotateCcw, CheckCircle2 } from "lucide-react";
import { QrCard } from "../components/QrCard";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";
import { JobStatus } from "../components/JobStatus";
import { BadgeCard } from "../components/BadgeCard";
import { useLanguage } from "../i18n";
import { api, type ApiError } from "../api";
import { speak } from "../lib/speech";

const WORKER_ID_KEY = "skilledin_worker_id";
// Fallback when a skill has no durationSec; every skill in skills.json is 90 s today.
const DEFAULT_CHALLENGE_SECONDS = 90;

type LoadStatus = "loading" | "ready" | "notFound" | "error";

export const WorkerHome: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, t } = useLanguage();

  // Read once from the onboarding redirect; shown only after the GET below proves the passport is stored.
  const [arrival] = useState<"saved" | "recovered" | null>(() => {
    const s = location.state as { justCreated?: boolean; recovered?: boolean } | null;
    return s?.recovered ? "recovered" : s?.justCreated ? "saved" : null;
  });

  // `any`: api.ts types these backend payloads loosely (GET /api/workers/:id, /api/skills, /offers).
  const [passport, setPassport] = useState<any>(null);
  const [skills, setSkills] = useState<any[] | null>(null); // null until loaded
  const [skillsFailed, setSkillsFailed] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorKey, setErrorKey] = useState("genericError");
  const [attempt, setAttempt] = useState(0);
  const focusRef = useRef<HTMLElement | null>(null);
  const announced = useRef(false);

  useEffect(() => {
    if (!id) return;
    // ponytail: localStorage-only identity (AGENTS §10) — only the phone that registered or recovered this id
    // sees the owner view (it lists contractor phone numbers); everyone else gets the public passport.
    if (localStorage.getItem(WORKER_ID_KEY) !== id) {
      navigate(`/p/${id}`, { replace: true });
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setSkillsFailed(false);

    (async () => {
      let worker: any; // see the state comment above
      try {
        worker = await api.getWorkerPassport(id);
      } catch (err) {
        if (cancelled) return;
        const code = (err as ApiError)?.code;
        if (code === "NOT_FOUND") {
          // The server says this worker does not exist, so forget the stale id; Landing then offers registration.
          localStorage.removeItem(WORKER_ID_KEY);
          setStatus("notFound");
        } else {
          setErrorKey(code === "NETWORK" ? "networkError" : "genericError");
          setStatus("error");
        }
        return;
      }
      if (cancelled) return;
      setPassport(worker);
      setStatus("ready");

      // Loaded separately so a failed skills or offers call can never hide a passport that loaded fine.
      const [s, o] = await Promise.allSettled([api.getSkills(), api.getWorkerOffers(id)]);
      if (cancelled) return;
      if (s.status === "fulfilled") setSkills(s.value.filter((k: any) => k.trade === worker.trade));
      else setSkillsFailed(true);
      if (o.status === "fulfilled") setOffers(o.value);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, attempt, navigate]);

  // Poll offers only once the passport exists; a failed poll just waits for the next one.
  useEffect(() => {
    if (status !== "ready" || !id) return;
    const interval = setInterval(() => {
      api.getWorkerOffers(id).then(setOffers).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [status, id]);

  useEffect(() => {
    document.title = `${passport?.name ?? t("homeTitle")} · SkilledIN`;
  }, [passport, lang]); // t() only changes when lang does

  const bannerText =
    passport && arrival === "recovered"
      ? t("homeWelcomeBack", { name: passport.name })
      : passport && arrival === "saved"
      ? t("homeSaved")
      : "";

  // When the page content appears, move focus to the confirmation (or the heading) so screen readers
  // start there, and say the confirmation out loud once for workers who cannot read it.
  useEffect(() => {
    if (status !== "ready") return;
    focusRef.current?.focus();
    if (bannerText && !announced.current) {
      announced.current = true;
      speak(bannerText, lang);
    }
  }, [status]); // only on the load transition, not on every language switch

  if (status === "loading") {
    return (
      <div role="status" className="max-w-md mx-auto p-4 py-8 space-y-4">
        <span className="sr-only">{t("loading")}</span>
        <div aria-hidden="true" className="space-y-4 animate-pulse">
          <div className="h-48 bg-slate-200 rounded-3xl" />
          <div className="h-14 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (status === "notFound" || status === "error") {
    const message = status === "notFound" ? t("homeNotFound") : t(errorKey);
    return (
      <div className="max-w-md mx-auto p-4 py-8 space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300">
          <p role="alert" className="flex-1 text-base font-semibold text-rose-800">
            {message}
          </p>
          <SpeakButton text={message} size="sm" />
        </div>
        {status === "notFound" ? (
          <BigButton variant="primary" icon={<UserPlus className="w-6 h-6" />} onClick={() => navigate("/w/start")}>
            {t("homeRegister")}
          </BigButton>
        ) : (
          <BigButton variant="primary" icon={<RotateCcw className="w-6 h-6" />} onClick={() => setAttempt((a) => a + 1)}>
            {t("retry")}
          </BigButton>
        )}
      </div>
    );
  }

  const tradeKey = `trade_${passport.trade}`;
  const tradeLabel = t(tradeKey) === tradeKey ? passport.trade : t(tradeKey);
  const levelLabel = t(`workerLevel${Math.min(3, Math.max(0, Math.floor(passport.level || 0)))}`);
  const tradeSkill = skills?.[0]; // Primary skill challenge for this trade
  const badges: any[] = passport.badges ?? [];

  return (
    <div className="max-w-md mx-auto p-4 py-6 space-y-6">
      {bannerText && (
        <div
          role="status"
          tabIndex={-1}
          ref={(el) => {
            focusRef.current = el;
          }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900"
        >
          <CheckCircle2 aria-hidden="true" className="w-6 h-6 flex-shrink-0 text-emerald-700" />
          <p className="flex-1 text-base font-semibold">{bannerText}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h1
          tabIndex={-1}
          ref={(el) => {
            if (!bannerText) focusRef.current = el;
          }}
          className="text-2xl font-extrabold text-slate-900 leading-tight"
        >
          {t("homeTitle")}
        </h1>
        <SpeakButton
          text={t("homeSummary", { name: passport.name, trade: tradeLabel, area: passport.area, level: levelLabel })}
          size="md"
        />
      </div>

      <QrCard
        workerId={passport.id}
        workerName={passport.name}
        trade={passport.trade}
        area={passport.area}
        level={passport.level}
      />

      <div className="space-y-2">
        {tradeSkill ? (
          <BigButton
            variant="verified"
            icon={<Video className="w-6 h-6 text-white" />}
            subtitle={`${tradeSkill.title?.[lang] || tradeSkill.title?.en || ""} ${t("homeExamDuration", {
              sec: tradeSkill.durationSec ?? DEFAULT_CHALLENGE_SECONDS,
            })}`}
            onClick={() => navigate(`/w/${passport.id}/challenge/${tradeSkill.id}`)}
          >
            {t("proveSkill")}
          </BigButton>
        ) : skillsFailed ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
            <p role="alert" className="text-base font-semibold text-rose-800">
              {t("homeSkillsError")}
            </p>
            <BigButton variant="outline" icon={<RotateCcw className="w-5 h-5" />} onClick={() => setAttempt((a) => a + 1)}>
              {t("retry")}
            </BigButton>
          </div>
        ) : skills ? (
          <p className="p-4 bg-slate-100 rounded-2xl text-center text-sm font-semibold text-slate-700">
            {t("noTasksYet")}
          </p>
        ) : null}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BellRing aria-hidden="true" className="w-5 h-5 text-brand-600" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
            {t("jobOffers")} ({offers.length})
          </h2>
        </div>

        {offers.length === 0 ? (
          <div className="p-5 bg-white rounded-3xl border border-slate-200 text-center space-y-1">
            <p className="text-base font-semibold text-slate-700">{t("noOffersYet")}</p>
            <p className="text-sm text-slate-600">{t("homeOffersHint")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => (
              <JobStatus key={offer.jobId} jobId={offer.jobId} workerId={passport.id} />
            ))}
          </div>
        )}
      </section>

      {badges.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
            {t("homeEarnedBadges", { n: badges.length })}
          </h2>
          <div className="space-y-3">
            {badges.map((b, idx) => (
              <BadgeCard key={`${b.skillId}-${idx}`} badge={b} skillDetails={skills?.find((s) => s.id === b.skillId)} />
            ))}
          </div>
        </section>
      )}

      <div className="pt-2 space-y-3">
        <BigButton
          variant="outline"
          icon={<Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
          subtitle={t("homeStampSubtitle")}
          onClick={() => navigate(`/rate/${passport.id}`)}
        >
          {t("getStamp")}
        </BigButton>

        {/* Exit keeps the saved id so "Continue to my passport" on Landing brings the worker back here. */}
        <BigButton
          variant="outline"
          icon={<LogOut className="w-5 h-5 text-slate-700" />}
          aria-label={t("exit")}
          onClick={() => navigate("/")}
        >
          {t("exit")}
        </BigButton>

        {/* Shared phones: forget this passport on this device so the next worker can register. */}
        <BigButton
          variant="outline"
          icon={<UserPlus className="w-5 h-5 text-slate-700" />}
          onClick={() => {
            localStorage.removeItem(WORKER_ID_KEY);
            navigate("/w/start");
          }}
        >
          {t("homeNotYou")}
        </BigButton>
      </div>
    </div>
  );
};
