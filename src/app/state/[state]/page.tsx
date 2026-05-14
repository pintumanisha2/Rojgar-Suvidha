import { MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import MainContent from "@/components/home/MainContent";
import Highlights from "@/components/home/Highlights";
import SocialPromo from "@/components/home/SocialPromo";

export default async function StateJobsPage({ params }: { params: Promise<{ state: string }> }) {
  const resolvedParams = await params;
  const stateCode = resolvedParams.state.toUpperCase();

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-6">
      <div className="max-w-7xl mx-auto px-4 mb-2">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-5">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl shrink-0 border border-blue-200 dark:border-blue-800">
              <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                State Jobs: <span className="text-indigo-600 dark:text-indigo-400">{stateCode}</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm max-w-lg">
                Showing all the latest government and private job openings, results, and admit cards exclusively for {stateCode}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Call to Action */}
      <SocialPromo />

      {/* Feature Highlights (Apply For Me & YouTube) */}
      <Highlights />

      {/* Render the exact same grid layout as Homepage, but pass stateCode so it changes titles */}
      <MainContent stateCode={stateCode} />
      
    </div>
  );
}
