// Server Component — compact design, minimal vertical space on mobile
import { Send, MessageCircle, TrendingUp } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/socialConfig";

export default function SocialPromo() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 sm:py-2">

      {/* ── Mobile: One thin horizontal bar, 3 icon+label pills ── */}
      {/* ── Desktop: 3 full cards with member counts ── */}

      {/* Mobile view — compact single row */}
      <div className="sm:hidden flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2">
        <TrendingUp className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex-1">Join karo — Job alerts FREE:</span>
        <div className="flex gap-1.5 shrink-0">
          <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 bg-sky-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
            <Send className="w-3 h-3" /> TG
          </a>
          <a href={SOCIAL_LINKS.whatsappChannel} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 bg-[#25D366] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
            <MessageCircle className="w-3 h-3" /> WA
          </a>
          <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" /></svg>
            YT
          </a>
        </div>
      </div>

      {/* Desktop view — full cards with stats */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer"
          className="relative overflow-hidden bg-slate-900/90 dark:bg-zinc-900 border border-sky-500/30 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500/20 text-sky-400 p-2 rounded-xl border border-sky-400/20"><Send className="w-4 h-4" /></div>
            <div><p className="font-bold text-xs sm:text-sm text-white">Join Telegram</p><p className="text-xs text-sky-300/80 mt-0.5">48,000+ members</p></div>
          </div>
          <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-bold px-2 py-0.5 rounded-full">FREE</span>
        </a>
        <a href={SOCIAL_LINKS.whatsappChannel} target="_blank" rel="noopener noreferrer"
          className="relative overflow-hidden bg-slate-900/90 dark:bg-zinc-900 border border-emerald-500/30 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div className="relative bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-400/20">
              <MessageCircle className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white/40" /></span>
            </div>
            <div><p className="font-bold text-xs sm:text-sm text-white">Join WhatsApp</p><p className="text-xs text-emerald-300/80 mt-0.5">32,000+ members</p></div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-2 py-0.5 rounded-full">FREE</span>
        </a>
        <a href="https://youtube.com/@rojgarsuvidha" target="_blank" rel="noopener noreferrer"
          className="relative overflow-hidden bg-slate-900/90 dark:bg-zinc-900 border border-rose-500/30 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/20 text-rose-400 p-2 rounded-xl border border-rose-400/20">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" /></svg>
            </div>
            <div><p className="font-bold text-xs sm:text-sm text-white">YouTube</p><p className="text-xs text-rose-300/80 mt-0.5">Subscribe Channel</p></div>
          </div>
          <span className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-bold px-2 py-0.5 rounded-full">LIVE</span>
        </a>
      </div>
    </section>
  );
}
