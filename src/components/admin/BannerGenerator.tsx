"use client";

import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, ImageIcon, CheckCircle2, RefreshCw, Upload } from "lucide-react";

interface BannerGeneratorProps {
  title: string;
  lastDate: string;
  appFee: string;
  totalPosts: string;
  category: string;
  onBannerGenerated: (url: string) => void;
}

const THEMES = [
  {
    id: "royal",
    label: "Royal Blue",
    emoji: "🔵",
    grad1: "#1e3a8a",
    grad2: "#4f46e5",
    accent: "#818cf8",
    tag: "#6366f1",
  },
  {
    id: "emerald",
    label: "Emerald",
    emoji: "🟢",
    grad1: "#064e3b",
    grad2: "#059669",
    accent: "#6ee7b7",
    tag: "#10b981",
  },
  {
    id: "crimson",
    label: "Crimson",
    emoji: "🔴",
    grad1: "#7f1d1d",
    grad2: "#dc2626",
    accent: "#fca5a5",
    tag: "#ef4444",
  },
  {
    id: "midnight",
    label: "Midnight",
    emoji: "⚫",
    grad1: "#0f172a",
    grad2: "#1e293b",
    accent: "#94a3b8",
    tag: "#6366f1",
  },
  {
    id: "saffron",
    label: "Saffron",
    emoji: "🟠",
    grad1: "#78350f",
    grad2: "#d97706",
    accent: "#fcd34d",
    tag: "#f59e0b",
  },
];

const BADGE_MAP: Record<string, string> = {
  "latest-jobs": "SARKARI NAUKRI",
  "results": "RESULT OUT",
  "admit-card": "ADMIT CARD",
  "answer-key": "ANSWER KEY",
  "admission": "ADMISSION",
  "news": "LATEST NEWS",
  "private-jobs": "PRIVATE JOB",
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function BannerGenerator({
  title,
  lastDate,
  appFee,
  totalPosts,
  category,
  onBannerGenerated,
}: BannerGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [open, setOpen] = useState(false);

  // Draw banner every time any of the inputs change
  useEffect(() => {
    if (open) drawBanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTheme, title, lastDate, appFee, totalPosts, category, open]);

  const drawBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    const theme = selectedTheme;

    // ── Background Gradient ──
    const grd = ctx.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, theme.grad1);
    grd.addColorStop(1, theme.grad2);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // ── Decorative circles (top-right) ──
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(W - 80, -80, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W - 20, 80, 160, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.04;
    ctx.beginPath();
    ctx.arc(100, H + 60, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── Thin top accent line ──
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, 0, W, 6);

    // ── WEBSITE LOGO / NAME ──
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    drawRoundRect(ctx, 48, 28, 230, 42, 10);
    ctx.fill();
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText("🏆 Rojgar Suvidha", 62, 49);

    // ── Category Badge (top right) ──
    const badge = BADGE_MAP[category] || "LATEST UPDATE";
    ctx.font = "bold 17px Arial";
    const badgeW = ctx.measureText(badge).width + 36;
    ctx.fillStyle = theme.tag;
    drawRoundRect(ctx, W - badgeW - 48, 28, badgeW, 38, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(badge, W - 48 - badgeW / 2, 47);
    ctx.textAlign = "left";

    // ── Main Title ──
    const safeTitle = title && title.trim() ? title : "Job Title Will Appear Here";
    const titleFontSize = safeTitle.length > 60 ? 46 : safeTitle.length > 40 ? 54 : 62;
    ctx.font = `900 ${titleFontSize}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 18;
    ctx.textBaseline = "top";
    const titleBottom = wrapText(ctx, safeTitle, 60, 130, W - 120, titleFontSize + 14);
    ctx.shadowBlur = 0;

    // ── Divider line ──
    const divY = Math.min(titleBottom + 24, H - 170);
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(60, divY, 90, 4);
    ctx.globalAlpha = 1;

    // ── Info Cards (bottom) ──
    const cards: { icon: string; label: string; value: string }[] = [];
    if (totalPosts) cards.push({ icon: "📋", label: "Total Posts", value: totalPosts });
    if (lastDate)   cards.push({ icon: "📅", label: "Last Date",   value: lastDate });
    if (appFee)     cards.push({ icon: "💰", label: "Apply Fee",   value: appFee });

    if (cards.length > 0) {
      const cardH = 100;
      const cardY = H - cardH - 48;
      const gap = 24;
      const cardW = (W - 96 - gap * (cards.length - 1)) / cards.length;

      cards.forEach((card, i) => {
        const cx = 48 + i * (cardW + gap);
        // Glass card
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        drawRoundRect(ctx, cx, cardY, cardW, cardH, 16);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.20)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Icon
        ctx.font = "28px Arial";
        ctx.textBaseline = "top";
        ctx.fillText(card.icon, cx + 18, cardY + 14);

        // Label
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "rgba(255,255,255,0.70)";
        ctx.textBaseline = "top";
        ctx.fillText(card.label, cx + 18, cardY + 52);

        // Value (truncate if too long)
        let valText = card.value;
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffffff";
        if (ctx.measureText(valText).width > cardW - 36) {
          while (ctx.measureText(valText + "…").width > cardW - 36 && valText.length > 4) {
            valText = valText.slice(0, -1);
          }
          valText += "…";
        }
        ctx.fillText(valText, cx + 18, cardY + 70);
      });
    }

    // ── Bottom watermark ──
    ctx.font = "15px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("www.rojgarsuvidha.com", W - 48, H - 18);
    ctx.textAlign = "left";
  };

  const handleUpload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setUploading(true);
    setUploaded(false);
    try {
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/webp", 0.85));
      const fileName = `auto_banner_${Date.now()}.webp`;
      const { error } = await supabase.storage.from("blog_images").upload(fileName, blob, { contentType: "image/webp" });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("blog_images").getPublicUrl(fileName);
      onBannerGenerated(publicUrl);
      setUploaded(true);
      setTimeout(() => setOpen(false), 1500);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => { setOpen(true); setUploaded(false); }}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/25 transition-all active:scale-95"
      >
        <ImageIcon className="h-4 w-4" />
        🎨 Auto-Generate Banner
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  🎨 Auto-Banner Generator
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Premium thumbnail — auto-read from form</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Theme Picker */}
            <div className="flex items-center gap-2 flex-wrap mb-5">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Theme:</span>
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedTheme.id === theme.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {theme.emoji} {theme.label}
                </button>
              ))}
              <button
                type="button"
                onClick={drawBanner}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-600 hover:border-indigo-400 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>

            {/* Auto-Fill Info */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: "Title", value: title || "Not filled yet" },
                { label: "Last Date", value: lastDate || "—" },
                { label: "Fee", value: appFee || "—" },
                { label: "Posts", value: totalPosts || "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs">
                  <span className="text-gray-400 font-medium">{item.label}:</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300 max-w-[140px] truncate">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Canvas Preview */}
            <div className="w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl mb-5 bg-gray-100 dark:bg-gray-800">
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ display: "block" }}
              />
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || uploaded}
              className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                uploaded
                  ? "bg-green-500 text-white shadow-green-500/25"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-indigo-500/25 disabled:opacity-60"
              }`}
            >
              {uploading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Uploading to server...</>
              ) : uploaded ? (
                <><CheckCircle2 className="h-5 w-5" /> Banner Saved! Form mein set ho gaya ✓</>
              ) : (
                <><Upload className="h-5 w-5" /> Use This Banner — Save & Upload</>
              )}
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-2">
              Banner auto-fill hoga form ke "Featured Image" mein. Koi manual step nahi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
