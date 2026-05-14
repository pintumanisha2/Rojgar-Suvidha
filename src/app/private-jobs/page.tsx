import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Jobs 2025 | MNC, IT & Corporate Vacancies",
  description: "Find the latest private sector jobs, MNC vacancies, IT jobs, and corporate hiring opportunities on Rojgar Suvidha.",
  keywords: ["private jobs 2025", "mnc jobs", "it jobs india", "corporate jobs", "rojgar suvidha private jobs"],
  alternates: { canonical: "https://www.rojgarsuvidha.com/private-jobs" }
};

export default function PrivateJobsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 min-h-[60vh] bg-gray-50 dark:bg-gray-950">
      <div className="text-6xl mb-6">🏢</div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 text-center">
        Private Jobs Portal
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-lg mb-8">
        We are curating the best private sector opportunities for you. This section is currently under development. Stay tuned!
      </p>
      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-colors">
        Notify Me When Ready
      </button>
    </div>
  );
}
