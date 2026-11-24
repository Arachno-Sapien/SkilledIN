import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, type ApiError } from "../api";
import { useLanguage } from "../i18n";
import { tradeLabel } from "../strings/other";
import { BadgeCard } from "../components/BadgeCard";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";
import { ShieldCheck, Star, Briefcase, Share2, MapPin } from "lucide-react";
import { sharePassport } from "../lib/media";
import { speechLocale } from "../lib/speech";

export const Passport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // any: api.getWorkerPassport is untyped (public JSON from GET /api/workers/:id).
  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { lang, t } = useLanguage();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setErrorCode(null);
    api
      .getWorkerPassport(id)
      .then((data) => {
        if (!cancelled) setPassport(data);
      })
      .catch((err: ApiError) => {
        if (!cancelled) setErrorCode(err?.code ?? "UNKNOWN_ERROR");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (loading) {
    return (
      <div role="status" className="max-w-md mx-auto p-4 py-8 space-y-4 animate-pulse">
        <span className="sr-only">{t("loading")}</span>
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="h-28 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!passport) {
    // Only a real 404 means "not found"; a network blip gets a retry instead of a dead end.
    const notFound = errorCode === "NOT_FOUND";
    const message = notFound
      ? t("pp_notFound")
      : t(errorCode === "NETWORK" ? "networkError" : "genericError");
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <p role="alert" className="text-base font-semibold text-slate-700">
          {message}
        </p>
        <div className="flex justify-center">
          <SpeakButton text={message} size="md" />
        </div>
        {!notFound && (
          <BigButton variant="primary" onClick={() => setAttempt((a) => a + 1)}>
            {t("retry")}
          </BigButton>
        )}
        <Link
          to="/"
          className="inline-flex items-center justify-center min-h-[48px] px-4 text-base font-bold text-brand-700 underline"
        >
          {t("pp_goHome")}
        </Link>
      </div>
    );
  }

  const trade = tradeLabel(t, passport.trade);
  // Clamp so an unexpected level never shows a raw "workerLevel7" key.
  const levelText = t(`workerLevel${Math.min(3, Math.max(0, Number(passport.level) || 0))}`);
  const memberSince = new Date(passport.createdAt).toLocaleDateString(speechLocale(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleShare = () => {
    const text = t("pp_shareText", { name: passport.name, trade, area: passport.area });
    sharePassport("SkilledIN", text, window.location.href);
  };

  // The backend stores "Customer" when no name was given; show that placeholder in the reader's language.
  const customerName = (name?: string) =>
    !name || name === "Customer" ? t("pp_customer") : name;

  return (
    <div className="max-w-md mx-auto p-4 py-6 space-y-6">
      {/* Header Profile Card (Secure Public View: NO phone number leaked) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-sm font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <ShieldCheck aria-hidden="true" className="w-4 h-4 text-emerald-700" />
              <span>{levelText}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {passport.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-slate-600 mt-1">
              <span>{trade}</span>
              <span aria-hidden="true">•</span>
              <span className="flex items-center">
                <MapPin aria-hidden="true" className="w-4 h-4 mr-0.5" />
                {passport.area}
              </span>
            </div>
          </div>

          <div className="flex space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleShare}
              aria-label={t("pp_share")}
              className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shadow-sm"
            >
              <Share2 aria-hidden="true" className="w-5 h-5" />
            </button>
            <SpeakButton
              text={t("pp_speak", { name: passport.name, trade, area: passport.area, level: levelText })}
              size="md"
            />
          </div>
        </div>

        {/* Rating summary */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-700">
          <div className="flex flex-wrap items-center gap-1">
            <Star aria-hidden="true" className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>
              {passport.avgRating
                ? t("other_rating", { rating: passport.avgRating })
                : t("other_noRatings")}
            </span>
            <span className="text-slate-600 font-normal">
              ({t("pp_stampCount", { n: passport.stampCount })})
            </span>
          </div>
          <span className="text-slate-600 font-normal">
            {t("pp_memberSince", { date: memberSince })}
          </span>
        </div>
      </div>

      {/* Verified Practical Badges */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
          {t("pp_badgesTitle", { n: passport.badges.length })}
        </h2>
        {passport.badges.length === 0 ? (
          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-600">
            {t("pp_noBadges")}
          </div>
        ) : (
          <div className="space-y-3">
            {passport.badges.map((badge: any, idx: number) => (
              <BadgeCard key={idx} badge={badge} />
            ))}
          </div>
        )}
      </div>

      {/* Customer Voice Stamps */}
      {passport.stamps && passport.stamps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
            {t("pp_stampsTitle", { n: passport.stamps.length })}
          </h2>
          <ul className="space-y-2">
            {passport.stamps.map((stamp: any, idx: number) => (
              <li
                key={idx}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div
                    role="img"
                    aria-label={t("other_starsOf", { n: stamp.rating })}
                    className="flex items-center space-x-1 text-amber-500"
                  >
                    {Array.from({ length: stamp.rating }).map((_, i) => (
                      <Star key={i} aria-hidden="true" className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600">{customerName(stamp.customerName)}</span>
                </div>
                <p className="text-sm text-slate-700 italic">"{stamp.quote}"</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Call to Action: "Hire workers like this" -> /hire. A button, not a button inside a link. */}
      <div className="pt-2">
        <BigButton
          variant="primary"
          icon={<Briefcase aria-hidden="true" className="w-6 h-6 text-brand-200" />}
          subtitle={t("pp_hireSubtitle")}
          onClick={() => navigate("/hire")}
        >
          {t("hireWorkersLikeThis")}
        </BigButton>
      </div>
    </div>
  );
};
