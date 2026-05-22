"use client";

import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Animated 404 */}
        <div className="relative">
          <p className="text-[10rem] font-black text-indigo-100 dark:text-indigo-950 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-3xl px-8 py-6 shadow-2xl border border-indigo-100 dark:border-indigo-900">
              <div className="text-6xl mb-2">🔍</div>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                Page Nahi Mili!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Ye page exist nahi karta ya delete ho gaya hai
              </p>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 text-left space-y-3">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Shayad aap dhundh rahe the:
          </p>
          {[
            { href: "/", label: "🏠 Home — Sarkari Jobs, Results" },
            { href: "/latest-jobs", label: "Latest Government Jobs" },
            { href: "/results", label: "🏆 Exam Results 2025" },
            { href: "/admit-card", label: "🎫 Admit Card Download" },
            { href: "/e-suvidha", label: "🏛️ e-Suvidha — Cyber Cafe Services" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
            >
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Home className="w-5 h-5" /> Home Par Jao
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-4 rounded-2xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Pichhe Jao
          </button>
        </div>
      </div>
    </div>
  );
}
