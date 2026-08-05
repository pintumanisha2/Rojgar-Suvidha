import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

interface CompetitorTrustBannerProps {
  jobTitle?: string;
  applyUrl?: string;
}

export default function CompetitorTrustBanner({ jobTitle, applyUrl }: CompetitorTrustBannerProps) {
  return (
    <div className="my-6 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-gray-950 shadow-xl border border-amber-300 relative overflow-hidden group">
      {/* Background Subtle Sparkle Effect */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-gray-950 text-amber-400 uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Cyber Cafe Se Azadi • 100% Accuracy Guarantee
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight leading-snug text-gray-950">
            Sarkari Result Par Sirf Notification Dekho! <br className="hidden sm:inline" />
            <span className="underline decoration-gray-950 underline-offset-4">
              Rojgar Suvidha Par 1-Click Mein Form Bhartao!
            </span>
          </h3>
          <p className="text-xs font-semibold text-gray-900/90 leading-relaxed">
            {jobTitle ? `Aapka ${jobTitle} ka online form humare experts bharenge.` : "Aapka sarkari naukri form humare verified experts bharenge."} Photo/Signature compression aur form mistake ki zero tension!
          </p>
        </div>

        <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          <Link
            href={applyUrl || "/e-suvidha"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-950 hover:bg-gray-900 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            Apply For Me (Form Bhartao) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
