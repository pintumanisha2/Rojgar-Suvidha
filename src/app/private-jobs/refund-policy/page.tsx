import { CircleDollarSign, ShieldCheck, AlertCircle, Sparkles } from"lucide-react";
import type { Metadata } from"next";

const BASE_URL ="https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
 title:"Fee & Refund Policy | Rojgar Suvidha Private Sector",
 description:"Learn about the fee structure and refund policies of the Rojgar Suvidha Private Sector portal. Direct jobs are 100% free for candidates.",
 keywords: [
"refund policy","private jobs cost","is rojgar suvidha free","hiring cost",
"job search fees"
 ],
 openGraph: {
 title:"Fee & Refund Policy | Rojgar Suvidha Private Sector",
 description:"Pricing transparency policy: Candidates apply 100% free. Warning against recruiters demanding processing fees.",
 url:`${BASE_URL}/private-jobs/refund-policy`,
 siteName:"Rojgar Suvidha Private Sector",
 type:"website",
 },
 alternates: { canonical:`${BASE_URL}/private-jobs/refund-policy`},
};

export default function PrivateJobsRefundPage() {
 return (
 <div className="relative flex-grow bg-slate-50 py-16 px-4 overflow-hidden">
 {/* Dynamic Background Tech Orbs */}
 <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none"/>
 <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none"/>
 
 <div className="relative max-w-4xl mx-auto bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/45 p-8 md:p-14 transition-all duration-500 hover:shadow-emerald-500/5">
 
 {/* Header Block */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-10 border-b border-slate-200/60 pb-8">
 <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-md">
 <CircleDollarSign className="w-8 h-8"/>
 </div>
 <div>
 <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-700">
 Fee &amp; Refund Policy
 </h1>
 <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
 Corporate pricing guidelines, fee transparency, and candidate protections.
 </p>
 </div>
 </div>

 {/* Content Sections */}
 <div className="space-y-10 text-slate-700 leading-relaxed font-medium">
 
 {/* Section 1 */}
 <section className="group relative pl-0 md:pl-6 transition-all duration-350">
 <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-emerald-500 transition-colors duration-300"/>
 <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight mb-3">
 <span className="bg-emerald-50 p-2 rounded-lg text-emerald-600 group-hover:scale-115 transition-transform duration-300">
 <Sparkles className="w-4 h-4"/>
 </span>
 1. 100% Free Candidate Services
 </h2>
 <p className="text-sm sm:text-base text-slate-600 mb-3">
 Applying for private sector jobs, browsing vacancies, utilizing our custom MNC partner feeds, and using our <strong className="text-slate-900">AI Resume Builder</strong> suite on the <strong className="text-slate-900">Rojgar Suvidha Private Sector Portal</strong> is completely <strong className="text-blue-700">FREE OF COST</strong>. 
 </p>
 <p className="text-sm sm:text-base text-slate-600">
 Candidates never need to register credit cards, make advance payments, or pay application fees. Since no fee is ever charged to candidates, <strong className="text-slate-800">no questions regarding candidate refunds apply</strong>.
 </p>
 </section>

 {/* Section 2 */}
 <section className="group relative pl-0 md:pl-6 transition-all duration-350">
 <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-emerald-500 transition-colors duration-300"/>
 <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight mb-3">
 <span className="bg-emerald-50 p-2 rounded-lg text-emerald-600 group-hover:scale-115 transition-transform duration-300">
 <AlertCircle className="w-4 h-4"/>
 </span>
 2. Recruiters Listing Fees
 </h2>
 <p className="text-sm sm:text-base text-slate-600">
 Direct job postings submitted by registered recruiters via the <strong className="text-slate-900">Employer Dashboard</strong> are currently free of charge as part of our initial corporate onboarding beta launch. If any paid subscription plans or premium employer metrics are introduced in the future, standard cancellation terms and transaction refund limits will be specified clearly on the billing dashboard before payment processing.
 </p>
 </section>

 {/* Section 3 */}
 <section className="group relative pl-0 md:pl-6 transition-all duration-350">
 <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-emerald-500 transition-colors duration-300"/>
 <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight mb-3">
 <span className="bg-emerald-50 p-2 rounded-lg text-emerald-600 group-hover:scale-115 transition-transform duration-300">
 <ShieldCheck className="w-4 h-4"/>
 </span>
 3. Anti-Scam Safeguard
 </h2>
 <p className="text-sm sm:text-base text-slate-600 mb-3">
 We enforce strict compliance policies prohibiting recruiters from posting paid placement listings. Under no circumstances should candidates pay processing fees, laptop security deposits, or verification costs. 
 </p>
 <p className="text-sm sm:text-base text-slate-600">
 If a recruiter or posting demands money from you, please report the listing immediately via our <a href="/private-jobs/contact-us"className="text-emerald-600 font-bold underline decoration-2 hover:text-emerald-500 transition-colors">Corporate Helpdesk</a> so we can terminate the recruiter registry and take action.
 </p>
 </section>

 {/* Policy Footer */}
 <section className="pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <p className="text-xs text-slate-500">
 Last updated: May 20, 2026
 </p>
 <p className="text-xs text-slate-500">
 Billing support email: <span className="text-emerald-600 font-bold select-all">corporate@rojgarsuvidha.com</span>
 </p>
 </section>

 </div>
 </div>
 </div>
 );
}
