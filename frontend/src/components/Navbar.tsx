import React from "react";
import { Link } from "react-router-dom";
import { useLanguage, type Language } from "../i18n";
import { ShieldCheck, Globe, Volume2 } from "lucide-react";

export const Navbar: React.FC = () => {
  const { lang, setLang } = useLanguage();

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    // Audio greeting on switch
    try {
      const greetings: Record<Language, string> = {
        en: "Language set to English",
        hi: "भाषा हिंदी चुनी गई",
        kn: "ಕನ್ನಡ ಭಾಷೆ ಆಯ್ಕೆಯಾಗಿದೆ",
      };
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(greetings[newLang]);
        utter.lang = newLang === "kn" ? "kn-IN" : newLang === "hi" ? "hi-IN" : "en-IN";
        window.speechSynthesis.speak(utter);
      }
    } catch {}
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white block leading-tight">
              Skilled<span className="text-brand-400">IN</span>
            </span>
            <span className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold block">
              Skill Passport
            </span>
          </div>
        </Link>

        {/* Multilingual Selector Pills with Mobile-Optimized Touch Target (min 40px) */}
        <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700 shadow-inner">
          <button
            onClick={() => handleLangChange("kn")}
            className={`min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center ${
              lang === "kn"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                : "text-slate-300 hover:text-white"
            }`}
            title="ಕನ್ನಡ"
            aria-label="Switch language to Kannada"
          >
            ಕನ್ನಡ
          </button>
          <button
            onClick={() => handleLangChange("hi")}
            className={`min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center ${
              lang === "hi"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                : "text-slate-300 hover:text-white"
            }`}
            title="हिंदी"
            aria-label="Switch language to Hindi"
          >
            हिंदी
          </button>
          <button
            onClick={() => handleLangChange("en")}
            className={`min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center ${
              lang === "en"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                : "text-slate-300 hover:text-white"
            }`}
            title="English"
            aria-label="Switch language to English"
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
};
