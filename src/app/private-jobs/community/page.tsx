import React from"react";
import CommunityFeed from"./CommunityFeed";
import Link from"next/link";
import { ArrowLeft, Users2, Info } from"lucide-react";
import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Private Jobs Community Forum | Interview Tips & Discussions",
  description: "Join the largest community of private sector job seekers on Rojgar Suvidha. Share interview tips, company reviews, and ask career questions.",
  keywords: [
    "job search community", "interview tips forum", "private jobs discussion",
    "fresher career advice", "rojgar suvidha community", "company reviews"
  ],
  alternates: { canonical: `${BASE_URL}/private-jobs/community` },
  openGraph: {
    title: "Private Jobs Community Forum | Rojgar Suvidha",
    description: "Connect with thousands of aspirants. Discuss interview rounds, company culture, and share resources.",
    url: `${BASE_URL}/private-jobs/community`,
    type: "website",
    siteName: "Rojgar Suvidha",
  },
};

export default function PrivateJobsCommunityPage() {
 return (
 <div className="min-h-screen bg-gray-50 pb-20">
 
 {/* Hero Section */}
 <div className="bg-indigo-600 pt-8 pb-20 px-4 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"/>
 <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl"/>
 
 <div className="max-w-4xl mx-auto relative z-10">
 <Link href="/private-jobs"className="inline-flex items-center gap-2 text-indigo-100 hover:text-white mb-6 font-semibold transition-colors">
 <ArrowLeft className="w-4 h-4"/> Back to Private Jobs
 </Link>
 
 <div className="flex items-center gap-4 mb-4">
 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
 <Users2 className="w-6 h-6 text-white"/>
 </div>
 <h1 className="text-3xl md:text-4xl font-black text-white">Career Community</h1>
 </div>
 <p className="text-indigo-100 text-lg max-w-2xl font-medium">
 Connect with thousands of aspirants. Discuss interview rounds, company culture, and share resources across different sectors.
 </p>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-20">
 <div className="grid grid-cols-1 gap-6">
 
 {/* Main Feed Component */}
 <CommunityFeed />
 
 {/* Rules/Info Card below the feed on mobile, could be sidebar on desktop */}
 <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm mt-4">
 <div className="flex items-start gap-3">
 <Info className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5"/>
 <div>
 <h3 className="font-extrabold text-gray-900 mb-2">Community Guidelines</h3>
 <ul className="space-y-2 text-sm text-gray-600 font-medium">
 <li>• <strong className="text-gray-900">Respect everyone:</strong> Abusive language will result in an instant ban.</li>
 <li>• <strong className="text-gray-900">No self-promotion:</strong> Do not share personal links, phone numbers, or emails.</li>
 <li>• <strong className="text-gray-900">Stay on topic:</strong> Use the correct category for your posts.</li>
 <li>• <strong className="text-gray-900">Help each other:</strong> Share genuine interview experiences and resources.</li>
 </ul>
 </div>
 </div>
 </div>
 
 </div>
 </div>
 </div>
 );
}
