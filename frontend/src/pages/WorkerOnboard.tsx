import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MicButton, micErrorKey, type MicErrorKind } from "../components/MicButton";
import { SpeakButton } from "../components/SpeakButton";
import { BigButton } from "../components/BigButton";
import { useLanguage } from "../i18n";
import { api, type ApiError } from "../api";
import { normalisePhone } from "../lib/phone";
import { speak, stopSpeaking } from "../lib/speech";
import { Check, RotateCcw, AlertTriangle, ArrowRight, ArrowLeft, Keyboard } from "lucide-react";

type Step = "voice" | "confirm" | "phone";
type Trade = "electrician" | "plumber" | "mason" | "other";
const TRADES: Trade[] = ["electrician", "plumber", "mason", "other"];

// Strips the same prefixes as normalisePhone, so "+91 98450 12345" counts as 10 digits, not 12.
const nationalDigits = (raw: string): string => {
  const d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d;
};

const inputClass = (invalid: boolean) =>
  `w-full min-h-[56px] text-lg font-bold px-4 rounded-2xl border-2 bg-white text-slate-900 placeholder:text-slate-500 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 ${
    invalid ? "border-rose-600 bg-rose-50" : "border-slate-300 focus:border-brand-600"
  }`;

const Alert: React.FC<{ id?: string; children: React.ReactNode }> = ({ id, children }) => (
  <div
    id={id}
    role="alert"
    className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-300 text-base font-semibold text-rose-800 text-left"
  >
    <AlertTriangle aria-hidden="true" className="w-5 h-5 flex-shrink-0 mt-0.5" />
    <span>{children}</span>
  </div>
);

export const WorkerOnboard: React.FC = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const [step, setStep] = useState<Step>("voice");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");

  // Spoken and typed answers fill the same fields, so a worker can mix both.
  const [name, setName] = useState("");
  const [trade, setTrade] = useState<Trade>("other");
  const [area, setArea] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const areaRef = useRef<HTMLInputElement>(null);
  const focusAreaNext = useRef(false);
  const alive = useRef(true);

  // A prompt still playing, or a late voice result, should not follow the worker off this page.
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopSpeaking();
    };
  }, []);

  // Move focus with the step so keyboard and screen-reader users land on the new content.
  useEffect(() => {
    if (focusAreaNext.current) {
      focusAreaNext.current = false;
      areaRef.current?.focus();
    } else if (step !== "phone") {
      headingRef.current?.focus(); // the phone step autofocuses its input instead
    }
  }, [step]);

  const say = (text: string, audio?: string | null) => {
    if (alive.current) void speak(text, lang, audio);
  };

  // Every voice problem is both shown (role="alert") and spoken, in the chosen language.
  const failVoice = (msg: string) => {
    setVoiceError(msg);
    say(msg);
  };

  const failPhone = (msg: string) => {
    setPhoneError(msg);
    say(msg);
  };

  const readBackFor = (n: string, tr: Trade, a: string) =>
    t("onbReadBack", { name: n, trade: t(`trade_${tr}`), area: a });

  const handleVoiceRecorded = async (audioBase64: string, mimeType: string) => {
    setVoiceError("");
    setIsProcessing(true);
    try {
      const { text = "" } = await api.transcribeVoice(audioBase64, mimeType, lang);
      setTranscript(text);
      if (text.trim().length < 3) {
        failVoice(t("onbVoiceNotCaught"));
        return;
      }

      const parsed = await api.parseWorkerSpeech(text, lang);
      // Merge with earlier answers: a worker who re-speaks only the area keeps the name heard before.
      const n = parsed.name?.trim() || name;
      const a = parsed.area?.trim() || area;
      const tr = parsed.trade !== "other" ? parsed.trade : trade;
      setName(n);
      setArea(a);
      setTrade(tr);

      if (!n || !a) {
        failVoice(t(!n && !a ? "onbVoiceNotCaught" : !n ? "onbVoiceMissingName" : "onbVoiceMissingArea"));
        return;
      }

      setConfirmError("");
      setStep("confirm");
      // The server read-back (with its ElevenLabs audio) describes only this utterance,
      // so use it when that utterance alone produced every field; otherwise read back the merged answer.
      if (parsed.name && parsed.area && parsed.trade === tr && parsed.readBack) {
        say(parsed.readBack, parsed.audioBase64);
      } else {
        say(readBackFor(n, tr, a));
      }
    } catch (err) {
      console.error("Onboard voice error:", err);
      failVoice(t((err as ApiError)?.code === "NETWORK" ? "networkError" : "onbVoiceFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicError = (kind: MicErrorKind) => failVoice(`${t(micErrorKey[kind])} ${t("onbTypeHint")}`);

  const handleTypeInstead = () => {
    setVoiceError("");
    setStep("confirm");
    say(t("onbConfirmHint"));
  };

  const handleSayAgain = () => {
    // "Say it again" is a fresh start; Back keeps the answers so far.
    setName("");
    setArea("");
    setTrade("other");
    setTranscript("");
    setVoiceError("");
    setConfirmError("");
    setStep("voice");
    say(t("onboardInstruction"));
  };

  const handleBack = () => {
    stopSpeaking();
    if (step === "phone") setStep("confirm");
    else if (step === "confirm") setStep("voice");
    else navigate("/");
  };

  const canConfirm = name.trim() !== "" && area.trim() !== "";

  const handleConfirmYes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;
    setName(name.trim());
    setArea(area.trim());
    setConfirmError("");
    setPhoneError("");
    setStep("phone");
    say(t("onbPhoneSpeak"));
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setPhoneError("");
    let cleanPhone: string;
    try {
      cleanPhone = normalisePhone(phone);
    } catch {
      failPhone(t("onbPhoneInvalid"));
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createWorker({ name: name.trim(), phone: cleanPhone, trade, area: area.trim(), lang });
      localStorage.setItem("skilledin_worker_id", created.id);
      // replace: Back from the passport must not reopen a half-filled registration form.
      // WorkerHome confirms the save only after it reads the profile back from the server.
      navigate(`/w/${created.id}`, {
        replace: true,
        state: created.existing ? { recovered: true } : { justCreated: true },
      });
    } catch (err) {
      const code = (err as ApiError)?.code;
      if (code === "AREA_NOT_FOUND") {
        // Fix the area where it can be edited; the typed phone number stays in state for the return trip.
        const msg = t("onbAreaNotFound");
        setConfirmError(msg);
        focusAreaNext.current = true;
        setStep("confirm");
        say(msg);
      } else {
        failPhone(
          t(
            code === "CONFLICT"
              ? "onbPhoneTaken"
              : code === "NETWORK"
              ? "networkError"
              : code === "INTERNAL"
              ? "saveError"
              : "genericError"
          )
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const national = nationalDigits(phone);
  const isPhoneValid = /^[6-9]\d{9}$/.test(national);

  const heading = step === "voice" ? t("onboardTitle") : step === "confirm" ? t("confirmDetails") : t("enterPhone");
  const speakText =
    step === "voice"
      ? t("onboardInstruction")
      : step === "confirm"
      ? canConfirm
        ? readBackFor(name.trim(), trade, area.trim())
        : t("onbConfirmHint")
      : t("onbPhoneSpeak");

  const backButton = (
    <BigButton
      type="button"
      variant="outline"
      icon={<ArrowLeft aria-hidden="true" className="w-6 h-6 text-slate-600" />}
      onClick={handleBack}
      disabled={isSubmitting}
    >
      {t("back")}
    </BigButton>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-md mx-auto p-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-extrabold text-slate-900 leading-tight focus:outline-none"
        >
          {heading}
        </h1>
        <SpeakButton text={speakText} size="lg" className="flex-shrink-0" />
      </div>

      {step === "voice" && (
        <div className="space-y-5 text-center">
          <p className="p-4 bg-brand-50 border border-brand-200 rounded-3xl text-base font-medium text-brand-900">
            {t("onboardInstruction")}
          </p>

          <MicButton
            onRecorded={handleVoiceRecorded}
            isProcessing={isProcessing}
            promptText={t("tapToSpeak")}
            onError={handleMicError}
          />

          {voiceError && <Alert>{voiceError}</Alert>}

          {transcript && (
            <p className="p-3 bg-white rounded-2xl border border-slate-200 text-sm text-slate-700 text-left">
              <span className="font-bold">{t("onbWeHeard")}</span> <span className="italic">“{transcript}”</span>
            </p>
          )}

          <BigButton
            type="button"
            variant="outline"
            icon={<Keyboard aria-hidden="true" className="w-6 h-6 text-slate-600" />}
            onClick={handleTypeInstead}
            disabled={isProcessing}
          >
            {t("onbTypeInstead")}
          </BigButton>
          {backButton}
        </div>
      )}

      {step === "confirm" && (
        <form onSubmit={handleConfirmYes} noValidate className="space-y-5">
          <p className="text-base text-slate-700">{t("onbConfirmHint")}</p>

          {confirmError && <Alert id="confirm-error">{confirmError}</Alert>}

          <div className="space-y-2">
            <label htmlFor="worker-name" className="block text-base font-bold text-slate-800">
              {t("onbNameLabel")}
            </label>
            <input
              id="worker-name"
              type="text"
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass(false)}
            />
          </div>

          <fieldset>
            <legend className="block text-base font-bold text-slate-800 mb-2">{t("onbTradeLabel")}</legend>
            <div className="grid grid-cols-2 gap-3" role="group" aria-label={t("onbTradeLabel")}>
              {TRADES.map((tr) => (
                <button
                  key={tr}
                  type="button"
                  aria-pressed={trade === tr}
                  onClick={() => setTrade(tr)}
                  className={`flex items-center justify-center gap-2 min-h-[56px] px-3 rounded-2xl border-2 text-base font-bold text-center ${
                    trade === tr
                      ? "border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-300"
                      : "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
                  }`}
                >
                  {trade === tr && <Check aria-hidden="true" className="w-5 h-5 flex-shrink-0" />}
                  {t(`trade_${tr}`)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="worker-area" className="block text-base font-bold text-slate-800">
              {t("onbAreaLabel")}
            </label>
            <input
              id="worker-area"
              ref={areaRef}
              type="text"
              maxLength={80}
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                setConfirmError("");
              }}
              aria-invalid={!!confirmError}
              aria-describedby={confirmError ? "confirm-error" : undefined}
              className={inputClass(!!confirmError)}
            />
          </div>

          {!canConfirm && (
            <p id="confirm-missing" className="text-base font-semibold text-slate-700">
              {t("onbFillMissing")}
            </p>
          )}

          <BigButton
            type="submit"
            variant="primary"
            icon={<Check aria-hidden="true" className="w-6 h-6" />}
            disabled={!canConfirm}
            aria-describedby={canConfirm ? undefined : "confirm-missing"}
          >
            {t("confirmYes")}
          </BigButton>
          <BigButton
            type="button"
            variant="outline"
            icon={<RotateCcw aria-hidden="true" className="w-6 h-6 text-slate-600" />}
            onClick={handleSayAgain}
          >
            {t("sayAgain")}
          </BigButton>
          {backButton}
        </form>
      )}

      {step === "phone" && (
        <form onSubmit={handlePhoneSubmit} noValidate className="space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <label htmlFor="worker-phone" className="block text-base font-bold text-slate-800">
              {t("phonePlaceholder")}
            </label>
            <input
              id="worker-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              autoFocus
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError("");
              }}
              placeholder="98450 12345"
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? "phone-count phone-error" : "phone-count"}
              className={`${inputClass(!!phoneError)} text-xl`}
            />
            <p
              id="phone-count"
              className={`flex items-center gap-1 text-sm font-bold ${
                national.length > 10 ? "text-rose-700" : isPhoneValid ? "text-emerald-700" : "text-slate-600"
              }`}
            >
              {isPhoneValid && <Check aria-hidden="true" className="w-4 h-4" />}
              {t("onbDigitCount", { count: national.length })}
            </p>
            {phoneError && <Alert id="phone-error">{phoneError}</Alert>}
          </div>

          <BigButton
            type="submit"
            variant="primary"
            icon={<ArrowRight aria-hidden="true" className="w-6 h-6" />}
            loading={isSubmitting}
            disabled={!isPhoneValid}
          >
            {t("createPassport")}
          </BigButton>
          {backButton}
        </form>
      )}
    </div>
  );
};
