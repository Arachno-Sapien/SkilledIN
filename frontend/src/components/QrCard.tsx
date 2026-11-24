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

export const QrCard: React.FC<QrCardProps> = ({ workerId, workerName, trade, area, level }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const { t } = useLanguage();

  const passportUrl = `${window.location.origin}/p/${workerId}`;
  // Only levels 0-3 have labels; clamp so a bad value never shows a raw key like "workerLevel4".
  const levelLabel = t(`workerLevel${Math.min(3, Math.max(0, Math.floor(level || 0)))}`);
  // Unknown trades fall back to the stored word instead of showing the raw "trade_x" key.
  const tradeKey = `trade_${trade}`;
  const tradeLabel = t(tradeKey) === tradeKey ? trade : t(tradeKey);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        passportUrl,
        { width: 220, margin: 2, color: { dark: "#0c3b6e", light: "#ffffff" } },
        (err) => {
          if (err) console.error("QR Code error:", err);
        }
      );
    }
  }, [passportUrl]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 4000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleShare = () => {
    sharePassport(
      t("qrCardShareTitle"),
      t("qrCardShareText", { name: workerName, trade: tradeLabel, area }),
      passportUrl
    );
  };

  // navigator.clipboard is missing on plain-http phone previews and can reject; report either way.
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(passportUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = `SkilledIN-${workerName.replace(/\s+/g, "_")}.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  const actionClass =
    "min-h-[56px] flex flex-col items-center justify-center gap-0.5 p-2 rounded-2xl font-bold text-sm leading-tight text-center transition-all active:scale-95 border";

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col items-center text-center">
      <div className="mb-3">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
          <span aria-hidden="true">⭐</span>
          {levelLabel}
        </span>
      </div>

      <div className="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-inner">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={t("qrCardAlt", { name: workerName })}
          className="rounded-lg max-w-[200px] h-auto"
        />
      </div>

      <h2 className="mt-4 text-xl font-extrabold text-slate-900 leading-tight">{workerName}</h2>
      <p className="text-sm font-semibold text-slate-600">
        {tradeLabel} • {area}
      </p>

      <div className="grid grid-cols-3 gap-2 w-full mt-5">
        <button
          type="button"
          onClick={handleShare}
          className={`${actionClass} bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/60`}
        >
          <Share2 aria-hidden="true" className="w-5 h-5 text-emerald-700" />
          <span>{t("qrCardShare")}</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className={`${actionClass} bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200`}
        >
          {copyState === "copied" ? (
            <Check aria-hidden="true" className="w-5 h-5 text-emerald-700" />
          ) : (
            <Copy aria-hidden="true" className="w-5 h-5 text-slate-600" />
          )}
          <span>{t("qrCardCopy")}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className={`${actionClass} bg-brand-50 hover:bg-brand-100 text-brand-800 border-brand-200/60`}
        >
          <Download aria-hidden="true" className="w-5 h-5 text-brand-700" />
          <span>{t("qrCardSave")}</span>
        </button>
      </div>

      {/* Always mounted so screen readers announce the copy result when the text appears. */}
      <p
        role="status"
        className={`text-sm font-semibold min-h-[1.25rem] mt-2 ${
          copyState === "failed" ? "text-rose-700" : "text-emerald-700"
        }`}
      >
        {copyState === "copied" ? t("qrCardCopied") : copyState === "failed" ? t("qrCardCopyFailed") : ""}
      </p>
    </div>
  );
};
