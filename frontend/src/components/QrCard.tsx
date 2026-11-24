import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Share2, Copy, Check, Download } from "lucide-react";
import { sharePassport } from "../lib/media";
import { useLanguage } from "../i18n";

interface QrCardProps {
  workerId: string;
  workerName: string;
  trade: string;
  area: string;
  level: number;
}

export const QrCard: React.FC<QrCardProps> = ({
  workerId,
  workerName,
  trade,
  area,
  level,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const { lang, t } = useLanguage();

  const passportUrl = `${window.location.origin}/p/${workerId}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        passportUrl,
        {
          width: 220,
          margin: 2,
          color: {
            dark: "#0c3b6e",
            light: "#ffffff",
          },
        },
        (err) => {
          if (err) console.error("QR Code error:", err);
        }
      );
    }
  }, [passportUrl]);

  const handleShare = () => {
    const text = `Check out my verified skill passport on SkilledIN: ${workerName} (${trade}), ${area}.`;
    sharePassport("My SkilledIN Passport", text, passportUrl);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(passportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = `SkilledIN-${workerName.replace(/\s+/g, "_")}.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  const levelLabels: Record<number, string> = {
    0: "Registered",
    1: "Verified Level 1",
    2: "Experienced Level 2",
    3: "Master Level 3",
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col items-center text-center">
      <div className="mb-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
          ⭐ {levelLabels[level] || "Verified"}
        </span>
      </div>

      <div className="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-inner">
        <canvas ref={canvasRef} className="rounded-lg max-w-[200px] h-auto" />
      </div>

      <h3 className="mt-4 text-xl font-extrabold text-slate-900 leading-tight">
        {workerName}
      </h3>
      <p className="text-sm font-semibold text-slate-500 capitalize">
        {trade} • {area}
      </p>

      {/* Share / Copy / Download Action Buttons (Mobile-Optimized min 48px targets) */}
      <div className="grid grid-cols-3 gap-2 w-full mt-5">
        <button
          onClick={handleShare}
          className="min-h-[50px] flex flex-col items-center justify-center p-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-all active:scale-95 border border-emerald-200/60"
          title="Share to WhatsApp / Phone"
        >
          <Share2 className="w-5 h-5 mb-0.5 text-emerald-600" />
          <span>Share</span>
        </button>

        <button
          onClick={handleCopy}
          className="min-h-[50px] flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all active:scale-95 border border-slate-200"
          title="Copy passport URL"
        >
          {copied ? (
            <Check className="w-5 h-5 text-emerald-600 mb-0.5" />
          ) : (
            <Copy className="w-5 h-5 mb-0.5 text-slate-600" />
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>

        <button
          onClick={handleDownload}
          className="min-h-[50px] flex flex-col items-center justify-center p-2 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-800 font-bold text-xs transition-all active:scale-95 border border-brand-200/60"
          title="Download QR code"
        >
          <Download className="w-5 h-5 mb-0.5 text-brand-600" />
          <span>QR Save</span>
        </button>
      </div>
    </div>
  );
};
