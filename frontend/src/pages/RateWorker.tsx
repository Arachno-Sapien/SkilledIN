import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type ApiError } from "../api";
import { useLanguage } from "../i18n";
import { speak } from "../lib/speech";
import { MicButton } from "../components/MicButton";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";
import { Star, CheckCircle2, ArrowRight, X } from "lucide-react";

const STARS = [1, 2, 3, 4, 5];

export const RateWorker: React.FC = () => {
  const { id: workerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const [rating, setRating] = useState<number>(5);
  const [customerName, setCustomerName] = useState("");
  const [audioBase64, setAudioBase64] = useState<string | undefined>();
  const [mimeType, setMimeType] = useState<string>("audio/webm");
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Holds an i18n key so the message re-translates on a language switch.
  const [error, setError] = useState("");

  const redirectTimer = useRef<number>();
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const doneHeading = useRef<HTMLHeadingElement>(null);

  // Leaving the page before the redirect fires must not yank the user somewhere else later.
  useEffect(() => () => window.clearTimeout(redirectTimer.current), []);

  // The form is replaced by the thank-you screen; move focus there so it is not lost on <body>.
  useEffect(() => {
    if (submitted) doneHeading.current?.focus();
  }, [submitted]);

  // replace: Back from the passport should not reopen a form that was already submitted.
  const goToPassport = () => navigate(`/p/${workerId}`, { replace: true });

  const handleAudioRecorded = (base64: string, type: string) => {
    setAudioBase64(base64);
    setMimeType(type);
    setVoiceRecorded(true);
  };

  // Radio-group keyboard pattern: arrows move the choice, Tab leaves the group.
  const handleStarKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? -1
        : 0;
    if (!step) return;
    e.preventDefault();
    const next = Math.min(5, Math.max(1, rating + step));
    setRating(next);
    starRefs.current[next - 1]?.focus();
  };

  const handleSubmit = async () => {
    if (!workerId || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await api.createStamp({
        workerId,
        rating,
        audioBase64,
        mimeType,
        // Omit when blank: the backend stores its default and the passport shows it localised.
        customerName: customerName.trim() || undefined,
      });
      setSubmitted(true);
      speak(t("stampSubmitted"), lang);
      redirectTimer.current = window.setTimeout(goToPassport, 4000);
    } catch (err) {
      const code = (err as ApiError)?.code;
      setError(
        code === "NETWORK" ? "networkError" : code === "NOT_FOUND" ? "rate_workerNotFound" : "saveError"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-6 py-16 text-center space-y-4">
        <CheckCircle2 aria-hidden="true" className="w-16 h-16 text-emerald-700 mx-auto" />
        <div role="status" className="space-y-2">
          <h1
            ref={doneHeading}
            tabIndex={-1}
            className="text-2xl font-extrabold text-slate-900 focus:outline-none"
          >
            {t("stampSubmitted")}
          </h1>
          <p className="text-sm text-slate-600">{t("rate_redirecting")}</p>
        </div>
        <BigButton variant="primary" onClick={goToPassport}>
          {t("other_viewPassport")}
        </BigButton>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-md mx-auto p-4 py-6 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{t("rateTitle")}</h1>
          <p className="text-base text-slate-700 max-w-xs mx-auto">{t("rateInstructions")}</p>
          <div className="flex justify-center">
            <SpeakButton text={t("rateInstructions")} size="sm" />
          </div>
        </div>

        {/* 1-5 Star Selection */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col items-center space-y-3">
          <span id="rate-quality-label" className="text-sm font-bold uppercase tracking-wider text-slate-600">
            {t("rate_quality")}
          </span>
          <div role="radiogroup" aria-labelledby="rate-quality-label" className="flex items-center gap-1">
            {STARS.map((star) => (
              <button
                key={star}
                ref={(el) => {
                  starRefs.current[star - 1] = el;
                }}
                type="button"
                role="radio"
                aria-checked={star === rating}
                aria-label={t("other_starsOf", { n: star })}
                tabIndex={star === rating ? 0 : -1}
                onClick={() => setRating(star)}
                onKeyDown={handleStarKey}
                className="w-12 h-12 flex items-center justify-center rounded-full transition-transform active:scale-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
              >
                <Star
                  aria-hidden="true"
                  className={`w-9 h-9 ${
                    star <= rating ? "text-amber-500 fill-amber-500" : "text-slate-400 fill-slate-100"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-base font-extrabold text-slate-800">
            {t("other_starsOf", { n: rating })}
          </span>
        </div>

        {/* Optional Customer Name */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2">
          <label htmlFor="customer-name" className="text-sm font-bold text-slate-700 block">
            {t("rate_nameLabel")}
          </label>
          <input
            id="customer-name"
            type="text"
            autoComplete="name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={t("rate_namePlaceholder")}
            className="w-full min-h-[48px] px-4 py-3 text-base font-semibold rounded-xl border-2 border-slate-400 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
          />
        </div>

        {/* Optional Voice Note Recording */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            {t("rate_voiceNote")}
          </h2>
          <MicButton
            onRecorded={handleAudioRecorded}
            promptText={voiceRecorded ? t("rate_voiceRecorded") : t("rate_tapToSpeak")}
          />
        </div>

        {error && (
          <p role="alert" className="text-base font-semibold text-rose-700 text-center">
            {t(error)}
          </p>
        )}

        <BigButton
          variant="verified"
          icon={<ArrowRight aria-hidden="true" className="w-6 h-6" />}
          onClick={handleSubmit}
          loading={isSubmitting}
        >
          {t("submitStamp")}
        </BigButton>

        <BigButton
          variant="outline"
          icon={<X aria-hidden="true" className="w-5 h-5" />}
          onClick={() => navigate(`/w/${workerId}`, { replace: true })}
        >
          {t("cancel")}
        </BigButton>
      </div>
    </div>
  );
};
