import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { translations, useLanguage, type Language } from "../i18n";
import { speak } from "../lib/speech";

// Autonyms are shown as-is in every UI language so a worker can always find their own language.
const LANGS: { code: Language; label: string; ariaLabel?: string }[] = [
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "hi", label: "हिंदी" },
  { code: "en", label: "EN", ariaLabel: "English" },
];

export const Navbar: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    // Confirm in the NEW language; t() would still read the old one inside this handler.
    speak(translations.navLangSwitched[newLang], newLang);
  };

  // A deep link (QR scan, shared URL) opens with no in-app history, so Back must go Home instead of leaving the app.
  const goBack = () => (location.key === "default" ? navigate("/") : navigate(-1));

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-md mx-auto px-3 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {!isHome && (
            <button
              type="button"
              onClick={goBack}
              className="min-h-[48px] min-w-[48px] px-2 flex items-center gap-1 rounded-xl text-sm font-bold text-white hover:bg-slate-800 active:scale-95"
            >
              <ArrowLeft aria-hidden="true" className="w-5 h-5 flex-shrink-0" />
              <span>{t("back")}</span>
            </button>
          )}
          <Link
            to="/"
            aria-label={t("home")}
            className="min-h-[48px] min-w-[48px] flex items-center gap-2.5 rounded-xl group"
          >
            <img
              src="/logo-96.png"
              alt=""
              aria-hidden="true"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full shadow-md group-hover:scale-105 transition-transform"
            />
            {/* The wordmark only fits beside the Back button at 360 px on the home screen. */}
            {isHome && (
              <div aria-hidden="true">
                <span className="text-xl font-extrabold tracking-tight text-white block leading-tight">
                  Skilled<span className="text-brand-400">IN</span>
                </span>
                <span className="text-xs tracking-wide text-slate-300 font-semibold block">
                  {t("skillPassport")}
                </span>
              </div>
            )}
          </Link>
        </div>

        <div
          role="group"
          aria-label={t("language")}
          className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700 shadow-inner flex-shrink-0"
        >
          {LANGS.map(({ code, label, ariaLabel }) => (
            <button
              key={code}
              type="button"
              lang={code}
              aria-label={ariaLabel}
              aria-pressed={lang === code}
              onClick={() => handleLangChange(code)}
              className={`min-h-[48px] min-w-[48px] px-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                lang === code
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-slate-200 hover:text-white hover:bg-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
