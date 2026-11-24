import React, { useEffect, useRef, useState } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n";
import { speak, stopSpeaking } from "../lib/speech";

interface SpeakButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// speak() already plays one utterance at a time; this only keeps the buttons' UI in step,
// so a button whose speech was replaced by another button's goes back to "Listen".
let resetOwner: (() => void) | null = null;

/**
 * Tap to hear `text` in the current language (ElevenLabs first, browser voice fallback, via lib/speech).
 * Tap again to stop. Never disabled, so the worker can always silence it.
 */
export const SpeakButton: React.FC<SpeakButtonProps> = ({ text, className = "", size = "md" }) => {
  const { lang, t } = useLanguage();
  const [phase, setPhase] = useState<"idle" | "loading" | "playing">("idle");
  const timer = useRef<number>();
  const active = useRef(false);

  // Stable identity (only touches refs and the state setter) so `resetOwner === reset` works across renders.
  const reset = useRef(() => {
    window.clearTimeout(timer.current);
    active.current = false;
    if (resetOwner === reset) resetOwner = null;
    setPhase("idle");
  }).current;

  // Leaving the screen stops this button's audio so it does not keep talking over the next page.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (active.current && resetOwner === reset) {
        resetOwner = null;
        stopSpeaking();
      }
      active.current = false;
    },
    [reset]
  );

  const handleClick = async () => {
    if (phase !== "idle") {
      if (resetOwner === reset) stopSpeaking();
      reset();
      return;
    }
    resetOwner?.();
    resetOwner = reset;
    active.current = true;
    setPhase("loading");
    await speak(text, lang);
    if (!active.current) return; // stopped, replaced or unmounted while the audio was loading
    setPhase("playing");
    // ponytail: speak() has no "ended" signal, so Stop shows for an estimated reading time — add an onEnd callback to lib/speech.ts if exact timing matters.
    timer.current = window.setTimeout(reset, Math.max(3000, text.length * 90));
  };

  const sizeClasses = { sm: "w-12 h-12", md: "w-14 h-14", lg: "w-16 h-16" };
  const iconClasses = { sm: "w-5 h-5", md: "w-6 h-6", lg: "w-7 h-7" };
  const busy = phase !== "idle";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={busy ? t("stopAudio") : t("listen")}
      className={`flex-shrink-0 rounded-full border flex items-center justify-center transition-all shadow-sm active:scale-95 ${
        busy
          ? "bg-brand-600 border-brand-700 text-white"
          : "bg-brand-50 hover:bg-brand-100 border-brand-200 text-brand-700"
      } ${sizeClasses[size]} ${className}`}
    >
      {phase === "loading" ? (
        <Loader2 aria-hidden="true" className={`${iconClasses[size]} animate-spin`} />
      ) : phase === "playing" ? (
        <Square aria-hidden="true" className={`${iconClasses[size]} fill-current`} />
      ) : (
        <Volume2 aria-hidden="true" className={iconClasses[size]} />
      )}
    </button>
  );
};
