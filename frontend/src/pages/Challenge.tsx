import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useLanguage } from "../i18n";
import {
  startCameraStream,
  recordVideoWithFrames,
  uploadVideoToS3,
  playBase64Audio,
} from "../lib/media";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";
import { BadgeCard } from "../components/BadgeCard";
import {
  Video,
  Camera,
  Square,
  Sparkles,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const Challenge: React.FC = () => {
  const { id: workerId, skillId } = useParams<{ id: string; skillId: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const [stage, setStage] = useState<"consent" | "recording" | "analyzing" | "result">("consent");
  const [challengeData, setChallengeData] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [isStopping, setIsStopping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<{
    stop: () => Promise<{ videoBlob: Blob; frames: string[] }>;
  } | null>(null);

  // Initialize Challenge
  useEffect(() => {
    const init = async () => {
      if (!workerId || !skillId) return;
      try {
        const data = await api.createChallenge(workerId, skillId);
        setChallengeData(data);
        setSecondsLeft(90);

        // Auto-play spaced spoken code if returned
        if (data.audioBase64) {
          playBase64Audio(data.audioBase64);
        }
      } catch (err) {
        console.error("Challenge init failed:", err);
        setErrorMessage("Failed to initiate challenge. Please retry.");
      }
    };
    init();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [workerId, skillId]);

  // Start Camera and Video Recording
  const handleStartRecording = async () => {
    setStage("recording");
    try {
      if (!videoRef.current) return;
      const stream = await startCameraStream(videoRef.current);
      streamRef.current = stream;

      const recorder = recordVideoWithFrames(
        stream,
        videoRef.current,
        90,
        (left) => {
          setSecondsLeft(left);
          if (left <= 0) {
            handleStopRecording();
          }
        }
      );
      recorderRef.current = recorder;
    } catch (err) {
      alert("Please allow camera and mic permissions to record your practical challenge.");
      console.error("Camera access error:", err);
      setStage("consent");
    }
  };

  const handleStopRecording = async () => {
    if (isStopping || !recorderRef.current) return;
    setIsStopping(true);
    setStage("analyzing");

    try {
      const { videoBlob, frames } = await recorderRef.current.stop();

      // Stop camera tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // 1. Upload video to S3 / mock upload
      if (challengeData?.upload) {
        await uploadVideoToS3(challengeData.upload, videoBlob);
      }

      // 2. Submit frames to AI grading pipeline
      const gradeResult = await api.submitChallenge(
        challengeData.challengeId,
        frames,
        `Code spoken: ${challengeData.code}`
      );

      setResult(gradeResult);
      setStage("result");

      // Play spoken feedback + tip
      if (gradeResult.audioBase64) {
        playBase64Audio(gradeResult.audioBase64);
      }
    } catch (err) {
      console.error("Submit challenge error:", err);
      setErrorMessage("Video check experienced a network issue. Please retry.");
      setStage("result");
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-md mx-auto p-4 py-6 flex flex-col justify-between">
      {/* STAGE 1: Consent & Briefing */}
      {stage === "consent" && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Live AI Skill Assessment</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {t("challengeConsentTitle")}
            </h2>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              {challengeData?.task || t("challengeConsentBody")}
            </p>
          </div>

          {/* Spoken Code Display Box */}
          {challengeData && (
            <div className="bg-brand-50 border-2 border-brand-300 rounded-3xl p-5 text-center space-y-2 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-700">
                Your Secret Challenge Code
              </div>
              <div className="text-4xl font-black tracking-widest text-brand-900 font-mono">
                {challengeData.code}
              </div>
              <p className="text-xs text-brand-800 font-medium">
                Say this 3-digit code out loud as soon as recording starts.
              </p>
              <div className="flex justify-center pt-1">
                <SpeakButton
                  text={`Your challenge code is ${challengeData.code.split("").join(" ")}. Say it at the start.`}
                  size="md"
                />
              </div>
            </div>
          )}

          {/* Checklist Preview */}
          {challengeData?.checklist && (
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Safety & Practical Checklist
              </div>
              {challengeData.checklist.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-start space-x-2 text-xs text-slate-700 py-1"
                >
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    {item.text[lang] || item.text.en}
                    {item.safetyCritical && (
                      <span className="text-amber-700 font-bold ml-1">
                        (Critical Safety)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          <BigButton
            variant="verified"
            icon={<Camera className="w-6 h-6" />}
            onClick={handleStartRecording}
            disabled={!challengeData}
          >
            {t("startChallenge")}
          </BigButton>
        </div>
      )}

      {/* STAGE 2: In-app Camera Recording with HUGE CODE OVERLAY */}
      {stage === "recording" && (
        <div className="relative flex flex-col justify-between h-[75vh] rounded-3xl overflow-hidden bg-black shadow-2xl">
          {/* Live Video Preview */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Top Bar: Live Timer & Pulse */}
          <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center space-x-2 bg-rose-600/90 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>REC</span>
            </div>

            <div className="bg-black/60 backdrop-blur-md text-white font-mono font-bold text-sm px-3.5 py-1.5 rounded-full border border-white/20">
              0:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
            </div>
          </div>

          {/* HUGE CODE OVERLAY in the center of the camera preview */}
          <div className="relative z-20 self-center pointer-events-none select-none text-center">
            <div className="bg-black/60 backdrop-blur-md border-2 border-white/40 px-6 py-2.5 rounded-3xl shadow-2xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 block">
                SAY THIS CODE:
              </span>
              <span className="text-5xl font-black text-amber-400 font-mono tracking-widest drop-shadow-md">
                {challengeData?.code}
              </span>
            </div>
          </div>

          {/* Bottom Bar: Stop Button */}
          <div className="relative z-20 p-5 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
            <button
              onClick={handleStopRecording}
              disabled={isStopping}
              className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex flex-col items-center justify-center shadow-2xl active:scale-95 border-4 border-white transition-all"
            >
              <Square className="w-8 h-8 fill-current" />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                Finish
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: AI Analyzing Pipeline */}
      {stage === "analyzing" && (
        <div className="flex flex-col items-center justify-center space-y-6 my-auto text-center p-6">
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
            <div className="absolute inset-3 rounded-full bg-brand-50 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-brand-600 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">
              {t("checkingVideo")}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Claude AI is inspecting your video frames against safety rules and spoken code verification…
            </p>
          </div>
        </div>
      )}

      {/* STAGE 4: Graded Result */}
      {stage === "result" && result && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`p-6 rounded-3xl text-center space-y-2 shadow-sm border-2 ${
              result.status === "PASS"
                ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                : result.status === "REVIEW"
                ? "bg-amber-50 border-amber-400 text-amber-900"
                : "bg-rose-50 border-rose-400 text-rose-900"
            }`}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-md mx-auto mb-1">
              {result.status === "PASS" ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              ) : result.status === "REVIEW" ? (
                <AlertCircle className="w-8 h-8 text-amber-600" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-600" />
              )}
            </div>

            <h3 className="text-xl font-extrabold leading-tight">
              {result.status === "PASS"
                ? t("challengePassed")
                : result.status === "REVIEW"
                ? t("challengeReview")
                : t("challengeFailed")}
            </h3>

            <p className="text-xs font-semibold max-w-xs mx-auto">
              {result.feedback}
            </p>

            {/* Retake tip from backend tips.json */}
            {result.tip && (
              <div className="mt-3 p-3 bg-white/80 rounded-2xl text-xs font-bold text-slate-800 border border-current/20">
                💡 Tip: {result.tip}
              </div>
            )}
          </div>

          {/* Earned Badge Card */}
          {result.status === "PASS" && (
            <BadgeCard
              badge={{
                skillId: result.skillId || skillId || "",
                score: result.score || 88,
                createdAt: new Date().toISOString(),
                daysAgo: 0,
                items: result.items,
              }}
            />
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <BigButton
              variant={result.status === "PASS" ? "verified" : "outline"}
              onClick={() => navigate(`/w/${workerId}`)}
            >
              {result.status === "PASS" ? "Go to My Passport" : "Back to Home"}
            </BigButton>

            {result.status !== "PASS" && (
              <BigButton
                variant="warning"
                icon={<RotateCcw className="w-5 h-5" />}
                onClick={() => {
                  setStage("consent");
                  setResult(null);
                }}
              >
                {t("retakeChallenge")}
              </BigButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
