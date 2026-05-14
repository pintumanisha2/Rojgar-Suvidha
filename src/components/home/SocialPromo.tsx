import { Send, MessageCircle } from "lucide-react";

export default function SocialPromo() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
      {/* Always 3 columns — compact on mobile, full on desktop */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">

        {/* Telegram */}
        <a
          href="https://t.me/rojgarsuvidha"
          target="_blank"
          rel="noopener noreferrer"
          className="relative overflow-hidden bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl sm:rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 text-white shadow-md hover:shadow-lg transition-all group hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          <div className="relative z-10 bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
            <Send className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="relative z-10 flex flex-col items-center sm:items-start">
            <span className="font-extrabold text-[10px] sm:text-sm leading-tight tracking-wide text-center sm:text-left">JOIN<br className="sm:hidden" /> TELEGRAM</span>
            <span className="hidden sm:block text-[10px] font-medium text-blue-100">Fastest Job Updates</span>
          </div>
          <div className="absolute right-0 top-0 w-12 h-12 bg-white/10 rounded-full blur-xl" />
        </a>

        {/* WhatsApp */}
        <a
          href="https://whatsapp.com/channel/rojgarsuvidha"
          target="_blank"
          rel="noopener noreferrer"
          className="relative overflow-hidden bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-xl sm:rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 text-white shadow-md hover:shadow-lg transition-all group hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          <div className="relative z-10 bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
            <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500 border border-[#25D366]"></span>
            </span>
          </div>
          <div className="relative z-10 flex flex-col items-center sm:items-start">
            <span className="font-extrabold text-[10px] sm:text-sm leading-tight tracking-wide text-center sm:text-left">JOIN<br className="sm:hidden" /> WHATSAPP</span>
            <span className="hidden sm:block text-[10px] font-medium text-green-100">Daily Notifications</span>
          </div>
        </a>

        {/* YouTube */}
        <a
          href="https://youtube.com/@rojgarsuvidha"
          target="_blank"
          rel="noopener noreferrer"
          className="relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-700 rounded-xl sm:rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 text-white shadow-md hover:shadow-lg transition-all group hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          <div className="relative z-10 bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" /></svg>
          </div>
          <div className="relative z-10 flex flex-col items-center sm:items-start">
            <span className="font-extrabold text-[10px] sm:text-sm leading-tight tracking-wide text-center sm:text-left">SUBSCRIBE<br className="sm:hidden" /> YOUTUBE</span>
            <span className="hidden sm:block text-[10px] font-medium text-red-100">Form Fill-up Videos</span>
          </div>
        </a>

      </div>
    </section>
  );
}
