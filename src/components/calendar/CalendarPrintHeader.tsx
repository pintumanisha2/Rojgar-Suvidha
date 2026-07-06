"use client";

import React from "react";
import { Printer, Calendar } from "lucide-react";
import Link from "next/link";

export default function CalendarPrintHeader() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="w-full max-w-7xl bg-white dark:bg-gray-900 shadow-md rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 no-print border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-indigo-600" />
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Your Print Preview</h1>
          <p className="text-xs text-gray-500">Scale matches landscape A4 size sheet.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href="/"
          className="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Go to Home
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>
    </div>
  );
}
