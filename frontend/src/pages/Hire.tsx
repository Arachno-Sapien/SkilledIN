import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useConversation } from "@elevenlabs/react";
import { ELEVENLABS_AGENT_ID } from "../config";
import { useLanguage } from "../i18n";
import { api, type ApiError } from "../api";
import { normalisePhone } from "../lib/phone";
import { tradeLabel } from "../strings/other";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";
import { JobStatus } from "../components/JobStatus";
import {
  PhoneCall,
  Sparkles,
  Star,
  CheckCircle2,
  AlertTriangle,
  Mic,
  MicOff,
  Search,
} from "lucide-react";

// Bordered, labelled, keyboard-visible form controls; slate-400 borders stay visible on cheap screens.
const fieldClass =
  "w-full min-h-[48px] px-3 py-2 rounded-2xl border-2 border-slate-400 bg-slate-50 font-bold text-slate-900 text-base focus:border-brand-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300";

export const Hire: React.FC = () => {
  const { t } = useLanguage();
  const phoneRef = useRef<HTMLInputElement>(null);

  const [contractorPhone, setContractorPhone] = useState("");
  // Error state holds i18n keys, so a language switch re-translates a visible error.
  const [phoneError, setPhoneError] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Hiring Results & Active Job State
  // any: api.createJob returns untyped match objects from POST /api/jobs.
  const [matches, setMatches] = useState<any[]>([]);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  // Manual fallback fields (for offline / direct testing)
  const [trade, setTrade] = useState<string>("electrician");
  const [area, setArea] = useState<string>("Jayanagar");
  const [count, setCount] = useState<number>(1);
  const [wage, setWage] = useState<number>(800);

  // ElevenLabs Client Tool Definition
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

  // Buttons stay enabled so every tap gives feedback; a greyed-out button just looks broken.
  const requirePhone = (): boolean => {
    if (isPhoneValid) return true;
    setPhoneError("hire_phoneInvalid");
    phoneRef.current?.focus();
    return false;
  };

  const handleStartConversation = async () => {
    if (!requirePhone()) return;

    if (ELEVENLABS_AGENT_ID) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // This call only asks for permission; release the mic so it is not left open after the call.
        stream.getTracks().forEach((track) => track.stop());
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
    if (!requirePhone()) return;
    setIsSearchingManual(true);
    setSearchError("");
    try {
      const res = await api.createJob({
        trade,
        count,
        area,
        date: "Tomorrow",
        wage,
        contractorPhone: normalisePhone(contractorPhone),
      });

      setMatches(res.matches);
      setCreatedJobId(res.job.id);
    } catch (err) {
      const code = (err as ApiError)?.code;
      setSearchError(
        code === "AREA_NOT_FOUND"
          ? "hire_areaNotFound"
          : code === "NETWORK"
          ? "networkError"
          : "hire_searchFailed"
      );
    } finally {
      setIsSearchingManual(false);
    }
  };

  const phoneDescribedBy = phoneError
    ? "contractor-phone-error"
    : isPhoneValid
    ? "contractor-phone-ok"
    : undefined;

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-md mx-auto p-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-sm font-bold">
          <Sparkles aria-hidden="true" className="w-4 h-4 text-brand-700" />
          <span>{t("hire_agentBadge")}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
          {t("hireTitle")}
        </h1>
        <p className="text-base text-slate-700 max-w-xs mx-auto">{t("hireSubtitle")}</p>
        <div className="flex justify-center">
          <SpeakButton text={t("hireSubtitle")} size="sm" />
        </div>
      </div>

      {/* Contractor Phone Input */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <label htmlFor="contractor-phone" className="text-sm font-bold text-slate-700 block">
          {t("contractorPhonePrompt")}
        </label>
        <input
          id="contractor-phone"
          ref={phoneRef}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={contractorPhone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="98450 12345"
          aria-invalid={!!phoneError}
          aria-describedby={phoneDescribedBy}
          className={`w-full min-h-[56px] text-lg font-bold px-4 rounded-2xl border-2 transition-all placeholder:text-slate-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 ${
            isPhoneValid
              ? "border-emerald-600 bg-emerald-50/20"
              : phoneError
              ? "border-rose-600 bg-slate-50"
              : "border-slate-400 focus:border-brand-500 bg-slate-50"
          }`}
        />
        {isPhoneValid && (
          <p
            id="contractor-phone-ok"
            className="text-sm font-semibold text-emerald-700 flex items-center gap-1"
          >
            <CheckCircle2 aria-hidden="true" className="w-4 h-4" />
            {t("hire_phoneOk")}
          </p>
        )}
        {phoneError && (
          <p
            id="contractor-phone-error"
            role="alert"
            className="text-sm font-semibold text-rose-700 flex items-center gap-1"
          >
            <AlertTriangle aria-hidden="true" className="w-4 h-4 flex-shrink-0" />
            {t(phoneError)}
          </p>
        )}
      </div>

      {/* Always mounted so screen readers hear the call start; the visual card below appears only once connected. */}
      <p role="status" className="sr-only">
        {conversation.status === "connected" ? t("talkingWithAgent") : ""}
      </p>

      {/* Conversational Agent Voice Button */}
      {conversation.status === "connected" ? (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto animate-pulse">
            <Mic aria-hidden="true" className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-emerald-950">{t("talkingWithAgent")}</h2>
            <p className="text-sm text-emerald-800 mt-1">{t("hire_example")}</p>
          </div>
          <BigButton
            variant="danger"
            icon={<MicOff aria-hidden="true" className="w-5 h-5" />}
            onClick={() => conversation.endSession()}
          >
            {t("stopConversation")}
          </BigButton>
        </div>
      ) : (
        <BigButton
          variant="primary"
          icon={<PhoneCall aria-hidden="true" className="w-6 h-6 text-brand-200" />}
          subtitle={t("hire_languages")}
          onClick={handleStartConversation}
          loading={conversation.status === "connecting"}
        >
          {t("startVoiceHiring")}
        </BigButton>
      )}

      {/* Quick Search Controls (Direct Fallback for offline demo) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          {t("hire_quickSearch")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="hire-trade" className="text-sm font-bold text-slate-700 block mb-1">
              {t("hire_trade")}
            </label>
            <select
              id="hire-trade"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className={fieldClass}
            >
              <option value="electrician">{t("trade_electrician")}</option>
              <option value="plumber">{t("trade_plumber")}</option>
              <option value="mason">{t("trade_mason")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="hire-locality" className="text-sm font-bold text-slate-700 block mb-1">
              {t("hire_locality")}
            </label>
            <select
              id="hire-locality"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className={fieldClass}
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

        <BigButton
          variant="outline"
          icon={<Search aria-hidden="true" className="w-5 h-5 text-brand-700" />}
          onClick={handleManualSearch}
          loading={isSearchingManual}
        >
          {t("hire_findWorkers")}
        </BigButton>
        {searchError && (
          <p role="alert" className="text-sm font-semibold text-rose-700 flex items-center gap-1">
            <AlertTriangle aria-hidden="true" className="w-4 h-4 flex-shrink-0" />
            {t(searchError)}
          </p>
        )}
      </div>

      {/* Live Job Status & Acceptance Polling */}
      {createdJobId && <JobStatus jobId={createdJobId} />}

      {/* Always mounted so the result count (or "none found") is announced when a search finishes. */}
      <div role="status">
        {createdJobId &&
          (matches.length === 0 ? (
            <p className="p-4 bg-white rounded-2xl border border-slate-200 text-center text-base text-slate-700">
              {t("hire_noMatches")}
            </p>
          ) : (
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
              {t("matchedWorkers")} ({matches.length})
            </h2>
          ))}
      </div>

      {/* Ranked Candidate Match Cards */}
      {matches.length > 0 && (
        <ul className="space-y-3">
          {matches.map((m: any) => (
            <li
              key={m.workerId}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{m.name}</h3>
                  {m.verified && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-sm font-bold">
                      <CheckCircle2 aria-hidden="true" className="w-4 h-4" />
                      {t("hire_verified")}
                    </span>
                  )}
                  <p className="text-sm text-slate-600 font-medium">
                    {tradeLabel(t, m.trade)} • {m.area} (
                    {t("hire_distance", { km: Math.round(m.distanceKm * 10) / 10 })})
                  </p>
                </div>

                <span className="inline-flex items-center flex-shrink-0 px-2.5 py-1 rounded-full text-sm font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  {t("hire_level", { n: m.level })}
                </span>
              </div>

              {/* Spoken Reason Sentence (server-localised) */}
              <p className="p-3 bg-slate-50 rounded-2xl text-sm text-slate-700 font-medium border border-slate-100">
                <span aria-hidden="true">💬 </span>"{m.reason}"
              </p>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-sm font-bold text-amber-700 flex items-center">
                  <Star aria-hidden="true" className="w-4 h-4 mr-1 text-amber-500 fill-amber-500" />
                  {m.avgRating ? t("other_rating", { rating: m.avgRating }) : t("other_noRatings")}
                </span>

                {/* New tab on purpose: leaving /hire would end a live ElevenLabs call. */}
                <Link
                  to={m.passportUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center min-h-[48px] px-2 text-sm font-extrabold text-brand-700 underline"
                >
                  {t("other_viewPassport")}
                  <span className="sr-only"> {t("other_newTab")}</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
