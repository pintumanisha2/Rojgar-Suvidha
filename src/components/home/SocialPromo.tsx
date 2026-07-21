// Server Component — compact design, minimal vertical space on mobile
import { Send, MessageCircle, TrendingUp } from "lucide-react";

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
          <a href="https://t.me/rojgarsuvidha" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 bg-sky-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
            <Send className="w-3 h-3" /> TG
          </a>
          <a href="https://whatsapp.com/channel/rojgarsuvidha" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 bg-[#25D366] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
            <MessageCircle className="w-3 h-3" /> WA
          </a>
          <a href="https://youtube.com/@rojgarsuvidha" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" /></svg>
            YT
          </a>
        </div>
      </div>

      {/* Desktop view — full cards with stats */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        <a href="https://t.me/rojgarsuvidha" target="_blank" rel="noopener noreferrer"
          className="relative overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl p-4 flex items-center justify-between gap-3 text-white shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div className="bg-white/25 p-2 rounded-xl"><Send className="w-5 h-5" /></div>
            <div><p className="font-extrabold text-sm">JOIN TELEGRAM</p><p className="text-xs text-blue-100 mt-0.5">48,000+ members</p></div>
          </div>
          <span className="bg-white/20 border border-white/30 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">FREE</span>
        </a>
        <a href="https://whatsapp.com/channel/rojgarsuvidha" target="_blank" rel="noopener noreferrer"
          className="relative overflow-hidden bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl p-4 flex items-center justify-between gap-3 text-white shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div className="relative bg-white/25 p-2 rounded-xl">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white/40" /></span>
            </div>
            <div><p className="font-extrabold text-sm">JOIN WHATSAPP</p><p className="text-xs text-green-100 mt-0.5">32,000+ members</p></div>
          </div>
          <span className="bg-white/20 border border-white/30 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">FREE</span>
        </a>
        <a href="https://youtube.com/@rojgarsuvidha" target="_blank" rel="noopener noreferrer"
          className="relative overflow-hidden bg-gradient-to-br from-red-600 to-rose-700 rounded-xl p-4 flex items-center justify-between gap-3 text-white shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div className="bg-white/25 p-2 rounded-xl"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" /></svg></div>
            <div><p className="font-extrabold text-sm">SUBSCRIBE</p><p className="text-xs text-red-100 mt-0.5">13,000+ subscribers</p></div>
          </div>
          <span className="bg-white/20 border border-white/30 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">FREE</span>
        </a>
      </div>
    </section>
  );
}
