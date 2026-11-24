import React, { useState, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { recordAudio } from "../lib/media";

interface MicButtonProps {
  onRecorded: (audioBase64: string, mimeType: string) => void;
  isProcessing?: boolean;
  promptText?: string;
}

export const MicButton: React.FC<MicButtonProps> = ({
  onRecorded,
  isProcessing = false,
  promptText,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorderHandle, setRecorderHandle] = useState<{
    stop: () => Promise<{ audioBase64: string; mimeType: string }>;
  } | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggle = async () => {
    if (isRecording && recorderHandle) {
      try {
        const result = await recorderHandle.stop();
        setIsRecording(false);
        setRecorderHandle(null);
        onRecorded(result.audioBase64, result.mimeType);
      } catch (err) {
        console.error("Stop recording failed:", err);
        setIsRecording(false);
      }
    } else if (!isRecording && !isProcessing) {
      try {
        const handle = await recordAudio();
        setRecorderHandle(handle);
        setIsRecording(true);
      } catch (err) {
        alert("Please enable microphone permissions in your browser.");
        console.error("Mic access denied:", err);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 my-4">
      <div className="relative">
        {/* Pulsing rings when recording */}
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-rose-400 opacity-75 animate-ping" />
            <span className="absolute -inset-2 rounded-full bg-rose-200 opacity-50 animate-pulse" />
          </>
        )}

        <button
          type="button"
          onClick={handleToggle}
          disabled={isProcessing}
          className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 ${
            isRecording
              ? "bg-rose-600 text-white shadow-rose-600/40"
              : isProcessing
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30 hover:scale-105"
          }`}
          aria-label={isRecording ? "Stop recording" : "Start speaking"}
        >
          {isRecording ? (
            <>
              <Square className="w-8 h-8 fill-current" />
              <span className="text-xs font-mono font-bold mt-1">
                0:0{seconds}
              </span>
            </>
          ) : isProcessing ? (
            <div className="animate-spin h-7 w-7 border-2 border-slate-400 border-t-transparent rounded-full" />
          ) : (
            <>
              <Mic className="w-10 h-10" />
              <span className="text-[11px] font-bold uppercase tracking-wider mt-0.5">
                Speak
              </span>
            </>
          )}
        </button>
      </div>

      <div className="text-center max-w-xs">
        <p className="text-sm font-semibold text-slate-700">
          {isRecording
            ? "Listening… Tap to finish"
            : isProcessing
            ? "Transcribing voice…"
            : promptText || "Tap the big mic to speak"}
        </p>
      </div>
    </div>
  );
};
