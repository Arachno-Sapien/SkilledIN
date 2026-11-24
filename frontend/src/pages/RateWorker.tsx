import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useLanguage } from "../i18n";
import { MicButton } from "../components/MicButton";
import { BigButton } from "../components/BigButton";
import { SpeakButton } from "../components/SpeakButton";
import { Star, CheckCircle2, ArrowRight } from "lucide-react";

export const RateWorker: React.FC = () => {
  const { id: workerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const [rating, setRating] = useState<number>(5);
  const [customerName, setCustomerName] = useState("");
  const [audioBase64, setAudioBase64] = useState<string | undefined>();
  const [mimeType, setMimeType] = useState<string>("audio/webm");
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAudioRecorded = (base64: string, type: string) => {
    setAudioBase64(base64);
    setMimeType(type);
    setVoiceRecorded(true);
  };

  const handleSubmit = async () => {
    if (!workerId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.createStamp({
        workerId,
        rating,
        audioBase64,
        mimeType,
        customerName: customerName.trim() || "Customer",
      });
      setSubmitted(true);
      setTimeout(() => {
        navigate(`/p/${workerId}`);
      }, 2500);
    } catch (err) {
      alert("Could not submit stamp. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-6 py-16 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
        <h3 className="text-2xl font-extrabold text-slate-900">
          {t("stampSubmitted")}
        </h3>
        <p className="text-xs text-slate-500">
          Redirecting to worker passport…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-md mx-auto p-4 py-6 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {t("rateTitle")}
          </h2>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            {t("rateInstructions")}
          </p>
          <div className="flex justify-center">
            <SpeakButton text={t("rateInstructions")} size="sm" />
          </div>
        </div>

        {/* 1-5 Star Selection */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Work Quality Rating
          </span>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-2 transition-transform active:scale-90"
              >
                <Star
                  className={`w-9 h-9 ${
                    star <= rating
                      ? "text-amber-500 fill-amber-500"
                      : "text-slate-200 fill-slate-100"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-extrabold text-slate-800">
            {rating} of 5 Stars
          </span>
        </div>

        {/* Optional Customer Name */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Your Name (Optional)
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Ramesh K"
            className="w-full px-4 py-3 text-sm font-semibold rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
          />
        </div>

        {/* Optional Voice Note Recording */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            5-Second Voice Note (Optional)
          </span>
          <MicButton
            onRecorded={handleAudioRecorded}
            promptText={
              voiceRecorded
                ? "✔ Voice note recorded!"
                : "Hold & speak your feedback"
            }
          />
        </div>

        <BigButton
          variant="verified"
          icon={<ArrowRight className="w-6 h-6" />}
          onClick={handleSubmit}
          loading={isSubmitting}
        >
          {t("submitStamp")}
        </BigButton>
      </div>
    </div>
  );
};
