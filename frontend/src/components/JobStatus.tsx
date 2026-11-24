import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, CheckCircle, Clock, UserCheck, MapPin, IndianRupee } from "lucide-react";
import { api, type ApiError } from "../api";
import { useLanguage } from "../i18n";
import { tradeLabel } from "../strings/other";
import { BigButton } from "./BigButton";

interface JobStatusProps {
  jobId: string;
  workerId?: string; // If worker view, displays accept / call button
}

export const JobStatus: React.FC<JobStatusProps> = ({ jobId, workerId }) => {
  // any: api.getJob returns untyped job / worker objects from GET /api/jobs/:id.
  const [job, setJob] = useState<any>(null);
  const [acceptedWorkers, setAcceptedWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  // i18n key, so the message re-translates on a language switch.
  const [acceptError, setAcceptError] = useState("");
  const [contractorPhone, setContractorPhone] = useState<string>();
  const acceptedRef = useRef<HTMLParagraphElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await api.getJob(jobId);
        setJob(data.job);
        setAcceptedWorkers(data.acceptedWorkers || []);
        setLoadError(null);
      } catch (e) {
        const code = (e as ApiError)?.code ?? "UNKNOWN_ERROR";
        setLoadError(code);
        // A deleted job will not come back; other errors keep polling, which is the retry.
        if (code === "NOT_FOUND") clearInterval(interval);
      } finally {
        setLoading(false);
      }
    };
    const interval = setInterval(fetchJob, 5000); // Poll every 5s
    fetchJob();
    return () => clearInterval(interval);
  }, [jobId]);

  const hasAccepted =
    !!workerId && (accepted || !!job?.acceptedWorkerIds?.includes(workerId));

  // GET /api/jobs/:id never returns contractorPhone; the worker's own offer feed does once accepted.
  useEffect(() => {
    if (!hasAccepted || !workerId) return;
    api
      .getWorkerOffers(workerId)
      .then((offers) => setContractorPhone(offers.find((o) => o.jobId === jobId)?.contractorPhone))
      .catch(() => {});
  }, [hasAccepted, workerId, jobId]);

  // The Accept button the worker just pressed disappears; keep focus on the confirmation instead.
  useEffect(() => {
    if (accepted) acceptedRef.current?.focus();
  }, [accepted]);

  const handleAccept = async () => {
    if (!workerId || accepting) return;
    setAccepting(true);
    setAcceptError("");
    try {
      await api.acceptJob(jobId, workerId);
      setAccepted(true);
    } catch (e) {
      const code = (e as ApiError)?.code;
      setAcceptError(
        code === "NETWORK" ? "networkError" : code === "NOT_FOUND" ? "job_offerGone" : "job_acceptFailed"
      );
    } finally {
      setAccepting(false);
    }
  };

  // Job dates are free text ("Tomorrow" from the manual search, whatever the voice agent heard).
  const dateLabel = (d: string) => {
    const k = String(d ?? "").trim().toLowerCase();
    return k === "tomorrow" ? t("job_tomorrow") : k === "today" ? t("job_today") : d;
  };

  if (loading && !job) {
    return (
      <div
        role="status"
        className="p-4 bg-slate-100 rounded-2xl animate-pulse text-center text-sm text-slate-600"
      >
        {t("job_loading")}
      </div>
    );
  }

  if (!job) {
    const key =
      loadError === "NOT_FOUND" ? "job_notFound" : loadError === "NETWORK" ? "networkError" : "job_loadFailed";
    return (
      <div
        role="status"
        className="p-4 bg-white border border-slate-200 rounded-2xl text-center text-base font-semibold text-slate-700"
      >
        {t(key)}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700">
            {t("job_liveStatus")}
          </h3>
        </div>
        <span className="text-sm font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
          {t("job_number", { id: job.id })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-3 rounded-2xl">
        <div className="flex items-center space-x-1.5 text-slate-700">
          <MapPin aria-hidden="true" className="w-4 h-4 flex-shrink-0 text-slate-500" />
          <span className="font-bold">{job.area}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-700">
          <IndianRupee aria-hidden="true" className="w-4 h-4 flex-shrink-0 text-slate-500" />
          <span className="font-bold">{t("job_perDay", { wage: job.wage })}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-700">
          <Clock aria-hidden="true" className="w-4 h-4 flex-shrink-0 text-slate-500" />
          <span>{dateLabel(job.date)}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-700">
          <UserCheck aria-hidden="true" className="w-4 h-4 flex-shrink-0 text-slate-500" />
          <span>{t("job_need", { count: job.count, trade: tradeLabel(t, job.trade) })}</span>
        </div>
      </div>

      {/* Contractor View: Accepted Workers List */}
      <div>
        {/* Polite live region: the contractor hears when a worker accepts (text changes only then). */}
        <div
          aria-live="polite"
          className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2"
        >
          {t("job_accepted", { n: acceptedWorkers.length, total: job.count })}
        </div>
        {acceptedWorkers.length === 0 ? (
          <div className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl text-center">
            {t("job_waiting")}
          </div>
        ) : (
          <ul className="space-y-2">
            {acceptedWorkers.map((w) => (
              <li
                key={w.workerId}
                className="flex items-center justify-between gap-2 p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle aria-hidden="true" className="w-4 h-4 flex-shrink-0 text-emerald-700" />
                  <div>
                    <span className="text-sm font-bold text-slate-900 block leading-tight">{w.name}</span>
                    <span className="text-sm text-slate-600">
                      {tradeLabel(t, w.trade)} • {w.area}
                    </span>
                  </div>
                </div>
                {/* New tab on purpose: on /hire, leaving the page would end a live voice call. */}
                <Link
                  to={w.passportUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center min-h-[44px] px-2 text-sm font-bold text-brand-700 underline"
                >
                  {t("other_viewPassport")}
                  <span className="sr-only"> {t("other_newTab")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Worker View: Action Button */}
      {workerId && (
        <div className="pt-2 space-y-2">
          {hasAccepted ? (
            <>
              <p
                ref={acceptedRef}
                tabIndex={-1}
                role="status"
                className="p-3 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-xl text-center focus:outline-none"
              >
                <span aria-hidden="true">✔ </span>
                {t("job_youAccepted")}
              </p>
              {contractorPhone && (
                <BigButton
                  variant="verified"
                  icon={<Phone aria-hidden="true" className="w-5 h-5" />}
                  onClick={() => {
                    window.location.href = `tel:${contractorPhone}`;
                  }}
                >
                  {t("callContractor")} ({contractorPhone})
                </BigButton>
              )}
            </>
          ) : (
            <BigButton variant="primary" onClick={handleAccept} loading={accepting}>
              {t("acceptJob")}
            </BigButton>
          )}
          {acceptError && (
            <p role="alert" className="text-sm font-semibold text-rose-700 text-center">
              {t(acceptError)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
