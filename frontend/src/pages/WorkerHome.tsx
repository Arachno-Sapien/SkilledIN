import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { QrCard } from "../components/QrCard";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";
import { JobStatus } from "../components/JobStatus";
import { BadgeCard } from "../components/BadgeCard";
import { useLanguage } from "../i18n";
import { api } from "../api";
import { Video, Star, BellRing, PhoneCall } from "lucide-react";

export const WorkerHome: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const [passport, setPassport] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // UI Guard per ARCHITECTURE §6: if localStorage.workerId !== id, redirect to public passport
    const savedId = localStorage.getItem("skilledin_worker_id");
    if (savedId && savedId !== id) {
      navigate(`/p/${id}`);
      return;
    }

    const loadData = async () => {
      if (!id) return;
      try {
        const [workerData, skillsData, offersData] = await Promise.all([
          api.getWorkerPassport(id),
          api.getSkills(),
          api.getWorkerOffers(id),
        ]);
        setPassport(workerData);
        setSkills(skillsData.filter((s: any) => s.trade === workerData.trade));
        setOffers(offersData);
      } catch (err) {
        console.error("WorkerHome load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Poll offers every 10 seconds
    const interval = setInterval(async () => {
      if (id) {
        try {
          const updatedOffers = await api.getWorkerOffers(id);
          setOffers(updatedOffers);
        } catch {}
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 py-8 space-y-4 animate-pulse">
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="h-14 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-slate-600">Worker profile not found.</p>
        <Link to="/w/start" className="text-brand-600 font-bold underline mt-2 block">
          Register new worker
        </Link>
      </div>
    );
  }

  const tradeSkill = skills[0]; // Primary skill challenge for this trade

  return (
    <div className="max-w-md mx-auto p-4 py-6 space-y-6">
      {/* Worker QR Card & Level */}
      <QrCard
        workerId={passport.id}
        workerName={passport.name}
        trade={passport.trade}
        area={passport.area}
        level={passport.level}
      />

      {/* Prove My Skill Action Button */}
      <div className="space-y-2">
        {tradeSkill ? (
          <BigButton
            variant="verified"
            icon={<Video className="w-6 h-6 text-white" />}
            subtitle={`${tradeSkill.title[lang] || tradeSkill.title.en} (60s live exam)`}
            onClick={() => navigate(`/w/${passport.id}/challenge/${tradeSkill.id}`)}
          >
            {t("proveSkill")}
          </BigButton>
        ) : (
          <div className="p-4 bg-slate-100 rounded-2xl text-center text-xs font-semibold text-slate-500">
            {t("noTasksYet")}
          </div>
        )}
      </div>

      {/* Live Job Offers Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellRing className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
              {t("jobOffers")} ({offers.length})
            </h3>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="p-5 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold">{t("noOffersYet")}</p>
            <p className="text-[11px] text-slate-400">
              Contractors hire based on proximity and verified badges.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => (
              <JobStatus
                key={offer.jobId}
                jobId={offer.jobId}
                workerId={passport.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Verified Badges */}
      {passport.badges && passport.badges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
            Earned Badges ({passport.badges.length})
          </h3>
          <div className="space-y-3">
            {passport.badges.map((b: any, idx: number) => (
              <BadgeCard key={idx} badge={b} />
            ))}
          </div>
        </div>
      )}

      {/* Request Customer Rating Stamp Button */}
      <div className="pt-2">
        <Link to={`/rate/${passport.id}`}>
          <BigButton
            variant="outline"
            icon={<Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
            subtitle="Ask finished customer for a 5-sec voice stamp"
          >
            {t("getStamp")}
          </BigButton>
        </Link>
      </div>
    </div>
  );
};
