import React, { useState } from "react";
import { Volume2, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n";
import { api } from "../api";

interface SpeakButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const audioCache = new Map<string, string>();

/**
 * Voice fallback chain:
 * 1. Cache hit -> play instant
 * 2. Backend /api/voice/tts -> play audioBase64
 * 3. window.speechSynthesis (kn-IN / hi-IN / en-IN)
 * 4. Graceful visual status
 */
export const SpeakButton: React.FC<SpeakButtonProps> = ({
  text,
  className = "",
  size = "md",
}) => {
  const { lang } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const speak = async () => {
    if (playing || loading) return;

    const cacheKey = `${lang}::${text}`;
    if (audioCache.has(cacheKey)) {
      const base64 = audioCache.get(cacheKey)!;
      playBase64(base64);
      return;
    }

    setLoading(true);
    try {
      const res = await api.getTts(text, lang);
      if (res.audioBase64) {
        audioCache.set(cacheKey, res.audioBase64);
        playBase64(res.audioBase64);
        setLoading(false);
        return;
      }
    } catch {
      // Fall through to browser speech synthesis
    }

    // Browser SpeechSynthesis fallback
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : "en-IN";
      utter.onstart = () => {
        setLoading(false);
        setPlaying(true);
      };
      utter.onend = () => setPlaying(false);
      utter.onerror = () => {
        setLoading(false);
        setPlaying(false);
      };
      window.speechSynthesis.speak(utter);
    } else {
      setLoading(false);
    }
  };

  const playBase64 = (base64: string) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      setPlaying(true);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      audio.play().catch(() => setPlaying(false));
    } catch {
      setPlaying(false);
    }
  };

  const sizeClasses = {
    sm: "w-10 h-10 p-2",
    md: "w-12 h-12 p-3",
    lg: "w-14 h-14 p-3.5",
  };

  return (
    <button
      type="button"
      onClick={speak}
      disabled={loading || playing}
      className={`rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center transition-all shadow-sm active:scale-95 disabled:opacity-75 ${
        sizeClasses[size]
      } ${className}`}
      title="Listen (🔊)"
      aria-label="Listen to instructions"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
      ) : (
        <Volume2 className={`w-5 h-5 ${playing ? "animate-pulse text-brand-600" : ""}`} />
      )}
    </button>
  );
};
