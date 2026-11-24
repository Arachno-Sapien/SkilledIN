import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useConversation } from "@elevenlabs/react";
import { ELEVENLABS_AGENT_ID } from "../config";
import { useLanguage } from "../i18n";
import { api } from "../api";
import { normalisePhone } from "../lib/phone";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";
import { JobStatus } from "../components/JobStatus";
import {
  PhoneCall,
  Sparkles,
  UserCheck,
  MapPin,
  Star,
  CheckCircle2,
  AlertTriangle,
  Mic,
  MicOff,
  Search,
} from "lucide-react";

export const Hire: React.FC = () => {
  const { lang, t } = useLanguage();

  const [contractorPhone, setContractorPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  // Hiring Results & Active Job State
  const [matches, setMatches] = useState<any[]>([]);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  // Manual fallback fields (for offline / direct testing)
  const [trade, setTrade] = useState<string>("electrician");
  const [area, setArea] = useState<string>("Jayanagar");
  const [count, setCount] = useState<number>(1);
  const [wage, setWage] = useState<number>(800);

  // ElevenLabs Client Tool Definition per ARCHITECTURE §9.2
  const clientTools = {
    find_workers: async (params: {
      trade: "electrician" | "plumber" | "mason";
      count?: number;
      area: string;
      date?: string;
      wage?: number;
    }) => {
      try {
        let cleanPhone: string;
        try {
          cleanPhone = normalisePhone(contractorPhone);
        } catch {
          cleanPhone = "9845012399";
        }

        const res = await api.createJob({
          trade: params.trade || "electrician",
          count: params.count || 1,
          area: params.area || "Jayanagar",
          date: params.date || "Tomorrow",
          wage: params.wage || 800,
          contractorPhone: cleanPhone,
        });

        setMatches(res.matches);
        setCreatedJobId(res.job.id);

        if (res.matches.length === 0) {
          return "No verified workers found within 10 km. Would you like to check a nearby area?";
        }

        const topThree = res.matches
          .slice(0, 3)
          .map((m: any) => `${m.name}: ${m.reason}`)
          .join(". ");

        return `Found ${res.matches.length} matches. Here are the top candidates: ${topThree}`;
      } catch (err: any) {
        if (err.code === "AREA_NOT_FOUND") {
          return "I couldn't find that area. Which locality in Bengaluru?";
        }
        return "Something went wrong searching for workers. Please specify the locality again.";
      }
    },
  };

  const conversation = useConversation({
    clientTools,
    onConnect: () => console.log("Connected to ElevenLabs hiring agent"),
    onDisconnect: () => console.log("Disconnected from ElevenLabs hiring agent"),
    onError: (err) => console.warn("ElevenLabs agent error:", err),
  });

  const handlePhoneChange = (val: string) => {
    setContractorPhone(val);
    setPhoneError("");
    try {
      normalisePhone(val);
      setIsPhoneValid(true);
    } catch {
      setIsPhoneValid(false);
    }
  };

  const handleStartConversation = async () => {
    if (!isPhoneValid) {
      setPhoneError("Please enter a valid 10-digit mobile number first.");
      return;
    }

    if (ELEVENLABS_AGENT_ID) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await conversation.startSession({
          agentId: ELEVENLABS_AGENT_ID,
        });
        return;
      } catch (err) {
        console.warn("ElevenLabs startSession failed, offering direct search:", err);
      }
    }

    // Direct search if agent ID not set or failed
    handleManualSearch();
  };

  const handleManualSearch = async () => {
    setIsSearchingManual(true);
    try {
      let cleanPhone: string;
      try {
        cleanPhone = normalisePhone(contractorPhone);
      } catch {
        cleanPhone = "9845012399";
      }

      const res = await api.createJob({
        trade,
        count,
        area,
        date: "Tomorrow",
        wage,
        contractorPhone: cleanPhone,
      });

      setMatches(res.matches);
      setCreatedJobId(res.job.id);
    } catch (err: any) {
      alert(err.message || "Failed to search workers");
    } finally {
      setIsSearchingManual(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-md mx-auto p-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>ElevenLabs Conversational Voice Agent</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
          {t("hireTitle")}
        </h2>
        <p className="text-xs text-slate-600 max-w-xs mx-auto">
          {t("hireSubtitle")}
        </p>
        <div className="flex justify-center">
          <SpeakButton text={t("hireSubtitle")} size="sm" />
        </div>
      </div>

      {/* Contractor Phone Input */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
          {t("contractorPhonePrompt")}
        </label>
        <div className="relative">
          <input
            type="tel"
            inputMode="numeric"
            value={contractorPhone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="98450 12345"
            className={`w-full min-h-[56px] text-lg font-bold px-4 rounded-2xl border-2 transition-all outline-none ${
              isPhoneValid
                ? "border-emerald-500 bg-emerald-50/20"
                : "border-slate-200 focus:border-brand-500 bg-slate-50"
            }`}
          />
        </div>
        {phoneError && (
          <p className="text-xs font-semibold text-rose-600 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            {phoneError}
          </p>
        )}
      </div>

      {/* Conversational Agent Voice Button */}
      {conversation.status === "connected" ? (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto animate-pulse">
            <Mic className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-emerald-950">
              {t("talkingWithAgent")}
            </h4>
            <p className="text-xs text-emerald-800 mt-1">
              "Need 2 electricians near Jayanagar tomorrow, ₹800 a day"
            </p>
          </div>
          <BigButton
            variant="danger"
            icon={<MicOff className="w-5 h-5" />}
            onClick={() => conversation.endSession()}
          >
            {t("stopConversation")}
          </BigButton>
        </div>
      ) : (
        <BigButton
          variant="primary"
          icon={<PhoneCall className="w-6 h-6 text-brand-200" />}
          subtitle="Speaks English, Hindi & Kannada"
          onClick={handleStartConversation}
          disabled={!isPhoneValid}
        >
          {t("startVoiceHiring")}
        </BigButton>
      )}

      {/* Quick Search Controls (Direct Fallback for offline demo) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Or Quick Select Search
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="font-bold text-slate-600 block mb-1">Trade</label>
            <select
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className="w-full min-h-[48px] px-3 py-2 rounded-2xl border-2 border-slate-200 bg-slate-50 font-bold text-slate-900 text-sm focus:border-brand-500 outline-none"
            >
              <option value="electrician">Electrician (ವಿದ್ಯುತ್)</option>
              <option value="plumber">Plumber (ಪ್ಲಂಬರ್)</option>
              <option value="mason">Mason (ಗಾರೆ)</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-600 block mb-1">Locality</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full min-h-[48px] px-3 py-2 rounded-2xl border-2 border-slate-200 bg-slate-50 font-bold text-slate-900 text-sm focus:border-brand-500 outline-none"
            >
              <option value="Jayanagar">Jayanagar</option>
              <option value="Koramangala">Koramangala</option>
              <option value="BTM Layout">BTM Layout</option>
              <option value="Indiranagar">Indiranagar</option>
              <option value="Whitefield">Whitefield</option>
              <option value="Rajajinagar">Rajajinagar</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleManualSearch}
          disabled={!isPhoneValid || isSearchingManual}
          className="w-full min-h-[50px] py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Search className="w-4 h-4 text-brand-600" />
          <span>Find Verified Workers Nearby</span>
        </button>
      </div>

      {/* Live Job Status & Acceptance Polling */}
      {createdJobId && (
        <JobStatus jobId={createdJobId} />
      )}

      {/* Ranked Candidate Match Cards */}
      {matches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
              {t("matchedWorkers")} ({matches.length})
            </h3>
          </div>

          <div className="space-y-3">
            {matches.map((m: any) => (
              <div
                key={m.workerId}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base font-extrabold text-slate-900">
                        {m.name}
                      </span>
                      {m.verified && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-xs text-slate-500 capitalize font-medium">
                      {m.trade} • {m.area} ({m.distanceKm} km away)
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                    Level {m.level}
                  </span>
                </div>

                {/* Spoken Reason Sentence */}
                <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-700 font-medium border border-slate-100">
                  💬 "{m.reason}"
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs font-bold text-amber-600 flex items-center">
                    <Star className="w-3.5 h-3.5 mr-1 fill-amber-500" />
                    {m.avgRating ? `${m.avgRating}★` : "No ratings yet"}
                  </div>

                  <Link
                    to={m.passportUrl}
                    target="_blank"
                    className="text-xs font-extrabold text-brand-600 underline"
                  >
                    View Public Passport →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
