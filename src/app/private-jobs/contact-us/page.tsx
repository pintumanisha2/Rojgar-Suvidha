import { PhoneCall, Mail, MapPin, Building2, ShieldCheck, HelpCircle } from "lucide-react";
import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
    title: "Contact Corporate Support | Rojgar Suvidha Private Sector",
    description: "Contact the Rojgar Suvidha Private Sector support desk for HR listings verification, recruiter partnerships, resume assistance, and candidate support.",
    keywords: [
        "contact private jobs", "recruiter support", "rojgar suvidha corporate",
        "mnc jobs support", "employer support", "rojgar suvidha hr team"
    ],
    openGraph: {
        title: "Contact Corporate Support | Rojgar Suvidha Private Sector",
        description: "Contact support for recruiter verification, job posting help, and candidate resume queries.",
        url: `${BASE_URL}/private-jobs/contact-us`,
        siteName: "Rojgar Suvidha Private Sector",
        type: "website",
    },
    alternates: { canonical: `${BASE_URL}/private-jobs/contact-us` },
};

export default function PrivateJobsContactPage() {
    return (
        <div className="relative flex-grow bg-slate-50 py-16 px-4 overflow-hidden">
            <div className="relative max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-8 md:p-14 transition-all duration-500">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-10 border-b border-slate-200/60 pb-8">
                    <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-md">
                        <PhoneCall className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-700">
                            Corporate Helpdesk
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
                            Dedicated support for private sector candidates, recruiters, and corporate HR managers.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Info Cards & Integrity Protection */}
                    <div className="lg:col-span-5 space-y-8">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900 mb-6 tracking-tight">
                                Corporate Channels
                            </h2>

                            <div className="space-y-4">
                                {/* Email Channel */}
                                <div className="group flex items-start gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all duration-300">
                                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100/50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Corporate Relations Email</h3>
                                        <p className="text-sm font-semibold text-blue-600 mt-0.5 select-all">corporate@rojgarsuvidha.com</p>
                                        <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Average HR response: 4 hours
                                        </span>
                                    </div>
                                </div>

                                {/* Phone Channel */}
                                <div className="group flex items-start gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all duration-300">
                                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100/50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                        <PhoneCall className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Partner Helpline</h3>
                                        <p className="text-sm font-semibold text-slate-700 mt-0.5">+91 88774 34088</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Mon - Sat (09:00 AM - 07:00 PM)</p>
                                    </div>
                                </div>

                                {/* Location Channel */}
                                <div className="group flex items-start gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all duration-300">
                                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100/50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Corporate Headquarters</h3>
                                        <p className="text-xs leading-relaxed text-slate-600 mt-1">
                                            Sector 62, Noida, Uttar Pradesh, India - 201309
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Platform Integrity Banner */}
                        <div className="relative overflow-hidden p-6 rounded-[2rem] border border-blue-100 bg-blue-50">
                            <h4 className="font-extrabold text-blue-900 text-sm flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                                100% Free Candidate Safeguard
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                Candidates never have to pay a single rupee to apply for verified private sector listings, MNC partner feeds, or our ATS resume suite. If anyone demands training fees, laptop deposits, or verification money, please report them immediately.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Premium Contact Form */}
                    <div className="lg:col-span-7">
                        <form className="relative overflow-hidden bg-slate-50 p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-md">

                            <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                                <Mail className="w-5 h-5 text-blue-500" />
                                Send Corporate Message
                            </h2>

                            <div className="space-y-5">
                                {/* Name Box */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide uppercase">Your Name</label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <input
                                            type="text"
                                            className="w-full bg-white/80 text-slate-900 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all duration-300 hover:border-slate-300"
                                            placeholder="Amit Sharma"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Box */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide uppercase">Email Address</label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <input
                                            type="email"
                                            className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all duration-300 hover:border-slate-300"
                                            placeholder="amit@company.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Designation Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide uppercase">I am a...</label>
                                    <select
                                        className="w-full bg-white/80 text-slate-900 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all duration-300 hover:border-slate-300 appearance-none cursor-pointer"
                                    >
                                        <option value="candidate">Job Candidate</option>
                                        <option value="recruiter">Employer / HR Recruiter</option>
                                        <option value="partner">Corporate Partner</option>
                                    </select>
                                </div>

                                {/* Message Box */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide uppercase">Message</label>
                                    <textarea
                                        rows={4}
                                        className="w-full bg-white/80 text-slate-900 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all duration-300 hover:border-slate-300 resize-none"
                                        placeholder="Write your support request details here..."
                                        required
                                    />
                                </div>

                                {/* Styled Submit Button */}
                                <button
                                    type="button"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-6 rounded-xl transition-all duration-300 shadow-md mt-2 flex items-center justify-center gap-2"
                                >
                                    <span>Submit Support Request</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
