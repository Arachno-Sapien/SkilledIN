import { api } from "../api";
import type { Language } from "../i18n";

// One place for "say this out loud": ElevenLabs audio first, browser speech as the fallback.
// Only one utterance plays at a time; a newer call (or stopSpeaking) silences the older one.

export const speechLocale = (lang: Language): string =>
  lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : "en-IN";

export const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

let current: HTMLAudioElement | null = null;
let generation = 0;

export function stopSpeaking(): void {
  generation++;
  if (current) {
    current.pause();
    current = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Speaks `text` in `lang`. Pass `audioBase64` when the backend already returned ElevenLabs audio
 * (e.g. /api/workers/parse read-back) to avoid a second TTS call. Resolves when playback starts
 * (or immediately if nothing can play); never throws.
 */
export async function speak(text: string, lang: Language, audioBase64?: string | null): Promise<void> {
  stopSpeaking();
  const mine = generation;
  if (!text && !audioBase64) return;

  let audio = audioBase64 ?? null;
  if (!audio) {
    try {
      audio = (await api.getTts(text, lang)).audioBase64 ?? null;
    } catch {
      audio = null;
    }
  }
  if (mine !== generation) return; // a newer speak() or stopSpeaking() won the race

  if (audio) {
    const el = new Audio(`data:audio/mpeg;base64,${audio}`);
    current = el;
    el.onended = () => {
      if (current === el) current = null;
    };
    await el.play().catch(() => {});
    return;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = speechLocale(lang);
    window.speechSynthesis.speak(utter);
  }
}
