import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { useLanguage } from "../i18n";
import { BadgeCard } from "../components/BadgeCard";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";
import { ShieldCheck, Star, Briefcase, Share2, MapPin } from "lucide-react";
import { sharePassport } from "../lib/media";

export const Passport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useLanguage();

  useEffect(() => {
    const fetchPassport = async () => {
      if (!id) return;
      try {
        const data = await api.getWorkerPassport(id);
        setPassport(data);
      } catch (err) {
        console.error("Fetch passport error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPassport();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 py-8 space-y-4 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="h-28 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-slate-600">Passport not found.</p>
        <Link to="/" className="text-brand-600 font-bold underline mt-2 block">
          Go to SkilledIN Home
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    const text = `Verified blue-collar skill passport: ${passport.name} (${passport.trade}), ${passport.area}.`;
    sharePassport("SkilledIN Passport", text, window.location.href);
  };

  const levelLabels: Record<number, string> = {
    0: "Registered",
    1: "Verified (Level 1)",
    2: "Experienced (Level 2)",
    3: "Master (Level 3)",
  };

  return (
    <div className="max-w-md mx-auto p-4 py-6 space-y-6">
      {/* Header Profile Card (Secure Public View: NO phone number leaked) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{levelLabels[passport.level] || "Verified"}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {passport.name}
            </h2>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 capitalize mt-1">
              <span>{passport.trade}</span>
              <span>•</span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                {passport.area}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shadow-sm"
              title="Share passport"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <SpeakButton
              text={`${passport.name}, ${passport.trade} in ${passport.area}. ${levelLabels[passport.level]}.`}
              size="md"
            />
          </div>
        </div>

        {/* Rating summary */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>
              {passport.avgRating ? `${passport.avgRating}★` : "New (No ratings yet)"}
            </span>
            <span className="text-slate-400 font-normal">
              ({passport.stampCount} customer stamps)
            </span>
          </div>
          <span className="text-slate-400 font-normal">
            Member since {new Date(passport.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Verified Practical Badges */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
          Verified Practical Badges ({passport.badges.length})
        </h3>
        {passport.badges.length === 0 ? (
          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No video challenge completed yet.
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
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
            Customer Job Stamps ({passport.stamps.length})
          </h3>
          <div className="space-y-2">
            {passport.stamps.map((stamp: any, idx: number) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-amber-500 text-xs">
                    {Array.from({ length: stamp.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {stamp.customerName || "Customer"}
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic">
                  "{stamp.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action: "Hire workers like this" -> /hire */}
      <div className="pt-2">
        <Link to="/hire">
          <BigButton
            variant="primary"
            icon={<Briefcase className="w-6 h-6 text-brand-200" />}
            subtitle="Speak to find verified workers near your locality"
          >
            {t("hireWorkersLikeThis")}
          </BigButton>
        </Link>
      </div>
    </div>
  );
};
