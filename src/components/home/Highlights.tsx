import { PlayCircle, UploadCloud, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Highlights() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
      {/* Mobile: 2 compact columns | Desktop: 60/40 split */}
      <div className="grid grid-cols-2 lg:grid-cols-[1.5fr_1fr] gap-2 sm:gap-4">

        {/* ── Apply For Me ── */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-800 to-violet-900 text-white shadow-md border border-indigo-700/50 group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />

          {/* Mobile: compact vertical | Desktop: horizontal */}
          <div className="relative z-10 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-5 h-full">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                <UploadCloud className="w-4 h-4 sm:w-6 sm:h-6 text-orange-400 shrink-0" />
                <h2 className="text-[11px] sm:text-xl font-bold leading-tight">
                  Form Bharne Ka<br className="sm:hidden" /> Time Nahi?
                </h2>
              </div>

              {/* Description — hidden on mobile */}
              <p className="hidden sm:block text-sm text-indigo-100/90 leading-relaxed mb-3 sm:pr-4">
                Cyber cafe ya mistakes ka tension chodiye. Apne documents upload karein, hamari expert team aapka form official tarike se bilkul sahi-sahi bharegi.
              </p>

              {/* Trust badge */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> 100% Safe, Secure &amp; Error-Free
              </div>

              {/* Mobile trust badge (compact) */}
              <div className="flex sm:hidden items-center gap-1 text-[9px] font-bold text-emerald-400 mt-1">
                <ShieldCheck className="w-3 h-3" /> 100% Safe &amp; Secure
              </div>
            </div>

            <Link
              href="/apply-for-me"
              className="relative z-10 shrink-0 flex items-center justify-center gap-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold shadow-lg transition-transform hover:-translate-y-0.5 whitespace-nowrap"
            >
              Apply For Me <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>

        {/* ── YouTube Promo ── */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md border border-slate-700 group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />

          <div className="relative z-10 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-5 h-full">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                <PlayCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-500 shrink-0" />
                <h3 className="text-[11px] sm:text-lg font-bold leading-tight">
                  Khud Form<br className="sm:hidden" /> Bharna Hai?
                </h3>
              </div>

              {/* Description — hidden on mobile */}
              <p className="hidden sm:block text-sm text-gray-400 leading-relaxed sm:pr-2">
                Hamare YouTube channel par har nayi vacancy ka step-by-step live video tutorial dekhein aur seekhein.
              </p>

              {/* Mobile subtitle (compact) */}
              <p className="block sm:hidden text-[9px] text-gray-400 leading-tight mt-1">
                Step-by-step video tutorials
              </p>
            </div>

            <a
              href="https://youtube.com/@rojgarsuvidha"
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 shrink-0 flex items-center justify-center gap-1 bg-white/10 hover:bg-red-600 text-white border border-white/10 hover:border-red-600 px-3 py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all whitespace-nowrap"
            >
              Watch Video <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
