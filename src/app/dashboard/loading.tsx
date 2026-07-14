import React from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-indigo-500">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-bold text-gray-500 dark:text-gray-400 animate-pulse">Loading your dashboard...</p>
      </div>
    </div>
  );
}
