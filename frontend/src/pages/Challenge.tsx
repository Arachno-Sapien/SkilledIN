import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  api,
  type ApiError,
  type ChallengeInfo,
  type ChallengeResult,
  type Localized,
} from "../api";
import { useLanguage } from "../i18n";
import {
  startCameraStream,
  recordVideoWithFrames,
  uploadVideoToS3,
  type VideoRecording,
} from "../lib/media";
import { speak, stopSpeaking, formatClock } from "../lib/speech";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";
import { BadgeCard } from "../components/BadgeCard";
import {
  Camera,
  Square,
  Sparkles,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  ArrowLeft,
  Loader2,
  UserPlus,
} from "lucide-react";

const DURATION_SEC = 90;
const WORKER_KEY = "skilledin_worker_id";

type Stage = "consent" | "recording" | "analyzing" | "result";
// What the main button in the error box does.
type ErrorAction = "load" | "start" | "send" | "newCode" | "register";
interface ScreenError {
  key: string;
  action: ErrorAction;
}

// Spoken digit by digit ("4 7 2"), not as "four hundred seventy-two".
const spaced = (code: string) => code.split("").join(" ");

function cameraErrorKey(err: unknown): string {
  switch ((err as { name?: string } | null)?.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "cameraPermission";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "noDevice";
    case "NotSupportedError":
      return "mediaUnsupported";
    case "NotReadableError":
    case "TrackStartError":
      return "chCameraBusy";
    default:
      return "chCameraFailed";
  }
}

export const Challenge: React.FC = () => {
  const { id: workerId, skillId } = useParams<{ id: string; skillId: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const [stage, setStage] = useState<Stage>("consent");
  const [phase, setPhase] = useState<"uploading" | "checking">("uploading");
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SEC);
  const [cameraReady, setCameraReady] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [error, setError] = useState<ScreenError | null>(null);

  // Async work (create, upload, submit) can finish after the page is gone; drop those results.
  const aliveRef = useRef(true);
  // Only the newest createChallenge wins (StrictMode double mount, fast Retry taps).
  const loadSeqRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<ReturnType<typeof recordVideoWithFrames> | null>(null);
  // A finished take waiting to be sent: Retry re-sends it instead of asking for a new recording.
  const pendingRef = useRef<{ recording: VideoRecording; uploaded: boolean } | null>(null);
  const sendingRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Discards any take in progress and turns the camera light off.
  const stopCamera = () => {
    recorderRef.current?.cancel();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  // replace: Back from the passport must not reopen the challenge (and create another code).
  const backToPassport = () => navigate(`/w/${workerId}`, { replace: true });

  const statusHeading = (status: ChallengeResult["status"]) =>
    t(
      status === "PASS"
        ? "challengePassed"
        : status === "REVIEW"
        ? "challengeReview"
        : "challengeFailed"
    );

  const stepText = (id: string, text?: Localized) => {
    const source = text ?? challenge?.checklist.find((c) => c.id === id)?.text;
    return source ? source[lang] || source.en : id;
  };

  const resultSpeech = (res: ChallengeResult) =>
    [
      statusHeading(res.status),
      res.feedback,
      res.status === "REVIEW" ? t("chReviewNote") : "",
      res.tip ?? "",
    ]
      .filter(Boolean)
      .join(" ");

  // Used on open, Retake and "Get a new code". Every attempt gets a fresh challenge: new code,
  // new upload slot and a new 15-minute window, so a retake is never answered with the old result.
  const loadChallenge = async () => {
    if (!workerId || !skillId) return;
    const seq = ++loadSeqRef.current;
    stopSpeaking();
    pendingRef.current = null;
    setError(null);
    setResult(null);
    setChallenge(null);
    setSecondsLeft(DURATION_SEC);
    setStage("consent");
    try {
      // The language is fixed here: the code audio and task text use what is on screen now.
      const data = await api.createChallenge(workerId, skillId, lang);
      if (!aliveRef.current || seq !== loadSeqRef.current) return;
      setChallenge(data);
      void speak(t("chCodeSpeech", { code: spaced(data.code) }), lang, data.audioBase64);
    } catch (err) {
      if (!aliveRef.current || seq !== loadSeqRef.current) return;
      console.error("Challenge init failed:", err);
      const code = (err as ApiError | null)?.code;
      setError(
        code === "NOT_FOUND"
          ? { key: "chPassportMissing", action: "register" }
          : { key: code === "NETWORK" ? "networkError" : "chLoadError", action: "load" }
      );
    }
  };

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      // Leaving the page: silence audio, drop any take and release the camera.
      aliveRef.current = false;
      stopSpeaking();
      stopCamera();
    };
  }, []);

  // Not keyed on lang: switching language must not throw away the code the worker just heard.
  useEffect(() => {
    void loadChallenge();
  }, [workerId, skillId]);

  // The camera starts only after the recording stage has rendered, so the <video> element exists.
  // (Starting it in the click handler read a null ref: black preview, frozen timer, dead Finish.)
  useEffect(() => {
    if (stage !== "recording") return;
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await startCameraStream(video);
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        recorderRef.current = recordVideoWithFrames(stream, video, DURATION_SEC, setSecondsLeft);
        setCameraReady(true);
      } catch (err) {
        if (cancelled) return;
        console.error("Camera start failed:", err);
        stopCamera();
        setError({ key: cameraErrorKey(err), action: "start" });
        setStage("consent");
      }
    })();
    return () => {
      cancelled = true;
      // Any way out of recording except Finish (Cancel, error, leaving) discards the take.
      stopCamera();
    };
  }, [stage]);

  // Move focus with the screen so screen-reader users hear the new stage. The error box only
  // takes focus when it replaces the stage content; elsewhere role="alert" announces it.
  useEffect(() => {
    (error && stage === "analyzing" ? errorRef.current : headingRef.current)?.focus();
  }, [stage, error]);

  const handleStart = () => {
    if (!challenge) return;
    // The phone must be silent while recording: its speaker saying the code would satisfy the code check.
    stopSpeaking();
    pendingRef.current = null;
    setError(null);
    setCameraReady(false);
    setSecondsLeft(DURATION_SEC);
    setStage("recording");
  };

  const handleCancel = () => {
    // The challenge is still open, so the worker can start again with the same code.
    setSecondsLeft(DURATION_SEC);
    setStage("consent");
  };

  const sendRecording = async () => {
    const pending = pendingRef.current;
    if (!pending || !challenge || sendingRef.current) return;
    sendingRef.current = true;
    setError(null);
    setStage("analyzing");
    try {
      if (pending.recording.frames.length === 0) {
        // Nothing the AI could grade; the challenge is still open, so record again with the same code.
        pendingRef.current = null;
        setError({ key: "chNoPicture", action: "start" });
        return;
      }
      if (!pending.uploaded) {
        setPhase("uploading");
        try {
          await uploadVideoToS3(challenge.upload, pending.recording.videoBlob);
        } catch (err) {
          console.error("Video upload failed:", err);
          if (!aliveRef.current) return;
          // The upload slot dies with the challenge (15 min); retrying it would fail forever.
          const expired = Date.parse(challenge.expiresAt) <= Date.now();
          setError(
            expired
              ? { key: "chExpired", action: "newCode" }
              : { key: "chUploadFailed", action: "send" }
          );
          if (expired) pendingRef.current = null;
          return;
        }
        pending.uploaded = true;
      }
      if (!aliveRef.current) return;
      setPhase("checking");
      const res = await api.submitChallenge(
        challenge.challengeId,
        pending.recording.frames,
        pending.recording.audio ?? undefined
      );
      if (!aliveRef.current) return;
      pendingRef.current = null;
      setResult(res);
      setStage("result");
      void speak(resultSpeech(res), lang, res.audioBase64);
    } catch (err) {
      if (!aliveRef.current) return;
      console.error("Submit challenge failed:", err);
      const code = (err as ApiError | null)?.code;
      if (code === "EXPIRED" || code === "NOT_FOUND") {
        pendingRef.current = null;
        setError({ key: "chExpired", action: "newCode" });
      } else if (code === "VIDEO_MISSING") {
        pending.uploaded = false;
        setError({ key: "chVideoMissing", action: "send" });
      } else {
        setError({ key: code === "NETWORK" ? "networkError" : "chSubmitFailed", action: "send" });
      }
    } finally {
      sendingRef.current = false;
    }
  };

  const handleFinish = () => {
    const recorder = recorderRef.current;
    if (!recorder) return; // camera not ready yet, or already finishing (double tap / timer)
    recorderRef.current = null; // keeps the stage cleanup from discarding this take
    const take = recorder.stop();
    setPhase("uploading");
    setStage("analyzing");
    void speak(t("chAnalyzingSpeech"), lang);
    take.then(
      (recording) => {
        pendingRef.current = { recording, uploaded: false };
        void sendRecording();
      },
      (err) => {
        console.error("Recording stop failed:", err);
        if (aliveRef.current) setError({ key: "chNoPicture", action: "start" });
      }
    );
  };

  // The recorder's countdown reached zero: finish as if the worker tapped Finish.
  useEffect(() => {
    if (stage === "recording" && cameraReady && secondsLeft <= 0) handleFinish();
  }, [stage, cameraReady, secondsLeft]);

  const registerAgain = () => {
    if (localStorage.getItem(WORKER_KEY) === workerId) localStorage.removeItem(WORKER_KEY);
    navigate("/w/start", { replace: true });
  };

  const errorButton = (e: ScreenError) => {
    switch (e.action) {
      case "load":
        return { label: t("retry"), run: () => void loadChallenge(), icon: RotateCcw };
      case "newCode":
        return { label: t("chNewCode"), run: () => void loadChallenge(), icon: RotateCcw };
      case "start":
        return {
          label: e.key === "chNoPicture" ? t("chRecordAgain") : t("retry"),
          run: handleStart,
          icon: Camera,
        };
      case "send":
        return { label: t("retry"), run: () => void sendRecording(), icon: RotateCcw };
      case "register":
        return { label: t("chRegisterAgain"), run: registerAgain, icon: UserPlus };
    }
  };

  // Announce the time left at 60, 30 and 10 seconds only, not every second.
  const timeMark = [10, 30, 60].find((m) => secondsLeft <= m);

  const renderError = (e: ScreenError) => {
    const btn = errorButton(e);
    const Icon = btn.icon;
    return (
      <div
        ref={errorRef}
        tabIndex={-1}
        className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 space-y-3"
      >
        <p role="alert" className="flex items-start gap-2 text-base font-semibold text-rose-800">
          <AlertCircle aria-hidden="true" className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <span>{t(e.key)}</span>
        </p>
        <BigButton
          variant="primary"
          icon={<Icon aria-hidden="true" className="w-5 h-5" />}
          onClick={btn.run}
          disabled={e.action === "start" && !challenge}
        >
          {btn.label}
        </BigButton>
        {/* The consent screen already has its own Back button. */}
        {stage !== "consent" && (
          <BigButton
            variant="outline"
            icon={<ArrowLeft aria-hidden="true" className="w-5 h-5" />}
            onClick={backToPassport}
          >
            {t("chBackToPassport")}
          </BigButton>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-md mx-auto p-4 py-6 flex flex-col gap-6">
      {error && renderError(error)}

      {/* STAGE 1: Consent & briefing */}
      {stage === "consent" && (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-sm font-bold border border-emerald-200">
              <Sparkles aria-hidden="true" className="w-4 h-4" />
              <span>{t("chLiveBadge")}</span>
            </div>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-extrabold text-slate-900 leading-tight"
            >
              {t("challengeConsentTitle")}
            </h1>
            <div className="flex items-start gap-3 text-left">
              <p className="flex-1 text-base text-slate-700">
                {challenge?.task || t("challengeConsentBody")}
              </p>
              <SpeakButton text={challenge?.task || t("challengeConsentBody")} size="lg" />
            </div>
          </div>

          {!challenge && !error && (
            <p
              role="status"
              className="flex items-center justify-center gap-2 text-base font-semibold text-slate-700"
            >
              <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" />
              {t("chGettingCode")}
            </p>
          )}

          {challenge && (
            <section
              aria-labelledby="ch-code-title"
              className="bg-brand-50 border-2 border-brand-300 rounded-3xl p-5 text-center space-y-2 shadow-sm"
            >
              <h2
                id="ch-code-title"
                className="text-sm font-bold uppercase tracking-wider text-brand-800"
              >
                {t("chCodeTitle")}
              </h2>
              <p className="text-5xl font-black tracking-widest text-brand-900 font-mono">
                {challenge.code}
              </p>
              <p className="text-base text-brand-900 font-medium">{t("chCodeHint")}</p>
              <div className="flex justify-center pt-1">
                <SpeakButton
                  text={t("chCodeSpeech", { code: spaced(challenge.code) })}
                  size="lg"
                />
              </div>
            </section>
          )}

          {challenge && challenge.checklist.length > 0 && (
            <section
              aria-labelledby="ch-steps-title"
              className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2"
            >
              <h2
                id="ch-steps-title"
                className="text-sm font-extrabold uppercase tracking-wider text-slate-700"
              >
                {t("chChecklistTitle")}
              </h2>
              <ul className="space-y-2">
                {challenge.checklist.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-base text-slate-800">
                    <span aria-hidden="true" className="text-emerald-700 font-bold">
                      •
                    </span>
                    <span>
                      {item.text[lang] || item.text.en}
                      {item.safetyCritical && (
                        <span className="block text-sm text-amber-800 font-bold">
                          {t("chSafetyCritical")}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="space-y-3">
            <BigButton
              variant="verified"
              icon={<Camera aria-hidden="true" className="w-6 h-6" />}
              onClick={handleStart}
              disabled={!challenge}
            >
              {t("startChallenge")}
            </BigButton>
            <BigButton
              variant="outline"
              icon={<ArrowLeft aria-hidden="true" className="w-5 h-5" />}
              onClick={backToPassport}
            >
              {t("chBackToPassport")}
            </BigButton>
          </div>
        </div>
      )}

      {/* STAGE 2: In-app camera recording with a big code overlay */}
      {stage === "recording" && (
        <div className="relative flex flex-col justify-between h-[75vh] min-h-[440px] rounded-3xl overflow-hidden bg-black shadow-2xl">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="relative z-20 flex items-center justify-between gap-2 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="flex items-center gap-2 bg-rose-700 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow"
            >
              <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              {t("chRecordingNow")}
            </h2>
            <div
              role="timer"
              aria-label={t("chSecondsLeft", { n: secondsLeft })}
              className="bg-black/70 text-white font-mono font-bold text-lg px-4 py-1.5 rounded-full border border-white/30"
            >
              {formatClock(secondsLeft)}
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            {timeMark ? t("chSecondsLeft", { n: timeMark }) : ""}
          </p>

          <div className="relative z-20 self-center text-center space-y-3 px-4">
            {!cameraReady && (
              <p
                role="status"
                className="flex items-center justify-center gap-2 bg-black/70 text-white text-base font-semibold px-4 py-2 rounded-2xl"
              >
                <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" />
                {t("chStartingCamera")}
              </p>
            )}
            <div className="bg-black/70 border-2 border-white/40 px-6 py-3 rounded-3xl shadow-2xl select-none">
              <span className="block text-sm uppercase font-bold tracking-widest text-white">
                {t("chSayThisCode")}
              </span>
              <span className="block text-5xl font-black text-amber-300 font-mono tracking-widest">
                {challenge?.code}
              </span>
            </div>
          </div>

          <div className="relative z-20 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-[56px] px-5 rounded-full bg-white text-slate-900 text-base font-bold flex items-center gap-2 shadow-lg active:scale-95"
            >
              <X aria-hidden="true" className="w-6 h-6" />
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={!cameraReady}
              className="w-24 h-24 rounded-full bg-rose-700 hover:bg-rose-800 text-white flex flex-col items-center justify-center shadow-2xl active:scale-95 border-4 border-white transition-all disabled:opacity-60 disabled:active:scale-100"
            >
              <Square aria-hidden="true" className="w-8 h-8 fill-current" />
              <span className="text-sm font-bold mt-1">{t("chFinish")}</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: Uploading, then AI checking */}
      {stage === "analyzing" && !error && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center space-y-6 my-auto text-center p-6"
        >
          <div aria-hidden="true" className="relative w-28 h-28">
            <div className="absolute inset-0 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
            <div className="absolute inset-3 rounded-full bg-brand-50 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-brand-600 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold text-slate-900">
              {phase === "uploading" ? t("chUploading") : t("checkingVideo")}
            </h2>
            <p className="text-base text-slate-700 max-w-xs">{t("chAnalyzingBody")}</p>
          </div>
        </div>
      )}

      {/* STAGE 4: Graded result */}
      {stage === "result" && result && (
        <div className="space-y-6">
          <div
            role="status"
            className={`p-6 rounded-3xl text-center space-y-3 shadow-sm border-2 ${
              result.status === "PASS"
                ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                : result.status === "REVIEW"
                ? "bg-amber-50 border-amber-400 text-amber-900"
                : "bg-rose-50 border-rose-400 text-rose-900"
            }`}
          >
            <div
              aria-hidden="true"
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-md mx-auto"
            >
              {result.status === "PASS" ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              ) : result.status === "REVIEW" ? (
                <AlertCircle className="w-8 h-8 text-amber-700" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-700" />
              )}
            </div>

            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold leading-tight">
              {statusHeading(result.status)}
            </h2>

            {result.feedback && <p className="text-base font-semibold">{result.feedback}</p>}
            {result.status === "REVIEW" && (
              <p className="text-base font-semibold">{t("chReviewNote")}</p>
            )}

            {result.tip && (
              <div className="p-3 bg-white rounded-2xl text-base font-bold text-slate-800 border border-slate-200 text-left">
                <span className="block text-sm uppercase tracking-wider text-slate-700">
                  {t("chTip")}
                </span>
                {result.tip}
              </div>
            )}

            <div className="flex justify-center">
              <SpeakButton text={resultSpeech(result)} size="lg" />
            </div>
          </div>

          {/* Non-PASS: show which steps were seen, so the retake fixes the right thing. */}
          {result.status !== "PASS" && result.items.length > 0 && (
            <section
              aria-labelledby="ch-seen-title"
              className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2"
            >
              <h3
                id="ch-seen-title"
                className="text-sm font-extrabold uppercase tracking-wider text-slate-700"
              >
                {t("chStepsTitle")}
              </h3>
              <ul className="space-y-2">
                {result.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 text-base text-slate-800"
                  >
                    {item.status === "seen" ? (
                      <CheckCircle2 aria-hidden="true" className="w-6 h-6 text-emerald-700 flex-shrink-0" />
                    ) : item.status === "unclear" ? (
                      <HelpCircle aria-hidden="true" className="w-6 h-6 text-amber-700 flex-shrink-0" />
                    ) : (
                      <XCircle aria-hidden="true" className="w-6 h-6 text-rose-700 flex-shrink-0" />
                    )}
                    <span className="flex-1">
                      {stepText(item.id, item.text)}
                      <span
                        className={`block text-sm font-bold ${
                          item.status === "seen"
                            ? "text-emerald-800"
                            : item.status === "unclear"
                            ? "text-amber-800"
                            : "text-rose-800"
                        }`}
                      >
                        {t(
                          item.status === "seen"
                            ? "chSeen"
                            : item.status === "unclear"
                            ? "chUnclear"
                            : "chNotSeen"
                        )}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.status === "PASS" && (
            <BadgeCard
              badge={{
                skillId: result.skillId || skillId || "",
                score: result.score ?? 0,
                createdAt: result.createdAt ?? new Date().toISOString(),
                daysAgo: 0,
                items: result.items,
              }}
              skillDetails={result.title ? { title: result.title } : undefined}
            />
          )}

          <div className="space-y-3">
            {result.status !== "PASS" && (
              <BigButton
                variant="warning"
                icon={<RotateCcw aria-hidden="true" className="w-5 h-5" />}
                onClick={() => void loadChallenge()}
              >
                {t("retakeChallenge")}
              </BigButton>
            )}
            <BigButton
              variant={result.status === "PASS" ? "verified" : "outline"}
              icon={
                result.status === "PASS" ? undefined : (
                  <ArrowLeft aria-hidden="true" className="w-5 h-5" />
                )
              }
              onClick={backToPassport}
            >
              {result.status === "PASS" ? t("chGoToPassport") : t("chBackToPassport")}
            </BigButton>
          </div>
        </div>
      )}
    </div>
  );
};
