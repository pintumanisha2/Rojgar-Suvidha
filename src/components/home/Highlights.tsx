import { UploadCloud, ChevronRight, ShieldCheck, Clock, Star, PlayCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Highlights() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 sm:py-3">

      {/* ── Mobile: 2 compact side-by-side buttons, minimal height ── */}
      <div className="sm:hidden grid grid-cols-2 gap-2">
        <Link
          href="/apply-for-me"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-700 text-white px-3 py-2.5 rounded-xl font-bold text-xs shadow active:scale-95 transition-transform"
        >
          <UploadCloud className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="leading-tight">Apply For Me<br /><span className="text-indigo-200 font-medium text-[10px]">Expert team • Error-free</span></span>
        </Link>
        <a
          href="https://youtube.com/@rojgarsuvidha"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-3 py-2.5 rounded-xl font-bold text-xs shadow border border-slate-700 active:scale-95 transition-transform"
        >
          <PlayCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="leading-tight">Watch Videos<br /><span className="text-gray-400 font-medium text-[10px]">Free tutorials • YouTube</span></span>
        </a>
      </div>

      {/* ── Desktop: Full detailed cards ── */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-4">

        {/* Apply For Me */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 text-white shadow-lg border border-indigo-600/40">
          <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-orange-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">⭐ Most Popular</span>
          </div>
          <div className="relative z-10 p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="bg-orange-500/20 p-2 rounded-xl border border-orange-400/30 shrink-0">
                <UploadCloud className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-extrabold leading-tight">Form Bharne Ka Tension?</h2>
            </div>
            <p className="text-sm text-indigo-100/90 leading-relaxed mb-4">
              Sirf <strong className="text-white">documents upload</strong> karo — hamari expert team baaki sab karegi. Zero mistakes, zero rejection.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              {[{ val: "500+", label: "Forms Done" }, { val: "100%", label: "Accurate" }, { val: "₹99", label: "Only" }].map(({ val, label }) => (
                <div key={label} className="bg-white/10 rounded-xl py-2 px-1 border border-white/10">
                  <p className="text-base font-extrabold text-white">{val}</p>
                  <p className="text-[10px] text-indigo-200 font-medium">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mb-4 text-xs font-bold flex-wrap">
              <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="w-3.5 h-3.5" /> Secure</span>
              <span className="flex items-center gap-1 text-blue-300"><Clock className="w-3.5 h-3.5" /> 24hr</span>
              <span className="flex items-center gap-1 text-yellow-400"><Star className="w-3.5 h-3.5" /> 4.9★</span>
            </div>
            <Link href="/apply-for-me" className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-5 py-3 rounded-xl text-sm font-extrabold shadow-lg transition-all active:scale-95 w-full">
              Mera Form Bharo <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* YouTube */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg border border-slate-700/50">
          <div className="absolute right-0 top-0 w-36 h-36 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="bg-red-500/20 p-2 rounded-xl border border-red-500/30 shrink-0">
                <PlayCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-xl font-extrabold leading-tight">Khud Form Bharna Seekho — Free!</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Har nayi vacancy ka <strong className="text-white">step-by-step video</strong> hamare channel par.
            </p>
            <ul className="space-y-2 mb-4">
              {["Photo & Signature resize karna", "Fee payment karna", "Final form submit karna"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />{item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mb-4 font-medium">📺 12,800+ students already subscribed</p>
            <a href="https://youtube.com/@rojgarsuvidha" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl text-sm font-extrabold shadow-lg transition-all active:scale-95 w-full">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" /></svg>
              Subscribe karo — Free hai!
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
