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
    <section className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> e-Suvidha Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Ghar Baithe Banwayein Government Documents
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 mt-2 text-sm sm:text-base max-w-2xl">
            Cyber cafe jaane ki koi tension nahi. Bas documents submit karein, hamare experts aapka Voter ID, PAN card, ITR aur certificates safely apply karenge.
          </p>
        </div>
        <Link 
          href="/e-suvidha" 
          className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 hover:gap-2.5 transition-all"
        >
          Sabhi 15+ Services Dekhein <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {popularServices.map((service) => (
          <div 
            key={service.id} 
            className="group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{service.icon}</span>
                {service.badge && (
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {service.badge}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {service.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed mt-2 mb-4">
                {service.desc}
              </p>
            </div>
            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 flex items-center justify-between mt-auto">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Service Fee</p>
                <p className="text-lg font-black text-gray-900 dark:text-white">{service.price}</p>
              </div>
              <Link 
                href={`/e-suvidha/apply/${service.id}`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm group-hover:scale-105 active:scale-95"
              >
                Apply Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-900 rounded-3xl p-5">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">100% Safe Payment</span>
        </div>
        <div className="flex items-center gap-2.5">
          <BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Verified Govt Portals</span>
        </div>
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Zero Error Guarantee</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Ghar Baithe Tracking</span>
        </div>
      </div>

    </section>
  );
}
