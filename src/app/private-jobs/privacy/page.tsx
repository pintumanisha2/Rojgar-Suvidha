import { ShieldCheck, Eye, EyeOff, Lock, UserCheck, Server } from"lucide-react";
import type { Metadata } from"next";

const BASE_URL ="https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
 title:"Corporate Privacy Policy | Rojgar Suvidha Private Sector",
 description:"Learn about how we protect your personal profile data, resume details, and employer listings on the Rojgar Suvidha Private Sector jobs portal.",
 keywords: [
"privacy policy","data safety","corporate privacy","rojgar suvidha secure",
"resume protection","verified candidates data"
 ],
 openGraph: {
 title:"Corporate Privacy Policy | Rojgar Suvidha Private Sector",
 description:"Data security, profile confidentiality, and recruiter data handling policy.",
 url:`${BASE_URL}/private-jobs/privacy`,
 siteName:"Rojgar Suvidha Private Sector",
 type:"website",
 },
 alternates: { canonical:`${BASE_URL}/private-jobs/privacy`},
};

export default function PrivateJobsPrivacyPage() {
 return (
 <div className="relative flex-grow bg-slate-50 py-16 px-4 overflow-hidden">
 {/* Premium Ambient Background Lighting */}
 <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none"/>
 <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none"/>
 
 <div className="relative max-w-4xl mx-auto bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/45 p-8 md:p-14 transition-all duration-500 hover:shadow-indigo-500/5">
 
 {/* Header Block */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-10 border-b border-slate-200/60 pb-8">
 <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-md">
 <ShieldCheck className="w-8 h-8"/>
 </div>
 <div>
 <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-700">
 Privacy Policy
 </h1>
 <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
 Data protection, confidentiality standards, and secure candidate guidelines.
 </p>
 </div>
 </div>

 {/* Content Sections */}
 <div className="space-y-10 text-slate-700 leading-relaxed font-medium">
 
 {/* Section 1 */}
 <section className="group relative pl-0 md:pl-6 transition-all duration-350">
 <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-indigo-500 transition-colors duration-300"/>
 <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight mb-3">
 <span className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:scale-115 transition-transform duration-300">
 <Lock className="w-4 h-4"/>
 </span>
 1. Commitment to Profile Security
 </h2>
 <p className="text-sm sm:text-base text-slate-600">
 At <strong className="text-slate-900">Rojgar Suvidha Private Sector Portal</strong>, we prioritize the protection of your personal information, resume credentials, and company recruiter registries. All candidate contact information, professional documents, and portfolio links are encrypted and safely routed only to verified corporate employers.
 </p>
 </section>

 {/* Section 2 */}
 <section className="group relative pl-0 md:pl-6 transition-all duration-350">
 <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-indigo-500 transition-colors duration-300"/>
 <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight mb-3">
 <span className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:scale-115 transition-transform duration-300">
 <Eye className="w-4 h-4"/>
 </span>
 2. Information We Collect
 </h2>
 <p className="text-sm sm:text-base text-slate-600 mb-4">
 We collect the minimum necessary data to match candidates with recruiters:
 </p>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/50">
 <h4 className="font-extrabold text-slate-950 text-sm mb-2">Candidate Profiles</h4>
 <p className="text-xs text-slate-500 leading-relaxed">
 Contact email, phone number, qualification info, resume uploads, and career preferences.
 </p>
 </div>
 <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/50">
 <h4 className="font-extrabold text-slate-950 text-sm mb-2">Recruiter Registries</h4>
 <p className="text-xs text-slate-500 leading-relaxed">
 Verified business license, HR email, company details, and job descriptions.
 </p>
 </div>
 <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/50">
 <h4 className="font-extrabold text-slate-950 text-sm mb-2">ATS Resume Data</h4>
 <p className="text-xs text-slate-500 leading-relaxed">
 Entered education and skill sets processed locally to format resumes.
 </p>
 </div>
 </div>
 </section>

 {/* Section 3 */}
 <section className="group relative pl-0 md:pl-6 transition-all duration-350">
 <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-indigo-500 transition-colors duration-300"/>
 <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight mb-3">
 <span className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:scale-115 transition-transform duration-300">
 <UserCheck className="w-4 h-4"/>
 </span>
 3. Data Confidentiality & Sharing
 </h2>
 <p className="text-sm sm:text-base text-slate-600 mb-3">
 Your contact details are <strong className="text-slate-900">never</strong> shared, rented, or leased to third-party marketing companies. Personal files are only made accessible to registered employers when you explicitly click the"Apply"CTA to submit an application.
 </p>
 <p className="text-sm sm:text-base text-slate-600">
 Recruiter profiles undergo manual credential verification to shield job seekers from phishing campaigns or fraudulent job listings.
 </p>
 </section>

 {/* Section 4 */}
 <section className="group relative pl-0 md:pl-6 transition-all duration-350">
 <div className="hidden md:block absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-hover:bg-indigo-500 transition-colors duration-300"/>
 <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight mb-3">
 <span className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:scale-115 transition-transform duration-300">
 <Server className="w-4 h-4"/>
 </span>
 4. Localized Execution
 </h2>
 <p className="text-sm sm:text-base text-slate-600">
 Tool services such as our <strong className="text-slate-900">AI Resume Builder</strong> process text fields locally in your browser. Raw values are not permanently stored on our database servers, allowing candidates to build, edit, and download documents offline without privacy risks.
 </p>
 </section>

 {/* Policy Footer */}
 <section className="pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <p className="text-xs text-slate-500">
 Last updated: May 20, 2026
 </p>
 <p className="text-xs text-slate-500">
 Have questions? Email us at <span className="text-indigo-600 font-bold select-all">corporate@rojgarsuvidha.com</span>
 </p>
 </section>

 </div>
 </div>
 </div>
 );
}
