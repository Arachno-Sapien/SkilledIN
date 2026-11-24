import React, { useState, useEffect, useRef, useId } from "react";
import { Mic, Square } from "lucide-react";
import { recordAudio } from "../lib/media";
import { formatClock } from "../lib/speech";
import { useLanguage } from "../i18n";

export type MicErrorKind = "denied" | "nomic" | "unsupported";

interface MicButtonProps {
  onRecorded: (audioBase64: string, mimeType: string) => void;
  isProcessing?: boolean;
  promptText?: string;
  /** When given, the parent shows the error (e.g. with a "type instead" option); otherwise MicButton shows it inline. */
  onError?: (kind: MicErrorKind) => void;
}

// Long enough for "name, trade, area" or a short review; keeps the upload well under the Lambda body limit.
const MAX_SECONDS = 30;

// t() keys (strings/common.ts) for each kind; exported so a parent with onError shows the same words.
export const micErrorKey: Record<MicErrorKind, string> = {
  denied: "micPermission",
  nomic: "noDevice",
  unsupported: "mediaUnsupported",
};

function micErrorKind(err: unknown): MicErrorKind {
  const name = (err as { name?: string } | null)?.name;
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "NotReadableError") {
    return "nomic";
  }
  if (name === "NotSupportedError") return "unsupported";
  return "denied"; // NotAllowedError / SecurityError: the user or the browser blocked the mic
}

export const MicButton: React.FC<MicButtonProps> = ({
  onRecorded,
  isProcessing = false,
  promptText,
  onError,
}) => {
  const { t } = useLanguage();
  const statusId = useId();
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<MicErrorKind | null>(null);

  // Refs, not state: the unmount cleanup and the double-tap guard must see the latest value synchronously.
  const handleRef = useRef<{ stop: () => Promise<{ audioBase64: string; mimeType: string }> } | null>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      // Leaving the page mid-recording must release the microphone (the browser's red mic dot).
      mountedRef.current = false;
      handleRef.current?.stop().catch(() => {});
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isRecording]);

  const report = (kind: MicErrorKind) => {
    if (onError) onError(kind);
    else setError(kind);
  };

  const stop = async () => {
    const handle = handleRef.current;
    if (!handle || busyRef.current) return;
    busyRef.current = true;
    handleRef.current = null;
    setIsRecording(false);
    try {
      const result = await handle.stop();
      if (mountedRef.current) onRecorded(result.audioBase64, result.mimeType);
    } catch (err) {
      console.error("Stop recording failed:", err);
    } finally {
      busyRef.current = false;
    }
  };

  const start = async () => {
    if (busyRef.current || isProcessing) return;
    busyRef.current = true;
    setError(null);
    try {
      // Plain http on a phone has no navigator.mediaDevices at all, so check before calling getUserMedia.
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        report("unsupported");
        return;
      }
      const handle = await recordAudio();
      if (!mountedRef.current) {
        handle.stop().catch(() => {});
        return;
      }
      handleRef.current = handle;
      setSeconds(0);
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access failed:", err);
      report(micErrorKind(err));
    } finally {
      busyRef.current = false;
    }
  };

  // Auto-stop so a forgotten recording cannot run on and produce an oversized upload.
  useEffect(() => {
    if (isRecording && seconds >= MAX_SECONDS) void stop();
  }, [isRecording, seconds]);

  const status = isRecording ? t("micListening") : isProcessing ? t("micProcessing") : promptText || t("micPrompt");

  return (
    <div className="flex flex-col items-center justify-center space-y-3 my-4">
      <div className="relative">
        {isRecording && (
          <>
            <span aria-hidden="true" className="absolute inset-0 rounded-full bg-rose-400 opacity-75 motion-safe:animate-ping" />
            <span aria-hidden="true" className="absolute -inset-2 rounded-full bg-rose-200 opacity-50 motion-safe:animate-pulse" />
          </>
        )}

        {/* A toggle: the name stays "Speak" and aria-pressed says whether it is recording.
            aria-disabled (not disabled) keeps keyboard focus on the button while the answer is processed;
            start() already ignores taps then. */}
        <button
          type="button"
          onClick={isRecording ? stop : start}
          aria-disabled={isProcessing}
          aria-label={t("micSpeak")}
          aria-pressed={isRecording}
          aria-busy={isProcessing}
          aria-describedby={statusId}
          className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-xl motion-safe:active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 focus-visible:ring-offset-2 ${
            isRecording
              ? "bg-rose-600 text-white shadow-rose-600/40"
              : isProcessing
              ? "bg-slate-200 text-slate-700 cursor-not-allowed"
              : "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30 motion-safe:hover:scale-105"
          }`}
        >
          {isRecording ? (
            <>
              <Square aria-hidden="true" className="w-8 h-8 fill-current" />
              <span className="text-sm font-mono font-bold mt-1">{formatClock(seconds)}</span>
            </>
          ) : isProcessing ? (
            <div
              aria-hidden="true"
              className="motion-safe:animate-spin h-7 w-7 border-2 border-slate-500 border-t-transparent rounded-full"
            />
          ) : (
            <>
              <Mic aria-hidden="true" className="w-10 h-10" />
              <span className="text-sm font-bold mt-0.5">{t("micSpeak")}</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center max-w-xs space-y-2">
        <p id={statusId} role="status" aria-live="polite" className="text-base font-semibold text-slate-700">
          {status}
        </p>
        {error && (
          <p role="alert" className="text-base font-semibold text-rose-700">
            {t(micErrorKey[error])}
          </p>
        )}
      </div>
    </div>
  );
};
