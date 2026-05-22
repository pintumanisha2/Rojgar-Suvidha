import { Scale, ShieldCheck, AlertTriangle, FileText, Check } from"lucide-react";
import type { Metadata } from"next";

const BASE_URL ="https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
 title:"Corporate Terms of Service | Rojgar Suvidha Private Sector",
 description:"Read the recruiter listing rules, candidate guidelines, and terms of service governing the Rojgar Suvidha Private Sector jobs portal.",
 keywords: [
"terms of service","employer rules","job posting guidelines","rojgar suvidha terms",
"private job terms"
 ],
 openGraph: {
 title:"Corporate Terms of Service | Rojgar Suvidha Private Sector",
 description:"Terms governing candidate applications and recruiter listings on the private sector portal.",
 url:`${BASE_URL}/private-jobs/terms`,
 siteName:"Rojgar Suvidha Private Sector",
 type:"website",
 },
 alternates: { canonical:`${BASE_URL}/private-jobs/terms`},
};

export default function PrivateJobsTermsPage() {
 return (
 <div className="relative flex-grow bg-slate-50 py-16 px-4 overflow-hidden">
 {/* Dynamic Background Tech Orbs */}
 <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none"/>
 <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none"/>
 
 <div className="relative max-w-4xl mx-auto bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/45 p-8 md:p-14 transition-all duration-500 hover:shadow-purple-500/5">
 
 {/* Header Block */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-10 border-b border-slate-200/60 pb-8">
 <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-md">
 <Scale className="w-8 h-8"/>
 </div>
 <div>
 <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-700">
 Terms of Service
 </h1>
 <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
 General terms, recruitment policies, and safety guidelines for job seekers.
 </p>
 </div>
 </div>

 {/* Content Sections */}
 <div className="space-y-10 text-slate-700 leading-relaxed font-medium">
 
 {/* Section 1 */}
 <section className="group relative pl-0 md:pl-6 transition-all duration-350">
 <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-purple-500 transition-colors duration-300"/>
 <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight mb-3">
 <span className="bg-purple-50 p-2 rounded-lg text-purple-600 group-hover:scale-115 transition-transform duration-300">
 <ShieldCheck className="w-4 h-4"/>
 </span>
 1. Recruiter Vetting & Approvals
 </h2>
 <p className="text-sm sm:text-base text-slate-600 mb-4">
 All recruiters posting jobs via the <strong className="text-slate-900">Employer Dashboard</strong> are required to represent genuine vacancies. Every job listing is initially saved as <code className="bg-slate-100 px-1.5 py-0.5 rounded text-purple-600 text-xs">"pending_approval"</code> and undergoes a manual review. We reserve the absolute right to suspend recruiter accounts or reject listings that show signs of:
 </p>
 <ul className="space-y-2.5">
 <li className="flex items-start gap-3 text-sm text-slate-600">
 <div className="mt-1 bg-red-100 text-red-600 p-1 rounded-full text-xs">
 <Check className="w-3 h-3"/>
 </div>
 <span>Demanding payments, caution deposits, or training fees from applicants.</span>
 </li>
 <li className="flex items-start gap-3 text-sm text-slate-600">
 <div className="mt-1 bg-red-100 text-red-600 p-1 rounded-full text-xs">
 <Check className="w-3 h-3"/>
 </div>
 <span>Multi-Level Marketing (MLM), chain referrals, or unvetted work arrangements.</span>
 </li>
 <li className="flex items-start gap-3 text-sm text-slate-600">
 <div className="mt-1 bg-red-100 text-red-600 p-1 rounded-full text-xs">
 <Check className="w-3 h-3"/>
 </div>
 <span>Misleading descriptions of salary, duties, or corporate location.</span>
 </li>
 </ul>
 </section>

 {/* Section 2 */}
 <section className="group relative pl-0 md:pl-6 transition-all duration-350">
 <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-purple-500 transition-colors duration-300"/>
 <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight mb-3">
 <span className="bg-purple-50 p-2 rounded-lg text-purple-600 group-hover:scale-115 transition-transform duration-300">
 <FileText className="w-4 h-4"/>
 </span>
 2. Candidate Guidelines
 </h2>
 <p className="text-sm sm:text-base text-slate-600">
 Job seekers must furnish accurate professional details when applying for positions or creating ATS resumes. Presenting falsified credentials or impersonating other individuals will result in permanent suspension from the portal.
 </p>
 </section>

 {/* Section 3 */}
 <section className="group relative pl-0 md:pl-6 transition-all duration-350">
 <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-purple-500 transition-colors duration-300"/>
 <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight mb-3">
 <span className="bg-purple-50 p-2 rounded-lg text-purple-600 group-hover:scale-115 transition-transform duration-300">
 <AlertTriangle className="w-4 h-4"/>
 </span>
 3. Fraud Prevention & Disclaimers
 </h2>
 <p className="text-sm sm:text-base text-slate-600 mb-4">
 While we perform checks on direct postings and curate listings from reliable partners, we are not liable for external agreements entered into between candidates and hiring companies. 
 </p>
 
 {/* Warning Callout */}
 <div className="relative overflow-hidden p-5 rounded-2xl border border-blue-200 bg-blue-50 text-blue-800">
 <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-lg pointer-events-none"/>
 <div className="flex items-start gap-3">
 <span className="text-lg mt-0.5">⚠️</span>
 <div>
 <h4 className="font-extrabold text-sm mb-1 uppercase tracking-wider text-amber-900">Crucial Warning</h4>
 <p className="text-xs leading-relaxed text-amber-800 font-medium">
 Never pay money to any company or agent representing themselves as hiring partners on our platform. Real hiring processes do not demand advance money or placement caution fees.
 </p>
 </div>
 </div>
 </div>
 </section>

 {/* Policy Footer */}
 <section className="pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <p className="text-xs text-slate-500">
 Last updated: May 20, 2026
 </p>
 <p className="text-xs text-slate-500">
 For terms inquiries, email us at <span className="text-purple-600 font-bold select-all">corporate@rojgarsuvidha.com</span>
 </p>
 </section>

 </div>
 </div>
 </div>
 );
}
