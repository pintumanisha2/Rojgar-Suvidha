import Link from "next/link";
import { ArrowRight, FileText, BadgeCheck, Sparkles, Shield, Compass } from "lucide-react";

const popularServices = [
  { id: "pan-new", slug: "apply-new-pan-card-online", name: "New PAN Card", desc: "Aadhaar Card se online PAN Card apply karein.", price: "₹150", icon: "💳", badge: "Instant Apply" },
  { id: "voter-new", slug: "apply-new-voter-id-card", name: "New Voter ID", desc: "Naya voter card apply aur verify karein.", price: "₹100", icon: "🗳️", badge: "Trending" },
  { id: "pcc", slug: "apply-police-clearance-certificate-pcc", name: "Police Clearance (PCC)", desc: "PCC / Character certificate online apply karein.", price: "₹200", icon: "👮", badge: "Required" },
  { id: "itr-nil", slug: "itr-filing-nil-return", name: "ITR Filing (Nil)", desc: "Apna Nil Income Tax Return file karwayein.", price: "₹300", icon: "📊", badge: "Tax Saver" },
];

export default function FeaturedServices() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
      
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white leading-tight">
            Ghar Baithe Banwayein Govt Documents
          </h2>
          <span className="text-xs text-gray-400 hidden md:inline">• 15+ Digital Services</span>
        </div>
        <Link 
          href="/e-suvidha" 
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 flex items-center gap-1"
        >
          Sabhi Services <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Compact Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {popularServices.map((service) => (
          <div 
            key={service.id} 
            className="group bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-2xl shrink-0">{service.icon}</span>
                {service.badge && (
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    {service.badge}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                {service.name}
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 line-clamp-1 mt-0.5">
                {service.desc}
              </p>
            </div>
            
            <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-2 flex items-center justify-between mt-2">
              <span className="text-xs font-black text-gray-900 dark:text-white">{service.price}</span>
              <Link 
                href={`/e-suvidha/apply/${service.id}`}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-black rounded-lg transition-all shadow-sm"
              >
                Apply
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Ultra-Compact Trust Badges */}
      <div className="mt-3 flex items-center justify-between gap-2 bg-gray-50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 rounded-xl px-3 py-2 text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>100% Safe Payment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Verified Govt Portals</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Zero Error Guarantee</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Ghar Baithe Tracking</span>
        </div>
      </div>

    </section>
  );
}
