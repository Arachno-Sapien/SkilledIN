import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, CheckCircle, Clock, UserCheck, MapPin, IndianRupee } from "lucide-react";
import { api } from "../api";
import { useLanguage } from "../i18n";
import { BigButton } from "./BigButton";

interface JobStatusProps {
  jobId: string;
  workerId?: string; // If worker view, displays accept / call button
}

export const JobStatus: React.FC<JobStatusProps> = ({ jobId, workerId }) => {
  const [job, setJob] = useState<any>(null);
  const [acceptedWorkers, setAcceptedWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const { t } = useLanguage();

  const fetchJob = async () => {
    try {
      const data = await api.getJob(jobId);
      setJob(data.job);
      setAcceptedWorkers(data.acceptedWorkers || []);
    } catch (e) {
      console.warn("Poll job status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [jobId]);

  const handleAccept = async () => {
    if (!workerId || accepting) return;
    setAccepting(true);
    try {
      await api.acceptJob(jobId, workerId);
      setAccepted(true);
      fetchJob();
    } catch (err) {
      alert("Could not accept job. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading && !job) {
    return (
      <div className="p-4 bg-slate-100 rounded-2xl animate-pulse text-center text-xs text-slate-500">
        Loading job status…
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-700">
            Live Hiring Status
          </h4>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
          Job #{job.id}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl">
        <div className="flex items-center space-x-1.5 text-slate-700">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="font-bold">{job.area}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-700">
          <IndianRupee className="w-4 h-4 text-slate-400" />
          <span className="font-bold">₹{job.wage} / day</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-700">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{job.date}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-700">
          <UserCheck className="w-4 h-4 text-slate-400" />
          <span>Need: {job.count} {job.trade}</span>
        </div>
      </div>

      {/* Contractor View: Accepted Workers List */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Accepted Workers ({acceptedWorkers.length}/{job.count})
        </div>
        {acceptedWorkers.length === 0 ? (
          <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center">
            Waiting for nearby workers to accept…
          </div>
        ) : (
          <div className="space-y-2">
            {acceptedWorkers.map((w) => (
              <div
                key={w.workerId}
                className="flex items-center justify-between p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-sm font-bold text-slate-900 block leading-tight">
                      {w.name}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {w.trade} • {w.area}
                    </span>
                  </div>
                </div>
                <Link
                  to={w.passportUrl}
                  target="_blank"
                  className="text-xs font-bold text-brand-600 underline"
                >
                  View Passport
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Worker View: Action Button */}
      {workerId && (
        <div className="pt-2">
          {accepted || job.acceptedWorkerIds?.includes(workerId) ? (
            <div className="space-y-2">
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl text-center">
                ✔ You accepted this job!
              </div>
              {job.contractorPhone && (
                <a
                  href={`tel:${job.contractorPhone}`}
                  className="w-full"
                >
                  <BigButton
                    variant="verified"
                    icon={<Phone className="w-5 h-5" />}
                  >
                    📞 Call Contractor ({job.contractorPhone})
                  </BigButton>
                </a>
              )}
            </div>
          ) : (
            <BigButton
              variant="primary"
              onClick={handleAccept}
              loading={accepting}
            >
              {t("acceptJob")}
            </BigButton>
          )}
        </div>
      )}
    </div>
  );
};
